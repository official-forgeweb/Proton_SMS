import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generateProId = (): string =>
  `PRO${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/students
router.get('/', authenticateToken, authorize('admin', 'teacher'), cacheMiddleware(10), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, class_id, subject, fee_status, global_search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let where: any = {};

    if (req.user!.role === 'teacher' && global_search !== 'true') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id }, select: { id: true } });
      if (teacher) {
        const myClasses = await prisma.class.findMany({
          where: {
            OR: [
              { primary_teacher_id: teacher.id },
              { schedule: { some: { teacher_id: teacher.id } } }
            ]
          },
          select: { id: true },
        });
        const classIds = myClasses.map(c => c.id);

        if (class_id && isUUID(class_id)) {
          if (!classIds.includes(class_id)) {
            res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: limitNum, pages: 0 } });
            return;
          }
        } else {
          const enrollments = await prisma.studentClassEnrollment.findMany({
            where: { class_id: { in: classIds } },
            select: { student_id: true },
          });
          const studentIds = enrollments.map(e => e.student_id);
          where.id = { in: studentIds };
        }
      }
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' as const } },
        { last_name: { contains: search, mode: 'insensitive' as const } },
        { PRO_ID: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (status) where.academic_status = status;

    // Filter by subject within a batch
    if (class_id && subject) {
      const subjectEnrollments = await prisma.studentSubjectEnrollment.findMany({
        where: { class_id, subject, status: 'active' },
        select: { student_id: true },
      });
      const studentIds = subjectEnrollments.map(e => e.student_id);
      where.id = where.id ? { in: (where.id.in || []).filter((id: string) => studentIds.includes(id)) } : { in: studentIds };
    } else if (class_id) {
      const enrollments = await prisma.studentClassEnrollment.findMany({
        where: { class_id, enrollment_status: 'active' },
        select: { student_id: true },
      });
      const studentIds = enrollments.map(e => e.student_id);
      where.id = where.id ? { in: (where.id.in || []).filter((id: string) => studentIds.includes(id)) } : { in: studentIds };
    }

    // Run count + data fetch in PARALLEL with included relations (reduces DB round-trips from 5 to 2)
    const skip = (pageNum - 1) * limitNum;
    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true, PRO_ID: true, first_name: true, last_name: true,
          email: true, phone: true, gender: true, academic_status: true,
          fee_assignments: {
            take: 1,
            select: { payment_status: true, final_fee: true, total_paid: true },
          },
          class_enrollments: {
            where: { enrollment_status: 'active' },
            select: {
              overall_attendance_percentage: true,
              class: { select: { id: true, class_name: true, class_code: true } },
            },
          },
          subject_enrollments: {
            where: { status: 'active' },
            select: { subject: true, class_id: true, status: true },
          },
        },
      }),
    ]);

    let enrichedStudents: any[] = students.map(s => ({
      id: s.id, PRO_ID: s.PRO_ID, first_name: s.first_name, last_name: s.last_name,
      email: s.email, phone: s.phone, gender: s.gender, academic_status: s.academic_status,
      fee_status: s.fee_assignments[0]?.payment_status || 'pending',
      total_fee: s.fee_assignments[0]?.final_fee || 0,
      total_paid: s.fee_assignments[0]?.total_paid || 0,
      classes: s.class_enrollments.map((e: any) => ({
        id: e.class?.id, name: e.class?.class_name, code: e.class?.class_code,
      })),
      subjects: s.subject_enrollments.map((se: any) => ({
        subject: se.subject, class_id: se.class_id, status: se.status,
      })),
      attendance_percentage: s.class_enrollments[0]?.overall_attendance_percentage || 0,
    }));

    if (fee_status) enrichedStudents = enrichedStudents.filter(s => s.fee_status === fee_status);

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/stats
router.get('/stats', authenticateToken, authorize('admin', 'teacher'), cacheMiddleware(30), async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, active, maleCount, femaleCount, feeAgg] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { academic_status: 'active' } }),
      prisma.student.count({ where: { gender: 'male' } }),
      prisma.student.count({ where: { gender: 'female' } }),
      prisma.studentFeeAssignment.groupBy({
        by: ['payment_status'],
        _count: true,
        _sum: { total_paid: true, total_pending: true },
      }),
    ]);

    const inactive = total - active;

    let fully_paid = 0, partial = 0, pending = 0, overdue = 0, totalPaid = 0, totalPending = 0;
    feeAgg.forEach(g => {
      if (g.payment_status === 'paid') fully_paid = g._count;
      if (g.payment_status === 'partial') partial = g._count;
      if (g.payment_status === 'pending') pending = g._count;
      if (g.payment_status === 'overdue') overdue = g._count;
      totalPaid += g._sum.total_paid || 0;
      totalPending += g._sum.total_pending || 0;
    });

    res.json({
      success: true,
      data: {
        total, active, inactive,
        gender: { male: maleCount, female: femaleCount },
        fee: { fully_paid, partial, pending, overdue },
        revenue: { total: totalPaid, pending: totalPending },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = isUUID(id)
      ? await prisma.student.findUnique({ where: { id } })
      : await prisma.student.findUnique({ where: { PRO_ID: id } });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const [enrollments, subjectEnrollments, feeAssignment, payments, parentMapping, recentTests] = await Promise.all([
      prisma.studentClassEnrollment.findMany({
        where: { student_id: student.id },
        include: { class: { include: { schedule: true } } },
      }),
      prisma.studentSubjectEnrollment.findMany({
        where: { student_id: student.id, status: 'active' },
      }),
      prisma.studentFeeAssignment.findFirst({ where: { student_id: student.id } }),
      prisma.feePayment.findMany({ where: { student_id: student.id } }),
      prisma.parentStudentMapping.findFirst({
        where: { student_id: student.id },
        include: { parent: true },
      }),
      prisma.testResult.findMany({
        where: { student_id: student.id },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { test: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...student,
        id: student.id,
        classes: enrollments.map((e: any) => ({
          ...e.class,
          enrollment: { ...e, class_id: e.class_id },
        })),
        subject_enrollments: subjectEnrollments,
        fee: feeAssignment,
        payments,
        parent: parentMapping?.parent,
        recent_tests: recentTests.map((tr: any) => ({ ...tr, test: tr.test })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students/bulk - Bulk import students
router.post('/bulk', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { students } = req.body;
    
    if (!students || !Array.isArray(students)) {
      res.status(400).json({ success: false, message: 'Students array is required' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      try {
        const { first_name, last_name, date_of_birth, gender, email, phone, school_name, class_id, admission_type } = student;

        if (!first_name || !phone) {
          errors.push(`Row ${i + 1}: Missing required fields (first_name or phone)`);
          continue;
        }

        const fName = (first_name || 'student').toLowerCase();
        const lName = (last_name || '').toLowerCase();
        const userEmail = email || `${fName}.${lName}.${Math.floor(Math.random() * 10000)}@proton.com`;

        const existingEmail = await prisma.user.findUnique({ where: { email: userEmail } });
        if (existingEmail) {
          errors.push(`Row ${i + 1}: Email already exists - ${userEmail}`);
          continue;
        }

        const user = await prisma.user.create({
          data: {
            email: userEmail,
            password_hash: await bcrypt.hash(`Proton@${Math.floor(1000 + Math.random() * 9000)}`, salt),
            role: 'student',
          },
        });

        const proId = generateProId();
        const newStudent = await prisma.student.create({
          data: {
            user_id: user.id,
            PRO_ID: proId,
            first_name,
            last_name,
            date_of_birth: date_of_birth || null,
            gender: gender || 'male',
            email,
            phone,
            school_name,
            enrollment_date: new Date().toISOString(),
            enrollment_number: `ENR${proId}`,
            admission_type: admission_type || 'fresh',
          },
        });

        if (class_id) {
          await prisma.studentClassEnrollment.create({
            data: {
              student_id: newStudent.id,
              class_id,
              enrollment_date: new Date().toISOString(),
            },
          });
          await prisma.class.update({
            where: { id: class_id },
            data: { current_students_count: { increment: 1 } },
          });
        }

        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    invalidateCache('/api/students');
    res.status(201).json({
      success: true,
      data: { created, failed: students.length - created, errors },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/students
router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, date_of_birth, gender, email, phone, school_name, class_id, admission_type, parent_name, parent_phone, parent_email, parent_relationship } = req.body;

    const salt = await bcrypt.genSalt(10);
    let password = `Proton@${Math.floor(1000 + Math.random() * 9000)}`;

    if (date_of_birth) {
      const parts = date_of_birth.split('-');
      if (parts.length === 3) {
        const year = parts[0].substring(2, 4);
        const month = parts[1];
        const day = parts[2];
        password = `${day}${month}${year}`;
      }
    }

    const fName = (first_name || 'student').toLowerCase();
    const lName = (last_name || '').toLowerCase();
    const userEmail = email || `${fName}.${lName}.${Math.floor(Math.random() * 10000)}@proton.com`;

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password_hash: await bcrypt.hash(password, salt),
        role: 'student',
      },
    });

    const proId = generateProId();
    const student = await prisma.student.create({
      data: {
        user_id: user.id,
        PRO_ID: proId,
        first_name,
        last_name,
        date_of_birth,
        gender,
        email,
        phone,
        school_name,
        enrollment_date: new Date().toISOString(),
        enrollment_number: `ENR${proId}`,
        admission_type: admission_type || 'fresh',
      },
    });

    // Enroll in subjects if subjects array provided (per class)
    const { subjects, class_ids } = req.body;
    
    // Support both single class_id and multiple class_ids
    const allClassIds: string[] = [];
    if (class_ids && Array.isArray(class_ids)) {
      allClassIds.push(...class_ids);
    } else if (class_id) {
      allClassIds.push(class_id);
    }

    // Enroll student in all selected classes
    for (const cid of allClassIds) {
      await prisma.studentClassEnrollment.create({
        data: {
          student_id: student.id,
          class_id: cid,
          enrollment_date: new Date().toISOString(),
        },
      });
      await prisma.class.update({
        where: { id: cid },
        data: { current_students_count: { increment: 1 } },
      });
    }

    // Enroll in subjects - supports both flat array and per-class map
    // subjects can be: ["Physics", "Maths"] (legacy, applied to class_id)
    // OR: { "class-uuid-1": ["Physics"], "class-uuid-2": ["Chemistry"] }
    if (subjects) {
      if (Array.isArray(subjects) && subjects.length > 0 && allClassIds.length > 0) {
        // Legacy flat array - apply to first class
        const targetClassId = class_id || allClassIds[0];
        await prisma.studentSubjectEnrollment.createMany({
          data: subjects.map((subj: string) => ({
            student_id: student.id,
            class_id: targetClassId,
            subject: subj,
            enrollment_date: new Date().toISOString(),
            status: 'active',
          })),
          skipDuplicates: true,
        });
      } else if (typeof subjects === 'object' && !Array.isArray(subjects)) {
        // Per-class subject map
        for (const [cid, subjectList] of Object.entries(subjects)) {
          if (Array.isArray(subjectList) && subjectList.length > 0) {
            await prisma.studentSubjectEnrollment.createMany({
              data: (subjectList as string[]).map((subj: string) => ({
                student_id: student.id,
                class_id: cid,
                subject: subj,
                enrollment_date: new Date().toISOString(),
                status: 'active',
              })),
              skipDuplicates: true,
            });
          }
        }
      }
    }

    if (parent_name && parent_phone) {
      const pLName = (last_name || '').toLowerCase();
      const parentUser = await prisma.user.create({
        data: {
          email: parent_email || `parent.${pLName}.${Math.floor(Math.random() * 10000)}@proton.com`,
          password_hash: await bcrypt.hash(`Parent@${Math.floor(1000 + Math.random() * 9000)}`, salt),
          role: 'parent',
        },
      });
      const parent = await prisma.parent.create({
        data: {
          user_id: parentUser.id,
          first_name: parent_name,
          last_name,
          email: parent_email,
          phone: parent_phone,
        },
      });
      await prisma.parentStudentMapping.create({
        data: {
          parent_id: parent.id,
          student_id: student.id,
          relationship: parent_relationship || 'father',
        },
      });
    }

    invalidateCache('/api/students');
    res.status(201).json({
      success: true,
      data: {
        student: { ...student, id: student.id },
        credentials: { email: student.email, password, pro_id: proId },
      },
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      res.status(400).json({ success: false, message: `An account with this ${field} already exists. Please use a different one.` });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PUT /api/students/:id
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { class_ids, subjects, ...studentFields } = req.body;

    // Update basic student info
    const student = await prisma.student.update({
      where: { id },
      data: studentFields,
    });

    // If class_ids provided, sync class enrollments
    if (class_ids && Array.isArray(class_ids)) {
      const existing = await prisma.studentClassEnrollment.findMany({
        where: { student_id: id },
        select: { class_id: true },
      });
      const existingIds = existing.map(e => e.class_id);
      
      // Add new enrollments
      const toAdd = class_ids.filter((cid: string) => !existingIds.includes(cid));
      for (const cid of toAdd) {
        await prisma.studentClassEnrollment.create({
          data: { student_id: id, class_id: cid, enrollment_date: new Date().toISOString() },
        });
        await prisma.class.update({ where: { id: cid }, data: { current_students_count: { increment: 1 } } });
      }

      // Remove old enrollments
      const toRemove = existingIds.filter(cid => !class_ids.includes(cid));
      for (const cid of toRemove) {
        await prisma.studentClassEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
        await prisma.studentSubjectEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
        await prisma.class.update({ where: { id: cid }, data: { current_students_count: { decrement: 1 } } });
      }
    }

    // If subjects map provided { class_id: ["subject1", "subject2"] }, sync per-class
    if (subjects && typeof subjects === 'object' && !Array.isArray(subjects)) {
      for (const [cid, subjectList] of Object.entries(subjects)) {
        if (!Array.isArray(subjectList)) continue;
        // Remove old subject enrollments for this class
        await prisma.studentSubjectEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
        // Create new ones
        if ((subjectList as string[]).length > 0) {
          await prisma.studentSubjectEnrollment.createMany({
            data: (subjectList as string[]).map((subj: string) => ({
              student_id: id,
              class_id: cid,
              subject: subj,
              enrollment_date: new Date().toISOString(),
              status: 'active',
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    invalidateCache('/api/students');
    res.json({ success: true, data: { ...student, id: student.id } });
  } catch (error: any) {
    console.error('PUT /students/:id error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/students/:id/enroll
router.post('/:id/enroll', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { class_id, subjects } = req.body;
    if (!class_id) {
      res.status(400).json({ success: false, message: 'Class ID is required' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const existing = await prisma.studentClassEnrollment.findFirst({
      where: { student_id: student.id, class_id },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'Student already enrolled in this class' });
      return;
    }

    const enrollment = await prisma.studentClassEnrollment.create({
      data: {
        student_id: student.id,
        class_id,
        enrollment_date: new Date().toISOString(),
        enrollment_status: 'active',
      },
    });

    // Enroll in specific subjects if provided
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      await prisma.studentSubjectEnrollment.createMany({
        data: subjects.map((subj: string) => ({
          student_id: student.id,
          class_id,
          subject: subj,
          enrollment_date: new Date().toISOString(),
          status: 'active',
        })),
        skipDuplicates: true,
      });
    }

    await prisma.class.update({
      where: { id: class_id },
      data: { current_students_count: { increment: 1 } },
    });

    res.json({ success: true, message: 'Student enrolled successfully', data: enrollment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id/attendance
router.get('/:id/attendance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = isUUID(id)
      ? await prisma.student.findUnique({ where: { id } })
      : await prisma.student.findUnique({ where: { PRO_ID: id } });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const { month, year } = req.query as Record<string, string>;
    let attWhere: any = { student_id: student.id };
    if (month && year) {
      const prefix = `${year}-${String(parseInt(month)).padStart(2, '0')}`;
      attWhere.attendance_date = { startsWith: prefix };
    }

    const records = await prisma.attendance.findMany({
      where: attWhere,
      orderBy: { attendance_date: 'desc' },
    });

    const totalRecords = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;

    res.json({
      success: true,
      data: {
        records,
        summary: {
          total: totalRecords,
          present,
          absent: totalRecords - present - late,
          late,
          percentage: totalRecords > 0 ? ((present + late) / totalRecords * 100).toFixed(1) : 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id/tests
router.get('/:id/tests', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = isUUID(id)
      ? await prisma.student.findUnique({ where: { id } })
      : await prisma.student.findUnique({ where: { PRO_ID: id } });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const results = await prisma.testResult.findMany({
      where: { student_id: student.id },
      include: { test: true },
    });

    const validResults = results.map((tr: any) => ({ ...tr, test: tr.test }));
    const avgPercentage = validResults.length > 0
      ? (validResults.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / validResults.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        results: validResults,
        summary: {
          total_tests: validResults.length,
          average_percentage: parseFloat(String(avgPercentage)),
          passed: validResults.filter((r: any) => r.pass_fail === 'pass').length,
          failed: validResults.filter((r: any) => r.pass_fail === 'fail').length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id/fees
router.get('/:id/fees', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = isUUID(id)
      ? await prisma.student.findUnique({ where: { id } })
      : await prisma.student.findUnique({ where: { PRO_ID: id } });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const assignment = await prisma.studentFeeAssignment.findFirst({ where: { student_id: student.id } });
    const payments = await prisma.feePayment.findMany({ where: { student_id: student.id } });
    const structure = assignment?.fee_structure_id
      ? await prisma.feeStructure.findUnique({ where: { id: assignment.fee_structure_id } })
      : null;

    res.json({ success: true, data: { assignment, payments, structure } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id/homework-history
router.get('/:id/homework-history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    let student: any = null;

    if (id === 'me' && req.user?.role === 'student') {
      student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
    } else if (isUUID(id)) {
      student = await prisma.student.findUnique({ where: { id } });
    } else {
      student = await prisma.student.findUnique({ where: { PRO_ID: id } });
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        student_id: student.id,
        status: { in: ['submitted', 'late', 'evaluated'] },
      },
      include: { homework: true },
      orderBy: { submission_date: 'desc' },
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/students/:id/performance
router.get('/:id/performance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    let student: any = null;

    if (id === 'me' && req.user?.role === 'student') {
      student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
    } else if (isUUID(id)) {
      student = await prisma.student.findUnique({ where: { id } });
    } else {
      student = await prisma.student.findUnique({ where: { PRO_ID: id } });
    }

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const results = await prisma.testResult.findMany({
      where: { student_id: student.id },
      include: { test: true },
    });

    const subjectPerformance: Record<string, { total: number; count: number }> = {};
    results.forEach((r: any) => {
      const subject = r.test?.subject || 'General';
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, count: 0 };
      }
      subjectPerformance[subject].total += r.percentage || 0;
      subjectPerformance[subject].count += 1;
    });

    const subjectAnalytics = Object.keys(subjectPerformance).map(s => ({
      subject: s,
      average: parseFloat((subjectPerformance[s].total / subjectPerformance[s].count).toFixed(1)),
    }));

    const trend = results
      .filter((r: any) => r.test)
      .sort((a: any, b: any) => new Date(a.test.test_date || '').getTime() - new Date(b.test.test_date || '').getTime())
      .map((r: any) => ({
        date: r.test.test_date,
        score: r.percentage,
        name: r.test.test_name,
      }));

    res.json({ success: true, data: { subjectAnalytics, trend } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/students/:id
router.post('/delete-many', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400).json({ success: false, message: 'IDs array required' });
      return;
    }
    await prisma.student.deleteMany({ where: { id: { in: ids } } });
    invalidateCache('/api/students');
    res.json({ success: true, message: 'Students deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/students/:id/subjects - Update subject enrollments for a student
router.put('/:id/subjects', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { class_id, subjects } = req.body;

    if (!class_id || !subjects || !Array.isArray(subjects)) {
      res.status(400).json({ success: false, message: 'class_id and subjects array are required' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Remove all existing subject enrollments for this class
    await prisma.studentSubjectEnrollment.deleteMany({
      where: { student_id: student.id, class_id },
    });

    // Create new subject enrollments
    if (subjects.length > 0) {
      await prisma.studentSubjectEnrollment.createMany({
        data: subjects.map((subj: string) => ({
          student_id: student.id,
          class_id,
          subject: subj,
          enrollment_date: new Date().toISOString(),
          status: 'active',
        })),
        skipDuplicates: true,
      });
    }

    const updatedEnrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { student_id: student.id, class_id, status: 'active' },
    });

    res.json({ success: true, data: updatedEnrollments, message: 'Subject enrollments updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Delete related records
    await prisma.studentSubjectEnrollment.deleteMany({ where: { student_id: id } });
    await prisma.studentClassEnrollment.deleteMany({ where: { student_id: id } });
    await prisma.attendance.deleteMany({ where: { student_id: id } });
    await prisma.testResult.deleteMany({ where: { student_id: id } });
    await prisma.homeworkSubmission.deleteMany({ where: { student_id: id } });
    await prisma.parentStudentMapping.deleteMany({ where: { student_id: id } });
    await prisma.studentFeeAssignment.deleteMany({ where: { student_id: id } });
    await prisma.feePayment.deleteMany({ where: { student_id: id } });

    await prisma.student.delete({ where: { id } });
    
    if (student.user_id) {
        await prisma.user.delete({ where: { id: student.user_id } });
    }

    invalidateCache('/api/students');
    res.json({ success: true, message: 'Student and associated data deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


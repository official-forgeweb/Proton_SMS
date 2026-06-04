import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import { ensureSubjectExists, resolveCanonicalSubject, getNormalizedKey } from '../utils/normalization';

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const syncClassSubjects = async (tx: any, classId: string, subjectIds: string[]) => {
  await tx.classSubject.deleteMany({ where: { class_id: classId } });
  const distinctIds = Array.from(new Set(subjectIds.filter(Boolean)));
  if (distinctIds.length > 0) {
    await tx.classSubject.createMany({
      data: distinctIds.map(subId => ({
        class_id: classId,
        subject_id: subId
      }))
    });
  }
};

const router = Router();

const generateClassCode = (): string =>
  `CLS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/classes
router.get('/', authenticateToken, cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, grade_level, status, batch_type, academic_year } = req.query as Record<string, string>;
    let where: any = {};

    if (subject) where.subject = subject;
    if (grade_level) where.grade_level = grade_level;
    if (status) where.status = status;
    if (batch_type) where.batch_type = batch_type;
    if (academic_year) where.academic_year = academic_year;

    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) {
        where.OR = [
          { primary_teacher_id: teacher.id },
          { schedule: { some: { teacher_id: teacher.id } } }
        ];
      }
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        primary_teacher: true,
        schedule: { include: { teacher: true, subject: true } },
      },
    });

    const data = classes.map((c: any) => ({
      ...c,
      teacher_name: c.primary_teacher ? `${c.primary_teacher.first_name || ''} ${c.primary_teacher.last_name || ''}`.trim() : null,
      primary_teacher_id: c.primary_teacher?.id || c.primary_teacher_id,
      id: c.id,
      schedule: c.schedule?.map((s: any) => ({
        ...s,
        subject: s.subject?.canonical_name || s.subject_id,
        teacher_name: s.teacher ? `${s.teacher.first_name || ''} ${s.teacher.last_name || ''}`.trim() : 'Unassigned',
        teacher_id: s.teacher?.id || s.teacher_id,
      })),
      primary_teacher: undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/classes/:id
router.get('/:id', authenticateToken, cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const cls: any = await prisma.class.findUnique({
      where: { id },
      include: {
        primary_teacher: true,
        schedule: { include: { teacher: true, subject: true } },
      },
    });

    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: cls.id, enrollment_status: 'active' },
      include: { student: true },
    });

    // Get subject enrollment counts
    const subjectEnrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { class_id: cls.id, status: 'active' },
      include: { subject: true }
    });

    const subjectCounts: Record<string, number> = {};
    subjectEnrollments.forEach((se: any) => {
      const subjName = se.subject?.canonical_name || se.subject_id;
      subjectCounts[subjName] = (subjectCounts[subjName] || 0) + 1;
    });

    const students = enrollments
      .filter(e => e.student)
      .map(e => {
        const studentSubjects = subjectEnrollments
          .filter(se => se.student_id === e.student.id)
          .map(se => se.subject?.canonical_name || se.subject_id);
        return {
          ...e.student,
          id: e.student.id,
          enrolled_subjects: studentSubjects,
          enrollment: { ...e, student_id: e.student_id, student: undefined },
        };
      });

    const teacher = cls.primary_teacher;
    res.json({
      success: true,
      data: {
        ...cls,
        id: cls.id,
        teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher.id } : null,
        primary_teacher_id: teacher?.id,
        primary_teacher: undefined,
        students,
        subject_counts: subjectCounts,
        schedule: cls.schedule?.map((s: any) => ({
          ...s,
          subject: s.subject?.canonical_name || s.subject_id,
          teacher_name: s.teacher ? `${s.teacher.first_name || ''} ${s.teacher.last_name || ''}`.trim() : 'Unassigned',
          teacher_id: s.teacher?.id || s.teacher_id,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/classes/:id/subjects
router.get('/:id/subjects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const mappings = await prisma.classSubject.findMany({
      where: { class_id: id },
      include: { subject: true }
    });

    const subjects = mappings
      .map(m => m.subject)
      .filter(Boolean)
      .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/classes/bulk-create
router.post('/bulk-create', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { classes } = req.body;
    if (!classes || !Array.isArray(classes)) {
      res.status(400).json({ success: false, message: 'Classes array is required' });
      return;
    }

    const createdClasses: string[] = [];
    const skippedClasses: string[] = [];

    // Fetch existing classes to perform duplication check
    const existingClasses = await prisma.class.findMany({
      select: { class_name: true }
    });
    const existingClassNames = new Set(
      existingClasses.map(c => (c.class_name || '').toLowerCase().trim())
    );

    // Filter which classes need to be created
    const classesToCreate = classes.filter(c => {
      const nameNorm = String(c.className || c.class_name).toLowerCase().trim();
      if (existingClassNames.has(nameNorm)) {
        skippedClasses.push(c.className || c.class_name);
        return false;
      }
      return true;
    });

    if (classesToCreate.length === 0) {
      res.json({
        success: true,
        summary: {
          created: 0,
          skipped: skippedClasses.length,
          total: classes.length,
          classesCreated: [],
          classesSkipped: skippedClasses
        },
        message: 'All specified classes already exist in the database. No new classes were created.'
      });
      return;
    }

    // Pre-resolve and ensure all subject masters exist *outside* the transaction to prevent transaction timeouts
    const uniqueRawSubjects = new Set<string>();
    for (const item of classesToCreate) {
      const subjects = item.subjects;
      if (subjects && Array.isArray(subjects)) {
        subjects.forEach(sub => {
          if (sub && typeof sub === 'string' && sub.trim()) {
            uniqueRawSubjects.add(sub.trim());
          }
        });
      }
    }

    const subjectResolutionMap = new Map<string, string>();
    await Promise.all(
      Array.from(uniqueRawSubjects).map(async (sub) => {
        const resolved = await ensureSubjectExists(sub);
        if (resolved) {
          subjectResolutionMap.set(sub, resolved);
        }
      })
    );

    // Perform database transaction for atomic safety
    const result = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const item of classesToCreate) {
        const className = item.className || item.class_name;
        const subjects = item.subjects;

        // Ensure all subjects exist and resolve their canonical names from our pre-resolved map
        const canonicalSubjects: string[] = [];
        if (subjects && Array.isArray(subjects)) {
          for (const sub of subjects) {
            const resolved = subjectResolutionMap.get(sub.trim());
            if (resolved) {
              canonicalSubjects.push(resolved);
            }
          }
        }

        // Generate unique class code collision-free
        let classCode = '';
        let isCodeUnique = false;
        while (!isCodeUnique) {
          const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          classCode = `CLS${new Date().getFullYear()}${rand}`;
          const existingCode = await tx.class.findUnique({ where: { class_code: classCode } });
          if (!existingCode) {
            isCodeUnique = true;
          }
        }

        // Create the Class record
        const newClass = await tx.class.create({
          data: {
            class_code: classCode,
            class_name: className,
            grade_level: className.includes('12') ? 'Grade 12' : className.includes('11') ? 'Grade 11' : className.includes('10') ? 'Grade 10' : className.includes('9') ? 'Grade 9' : className.includes('8') ? 'Grade 8' : 'Secondary',
            academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            batch_type: className.includes('Competition') ? 'competition' : 'regular',
            status: 'ongoing',
            current_students_count: 0,
            max_students: 40,
            course_duration_months: 12,
            course_fee: className.includes('Competition') ? 45000 : 35000,
          }
        });

        // Insert ClassSchedule entries for all of the resolved canonical subjects
        if (canonicalSubjects.length > 0) {
          // Resolve subject IDs for canonical names
          const subjectRecords = await Promise.all(
            canonicalSubjects.map(async (name) => {
              const key = getNormalizedKey(name);
              let rec = await tx.subject.findUnique({ where: { normalized_key: key } });
              if (!rec) {
                rec = await tx.subject.create({
                  data: { canonical_name: name, normalized_key: key, is_active: true }
                });
              }
              return rec;
            })
          );
          const subjectIds = subjectRecords.map(r => r.id);

          await tx.classSchedule.createMany({
            data: subjectIds.map((subId) => ({
              class_id: newClass.id,
              subject_id: subId,
              teacher_id: null,
              time_start: '09:00',
              time_end: '10:00',
              days: ['Monday', 'Wednesday', 'Friday']
            }))
          });

          // Sync mappings
          await syncClassSubjects(tx, newClass.id, subjectIds);
        }

        createdClasses.push(className);
        createdResults.push(newClass);
      }

      return createdResults;
    }, {
      maxWait: 5000,
      timeout: 30000 // 30s timeout failsafe to allow for potential DB Cold Starts (Neon)
    });

    // Invalidate Cache for classes dashboard and timetables
    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');
    invalidateCache('/api/timetable');

    res.status(201).json({
      success: true,
      summary: {
        created: createdClasses.length,
        skipped: skippedClasses.length,
        total: classes.length,
        classesCreated: createdClasses,
        classesSkipped: skippedClasses
      },
      data: result
    });

  } catch (error: any) {
    console.error('[Bulk Class Import Utility] Failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during bulk class creation.'
    });
  }
});

// POST /api/classes
router.post('/', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { schedule, ...rest } = req.body;

    const newClass = await prisma.class.create({
      data: {
        class_code: generateClassCode(),
        ...rest,
        current_students_count: 0,
        status: rest.status || 'upcoming',
      },
    });

    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');
    invalidateCache('/api/timetable');

    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      const resolvedSchedules = [];
      const subjectIds: string[] = [];
      for (const s of schedule) {
        let subjectId = s.subject_id || s.subject;
        if (subjectId && !isUUID(subjectId)) {
          const canonicalName = await resolveCanonicalSubject(subjectId);
          const key = getNormalizedKey(canonicalName);
          let subjectRecord = await prisma.subject.findUnique({ where: { normalized_key: key } });
          if (!subjectRecord) {
            subjectRecord = await prisma.subject.create({
              data: { canonical_name: canonicalName, normalized_key: key, is_active: true }
            });
          }
          subjectId = subjectRecord.id;
        }
        if (subjectId) {
          subjectIds.push(subjectId);
          resolvedSchedules.push({
            class_id: newClass.id,
            subject_id: subjectId,
            teacher_id: s.teacher_id || null,
            time_start: s.time_start || '09:00',
            time_end: s.time_end || '10:00',
            days: s.days || [],
          });
        }
      }

      if (resolvedSchedules.length > 0) {
        await prisma.classSchedule.createMany({
          data: resolvedSchedules,
        });
        await syncClassSubjects(prisma, newClass.id, subjectIds);
      }
    }

    const result = await prisma.class.findUnique({
      where: { id: newClass.id },
      include: { schedule: { include: { subject: true } } },
    });

    res.status(201).json({ success: true, data: { ...result, id: result!.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/classes/:id
router.put('/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { schedule, ...rest } = req.body;

    const updated = await prisma.class.update({
      where: { id },
      data: rest,
    });

    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');
    invalidateCache('/api/timetable');

    if (schedule && Array.isArray(schedule)) {
      await prisma.classSchedule.deleteMany({ where: { class_id: id } });
      if (schedule.length > 0) {
        const resolvedSchedules = [];
        const subjectIds: string[] = [];
        for (const s of schedule) {
          let subjectId = s.subject_id || s.subject;
          if (subjectId && !isUUID(subjectId)) {
            const canonicalName = await resolveCanonicalSubject(subjectId);
            const key = getNormalizedKey(canonicalName);
            let subjectRecord = await prisma.subject.findUnique({ where: { normalized_key: key } });
            if (!subjectRecord) {
              subjectRecord = await prisma.subject.create({
                data: { canonical_name: canonicalName, normalized_key: key, is_active: true }
              });
            }
            subjectId = subjectRecord.id;
          }
          if (subjectId) {
            subjectIds.push(subjectId);
            resolvedSchedules.push({
              class_id: id,
              subject_id: subjectId,
              teacher_id: s.teacher_id || null,
              time_start: s.time_start || '09:00',
              time_end: s.time_end || '10:00',
              days: s.days || [],
            });
          }
        }

        if (resolvedSchedules.length > 0) {
          await prisma.classSchedule.createMany({
            data: resolvedSchedules,
          });
          await syncClassSubjects(prisma, id, subjectIds);
        }
      } else {
        await syncClassSubjects(prisma, id, []);
      }
    }

    const result = await prisma.class.findUnique({
      where: { id },
      include: { schedule: { include: { subject: true } } },
    });

    res.json({ success: true, data: { ...result, id: result!.id } });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/classes/:id/attendance
router.get('/:id/attendance', authenticateToken, cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { date } = req.query as Record<string, string>;
    let attWhere: any = { class_id: id };
    if (date) attWhere.attendance_date = date;

    const [records, enrollments] = await Promise.all([
      prisma.attendance.findMany({ where: attWhere }),
      prisma.studentClassEnrollment.findMany({
        where: { class_id: id, enrollment_status: 'active' },
        include: { student: true },
      }),
    ]);

    const students = enrollments
      .filter(e => e.student)
      .map(e => {
        const student = e.student;
        const att = date ? records.find(r => r.student_id === student.id) : null;
        return {
          ...student,
          id: student.id,
          attendance_status: att?.status || null,
          attendance_id: att?.id || null,
        };
      });

    res.json({
      success: true,
      data: { students, date, class_id: id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/classes/:id/attendance
router.post('/:id/attendance', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { date, records } = req.body;
    if (!records || !Array.isArray(records)) {
      res.status(400).json({ success: false, message: 'Records array required' });
      return;
    }

    const savedRecords: any[] = [];
    for (const record of records) {
      const existing = await prisma.attendance.findFirst({
        where: {
          student_id: record.student_id,
          class_id: id,
          attendance_date: date,
        },
      });

      if (existing) {
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: record.status },
        });
        savedRecords.push(updated);
      } else {
        const created = await prisma.attendance.create({
          data: {
            student_id: record.student_id,
            class_id: id,
            attendance_date: date,
            status: record.status,
            marked_by: req.user!.id,
          },
        });
        savedRecords.push(created);
      }
    }

    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');

    res.json({
      success: true,
      data: savedRecords,
      message: `Attendance marked for ${savedRecords.length} students`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/classes/:id
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);

    // 1. Fetch class details to verify it exists
    const cls = await prisma.class.findUnique({
      where: { id }
    });

    if (!cls) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    // 2. Perform atomic forced cascade-deletion of all relations in a single transaction
    await prisma.$transaction(async (tx) => {
      // Delete subject and class enrollments
      await tx.studentSubjectEnrollment.deleteMany({ where: { class_id: id } });
      await tx.studentClassEnrollment.deleteMany({ where: { class_id: id } });
      
      // Delete attendance records
      await tx.attendance.deleteMany({ where: { class_id: id } });
      
      // Delete test results and tests
      await tx.testResult.deleteMany({
        where: { test: { class_id: id } }
      });
      await tx.test.deleteMany({ where: { class_id: id } });
      
      // Delete homework submissions and homeworks
      await tx.homeworkSubmission.deleteMany({
        where: { homework: { class_id: id } }
      });
      await tx.homework.deleteMany({ where: { class_id: id } });

      // Delete fee assignments and fee structures
      // Note: FeeInstallment and FeeAuditLog have onDelete: Cascade referencing StudentFeeAssignment
      await tx.studentFeeAssignment.deleteMany({
        where: { fee_structure: { class_id: id } }
      });
      await tx.feeStructure.deleteMany({ where: { class_id: id } });

      // Delete demo classes linked to this class
      await tx.demoClass.deleteMany({ where: { class_id: id } });

      // Delete video lectures and study materials
      await tx.videoLecture.deleteMany({ where: { class_id: id } });
      await tx.studyMaterial.deleteMany({ where: { class_id: id } });

      // Delete schedules and timetables
      await tx.classSchedule.deleteMany({ where: { class_id: id } });
      await tx.timetable.deleteMany({ where: { class_id: id } });

      // Finally, delete the Class itself
      await tx.class.delete({ where: { id } });
    });

    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');
    invalidateCache('/api/timetable');

    res.json({
      success: true,
      message: 'Class and all its associated data (schedules, timetables, test scores, homework, and fee metrics) have been force-deleted successfully.'
    });
  } catch (error) {
    console.error('Error force-deleting class:', error);
    res.status(500).json({ success: false, message: 'Server error occurred while force-deleting the class.' });
  }
});

export default router;


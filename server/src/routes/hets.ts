import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { sendNotification, getStudentUserIdsForClass } from './notifications';
import { logTeacherActivity } from '../utils/activityLogger';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const paramId = (req: Request): string => String(req.params.id);

// ──────────────────────────────────────────────
// Helper: Verify Teacher Permissions for Class-Subject
// ──────────────────────────────────────────────
async function verifyTeacherPermission(userId: string, classId: string, subjectId: string): Promise<boolean> {
  const teacher = await prisma.teacher.findUnique({ where: { user_id: userId } });
  if (!teacher) return false;

  // 1. Check if primary teacher of the class
  const classObj = await prisma.class.findUnique({
    where: { id: classId },
    select: { primary_teacher_id: true }
  });
  if (classObj?.primary_teacher_id === teacher.id) {
    return true;
  }

  // 2. Check class schedules for the specific teacher + class + subject combination
  const schedule = await prisma.classSchedule.findFirst({
    where: {
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacher.id
    }
  });

  return !!schedule;
}

// ──────────────────────────────────────────────
// GET /api/hets/dashboard/stats
// ──────────────────────────────────────────────
router.get('/dashboard/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    let whereClause: any = {};
    let teacherProfileId: string | null = null;

    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher profile not found' });
        return;
      }
      teacherProfileId = teacher.id;
      whereClause.teacher_id = teacher.id;
    } else if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }
      const enrollments = await prisma.studentClassEnrollment.findMany({
        where: { student_id: student.id, enrollment_status: 'active' },
        select: { class_id: true }
      });
      const classIds = enrollments.map(e => e.class_id);
      whereClause.class_id = { in: classIds };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch HET counts
    const [totalHets, todayHets, upcomingHets, completedHets] = await Promise.all([
      prisma.hET.count({ where: whereClause }),
      prisma.hET.count({ where: { ...whereClause, date: todayStr } }),
      prisma.hET.count({ where: { ...whereClause, date: { gt: todayStr }, status: 'scheduled' } }),
      prisma.hET.count({ where: { ...whereClause, status: 'completed' } })
    ]);

    // Average Performance & Weak Students / Top Performers
    let averagePerformance = 0;
    let weakStudents: any[] = [];
    let topPerformers: any[] = [];

    let resultsWhere: any = {};
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      resultsWhere.student_id = student?.id || '';
    } else if (req.user!.role === 'teacher' && teacherProfileId) {
      resultsWhere.het = { teacher_id: teacherProfileId };
    }

    const allResults = await prisma.hETResult.findMany({
      where: resultsWhere,
      select: {
        marks_obtained: true,
        het: {
          select: {
            total_marks: true
          }
        },
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            PRO_ID: true
          }
        }
      }
    });

    if (allResults.length > 0) {
      let totalObtained = 0;
      let totalPossible = 0;

      // Group by student to find averages
      const studentAverages: Record<string, { name: string; proId: string; obtained: number; possible: number }> = {};

      allResults.forEach(r => {
        if (r.marks_obtained !== null && r.het?.total_marks) {
          totalObtained += r.marks_obtained;
          totalPossible += r.het.total_marks;

          const sId = r.student.id;
          if (!studentAverages[sId]) {
            studentAverages[sId] = {
              name: `${r.student.first_name || ''} ${r.student.last_name || ''}`.trim(),
              proId: r.student.PRO_ID,
              obtained: 0,
              possible: 0
            };
          }
          studentAverages[sId].obtained += r.marks_obtained;
          studentAverages[sId].possible += r.het.total_marks;
        }
      });

      averagePerformance = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

      const studentPercentageList = Object.entries(studentAverages).map(([id, s]) => ({
        id,
        name: s.name,
        proId: s.proId,
        percentage: s.possible > 0 ? Math.round((s.obtained / s.possible) * 100) : 0
      }));

      // Weak: percentage < 40
      weakStudents = studentPercentageList.filter(s => s.percentage < 40).slice(0, 5);
      // Top: sorted desc
      topPerformers = studentPercentageList.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
    }

    res.json({
      success: true,
      data: {
        totalHets,
        todayHets,
        upcomingHets,
        completedHets,
        averagePerformance,
        weakStudents,
        topPerformers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/hets
// ──────────────────────────────────────────────
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject_id, teacher_id, status } = req.query as Record<string, string>;
    let where: any = {};

    if (class_id && isUUID(class_id)) where.class_id = class_id;
    if (subject_id && isUUID(subject_id)) where.subject_id = subject_id;
    if (teacher_id && isUUID(teacher_id)) where.teacher_id = teacher_id;
    if (status) where.status = status;

    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) {
        const primaryClasses = await prisma.class.findMany({
          where: { primary_teacher_id: teacher.id },
          select: { id: true },
        });
        const primaryClassIds = primaryClasses.map(c => c.id);

        const schedules = await prisma.classSchedule.findMany({
          where: { teacher_id: teacher.id },
          select: { class_id: true, subject_id: true }
        });

        const teacherOrConditions: any[] = [];
        if (primaryClassIds.length > 0) {
          teacherOrConditions.push({ class_id: { in: primaryClassIds } });
        }
        schedules.forEach(sched => {
          if (sched.class_id && sched.subject_id) {
            teacherOrConditions.push({
              class_id: sched.class_id,
              subject_id: sched.subject_id
            });
          }
        });
        teacherOrConditions.push({ created_by: req.user!.id });

        if (where.class_id) {
          where = {
            ...where,
            AND: [
              { class_id: where.class_id },
              { OR: teacherOrConditions }
            ]
          };
        } else {
          where.OR = teacherOrConditions;
        }
      }
    } else if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (student) {
        const enrollments = await prisma.studentClassEnrollment.findMany({
          where: { student_id: student.id, enrollment_status: 'active' },
          select: { class_id: true }
        });
        const classIds = enrollments.map(e => e.class_id);
        where.class_id = { in: classIds };
      } else {
        where.class_id = 'none';
      }
    }

    const hets = await prisma.hET.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        class: { select: { class_name: true } },
        subject: { select: { canonical_name: true } },
        teacher: { select: { first_name: true, last_name: true } }
      }
    });

    const mappedHets = hets.map(h => ({
      ...h,
      class_name: h.class?.class_name || '',
      subject_name: h.subject?.canonical_name || '',
      teacher_name: `${h.teacher?.first_name || ''} ${h.teacher?.last_name || ''}`.trim()
    }));

    res.json({ success: true, data: mappedHets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/hets/student/:studentId
// ──────────────────────────────────────────────
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    if (!isUUID(studentId)) {
      res.status(400).json({ success: false, message: 'Invalid Student ID format' });
      return;
    }

    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student || student.id !== studentId) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
    }

    const results = await prisma.hETResult.findMany({
      where: { student_id: studentId },
      include: {
        het: {
          include: {
            class: { select: { class_name: true } },
            subject: { select: { canonical_name: true } },
            teacher: { select: { first_name: true, last_name: true } }
          }
        }
      },
      orderBy: { het: { date: 'desc' } }
    });

    const mapped = results.map(r => ({
      id: r.id,
      het_id: r.het_id,
      marks_obtained: r.marks_obtained,
      remarks: r.remarks,
      graded_at: r.graded_at,
      title: r.het.title,
      date: r.het.date,
      topic: r.het.topic,
      total_marks: r.het.total_marks,
      passing_marks: r.het.passing_marks,
      status: r.het.status,
      class_name: r.het.class.class_name,
      subject_name: r.het.subject.canonical_name,
      teacher_name: `${r.het.teacher.first_name || ''} ${r.het.teacher.last_name || ''}`.trim()
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// GET /api/hets/:id
// ──────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    if (!isUUID(id)) {
      res.status(400).json({ success: false, message: 'Invalid ID format' });
      return;
    }

    const het = await prisma.hET.findUnique({
      where: { id },
      include: {
        class: true,
        subject: { select: { canonical_name: true } },
        teacher: { select: { first_name: true, last_name: true } }
      }
    });

    if (!het) {
      res.status(404).json({ success: false, message: 'HET not found' });
      return;
    }

    // Role boundaries: Student can only see their own result
    let results: any[] = [];
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (student) {
        results = await prisma.hETResult.findMany({
          where: { het_id: het.id, student_id: student.id },
          include: { student: { select: { PRO_ID: true, first_name: true, last_name: true } } }
        });
      }
    } else {
      // Admin / Coordinator / Teacher see all student results
      results = await prisma.hETResult.findMany({
        where: { het_id: het.id },
        include: { student: { select: { PRO_ID: true, first_name: true, last_name: true } } },
        orderBy: { student: { PRO_ID: 'asc' } }
      });

      // If no results have been generated yet, fetch students enrolled in the class so they can be graded
      if (results.length === 0) {
        const enrollments = await prisma.studentClassEnrollment.findMany({
          where: { class_id: het.class_id, enrollment_status: 'active' },
          include: { student: { select: { id: true, PRO_ID: true, first_name: true, last_name: true } } }
        });
        results = enrollments.map(e => ({
          student_id: e.student.id,
          marks_obtained: null,
          remarks: null,
          student: e.student
        }));
      }
    }

    res.json({
      success: true,
      data: {
        ...het,
        class_name: het.class?.class_name || '',
        subject_name: het.subject?.canonical_name || '',
        teacher_name: `${het.teacher?.first_name || ''} ${het.teacher?.last_name || ''}`.trim(),
        results
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// POST /api/hets
// ──────────────────────────────────────────────
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, class_id, subject_id, teacher_id, date, topic, description, total_marks, passing_marks, remarks, status } = req.body;

    if (!title || !class_id || !subject_id || !teacher_id || !date || !topic || total_marks === undefined || passing_marks === undefined) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Role restriction check for teachers
    if (req.user!.role === 'teacher') {
      const allowed = await verifyTeacherPermission(req.user!.id, class_id, subject_id);
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this class and subject combination.' });
        return;
      }
    }

    const het = await prisma.hET.create({
      data: {
        title,
        class_id,
        subject_id,
        teacher_id,
        created_by: req.user!.id,
        date,
        topic,
        description: description || '',
        total_marks: parseFloat(total_marks),
        passing_marks: parseFloat(passing_marks),
        remarks: remarks || '',
        status: status || 'scheduled'
      }
    });

    // Logging activity
    await logTeacherActivity(
      req.user!.id,
      'het_create',
      null,
      JSON.stringify(het),
      `HET: ${title} on ${date}`,
      req
    );

    // Notifications (Phase 11)
    if (het.status === 'scheduled') {
      const studentUserIds = await getStudentUserIdsForClass(class_id);
      
      const teacherObj = await prisma.teacher.findUnique({ where: { id: teacher_id } });
      const teacherUserId = teacherObj?.user_id;

      const coordinators = await prisma.coordinator.findMany({ where: { status: 'active' }, select: { user_id: true } });
      const coordUserIds = coordinators.map(c => c.user_id);

      const admins = await prisma.user.findMany({ where: { role: 'admin', is_active: true }, select: { id: true } });
      const adminUserIds = admins.map(a => a.id);

      // Collect unique recipient IDs
      const recipients = Array.from(new Set([
        ...studentUserIds,
        ...(teacherUserId ? [teacherUserId] : []),
        ...coordUserIds,
        ...adminUserIds
      ])).filter(id => id !== req.user!.id); // Skip creator

      await sendNotification(
        recipients,
        req.user!.id,
        'het_scheduled',
        `New HET Scheduled: ${title}`,
        `A Homework Evaluation Test (HET) has been scheduled on ${date} for class ${topic}. Marks will be entered soon.`,
        het.id
      );
    }

    res.status(201).json({ success: true, data: het });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// PUT /api/hets/:id
// ──────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { title, date, topic, description, total_marks, passing_marks, remarks, status } = req.body;

    const existing = await prisma.hET.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'HET not found' });
      return;
    }

    // Role boundaries for teachers
    if (req.user!.role === 'teacher') {
      const allowed = await verifyTeacherPermission(req.user!.id, existing.class_id, existing.subject_id);
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
    }

    const updated = await prisma.hET.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        date: date !== undefined ? date : existing.date,
        topic: topic !== undefined ? topic : existing.topic,
        description: description !== undefined ? description : existing.description,
        total_marks: total_marks !== undefined ? parseFloat(total_marks) : existing.total_marks,
        passing_marks: passing_marks !== undefined ? parseFloat(passing_marks) : existing.passing_marks,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        status: status !== undefined ? status : existing.status
      }
    });

    await logTeacherActivity(
      req.user!.id,
      'het_update',
      JSON.stringify(existing),
      JSON.stringify(updated),
      `HET ID: ${id}`,
      req
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/hets/:id
// ──────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const existing = await prisma.hET.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'HET not found' });
      return;
    }

    // Role boundaries for teachers
    if (req.user!.role === 'teacher') {
      const allowed = await verifyTeacherPermission(req.user!.id, existing.class_id, existing.subject_id);
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
    }

    await prisma.hET.delete({ where: { id } });

    await logTeacherActivity(
      req.user!.id,
      'het_delete',
      JSON.stringify(existing),
      null,
      `Deleted HET: ${existing.title}`,
      req
    );

    res.json({ success: true, message: 'HET deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// POST /api/hets/:id/grades (Bulk Entry)
// ──────────────────────────────────────────────
router.post('/:id/grades', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { results } = req.body; // Array<{ student_id: string, marks_obtained: number | null, remarks?: string }>

    if (!Array.isArray(results)) {
      res.status(400).json({ success: false, message: 'Results must be a list' });
      return;
    }

    const het = await prisma.hET.findUnique({ where: { id } });
    if (!het) {
      res.status(404).json({ success: false, message: 'HET not found' });
      return;
    }

    // Role boundaries for teachers
    if (req.user!.role === 'teacher') {
      const allowed = await verifyTeacherPermission(req.user!.id, het.class_id, het.subject_id);
      if (!allowed) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
    }

    // Perform atomic transaction to write all grades
    await prisma.$transaction(async (tx) => {
      for (const resItem of results) {
        const { student_id, marks_obtained, remarks } = resItem;

        await tx.hETResult.upsert({
          where: {
            het_id_student_id: {
              het_id: id,
              student_id
            }
          },
          create: {
            het_id: id,
            student_id,
            marks_obtained: marks_obtained !== null ? parseFloat(marks_obtained) : null,
            remarks: remarks || '',
            graded_by: req.user!.id,
            graded_at: new Date()
          },
          update: {
            marks_obtained: marks_obtained !== null ? parseFloat(marks_obtained) : null,
            remarks: remarks || '',
            graded_by: req.user!.id,
            graded_at: new Date()
          }
        });
      }

      // Mark the HET status as completed since marks have been uploaded
      await tx.hET.update({
        where: { id },
        data: { status: 'completed' }
      });
    });

    await logTeacherActivity(
      req.user!.id,
      'het_grades_upload',
      null,
      JSON.stringify(results.map(r => ({ student_id: r.student_id, marks: r.marks_obtained }))),
      `Uploaded grades for HET: ${het.title}`,
      req
    );

    // Notify students whose marks have been uploaded
    const studentIds = results.map(r => r.student_id);
    const studentsWithUsers = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, user_id: true }
    });

    const userIdsToNotify = studentsWithUsers.map(s => s.user_id).filter(Boolean);
    if (userIdsToNotify.length > 0) {
      await sendNotification(
        userIdsToNotify,
        req.user!.id,
        'het_marks_uploaded',
        `HET Marks Published: ${het.title}`,
        `Your marks for the Homework Evaluation Test (HET) on topic "${het.topic}" have been updated. Log in to check your performance.`,
        het.id
      );
    }

    res.json({ success: true, message: 'Marks saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

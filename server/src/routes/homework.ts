import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const paramId = (req: Request): string => String(req.params.id);

const generateHomeworkCode = (): string =>
  `HW${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// GET /api/homework
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id } = req.query as Record<string, string>;
    let where: any = {};
    if (class_id && isUUID(class_id)) where.class_id = class_id;

    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) {
        const myClasses = await prisma.class.findMany({
          where: { primary_teacher_id: teacher.id },
          select: { id: true },
        });
        const classIds = myClasses.map(c => c.id);
        if (where.class_id && !classIds.includes(where.class_id)) {
          res.json({ success: true, data: [] });
          return;
        }
        if (!where.class_id) where.class_id = { in: classIds };
      }
    }

    const homeworks = await prisma.homework.findMany({
      where,
      orderBy: { assigned_date: 'desc' },
      include: { class: true },
    });

    if (homeworks.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const hwIds = homeworks.map(h => h.id);
    const classIds = [...new Set(homeworks.map((h: any) => h.class?.id).filter(Boolean) as string[])];

    const [submissionStats, studentCountStats] = await Promise.all([
      prisma.homeworkSubmission.groupBy({
        by: ['homework_id'],
        where: { homework_id: { in: hwIds } },
        _count: true,
      }),
      prisma.studentClassEnrollment.groupBy({
        by: ['class_id'],
        where: { class_id: { in: classIds }, enrollment_status: 'active' },
        _count: true,
      }),
    ]);

    const allSubmissions = await prisma.homeworkSubmission.findMany({
      where: { homework_id: { in: hwIds } },
      select: { homework_id: true, status: true },
    });

    const submissionMap: Record<string, { submitted: number; pending: number; evaluated: number }> = {};
    allSubmissions.forEach(s => {
      if (!submissionMap[s.homework_id]) submissionMap[s.homework_id] = { submitted: 0, pending: 0, evaluated: 0 };
      if (s.status === 'pending') submissionMap[s.homework_id].pending++;
      else if (s.status === 'evaluated') submissionMap[s.homework_id].evaluated++;
      else submissionMap[s.homework_id].submitted++;
    });

    const studentCountMap: Record<string, number> = {};
    studentCountStats.forEach(s => { studentCountMap[s.class_id] = s._count; });

    const data = homeworks.map((h: any) => {
      const stats = submissionMap[h.id] || { submitted: 0, pending: 0, evaluated: 0 };
      return {
        ...h,
        id: h.id,
        class_id: h.class?.id || h.class_id,
        class_name: h.class?.class_name || '',
        total_students: studentCountMap[h.class?.id || ''] || 0,
        submitted: stats.submitted,
        pending: stats.pending,
        evaluated: stats.evaluated,
        class: undefined,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/homework
router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    let createdBy = req.user!.id;
    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) createdBy = teacher.id;
    }

    const hw = await prisma.homework.create({
      data: {
        homework_code: generateHomeworkCode(),
        ...req.body,
        created_by: createdBy,
      },
    });

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: hw.class_id, enrollment_status: 'active' },
      select: { student_id: true },
    });

    if (enrollments.length > 0) {
      await prisma.homeworkSubmission.createMany({
        data: enrollments.map(e => ({
          homework_id: hw.id,
          student_id: e.student_id,
          status: 'pending',
        })),
      });
    }

    res.status(201).json({ success: true, data: { ...hw, id: hw.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/homework/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const hw = await prisma.homework.findUnique({ where: { id } });
    if (!hw) {
      res.status(404).json({ success: false, message: 'Homework not found' });
      return;
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homework_id: hw.id },
      include: { student: true },
    });

    const mappedSubmissions = submissions.map((s: any) => {
      const student = s.student;
      return {
        ...s,
        id: s.id,
        student_id: student?.id,
        student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
        pro_id: student?.PRO_ID,
        student: undefined,
      };
    });

    res.json({ success: true, data: { ...hw, id: hw.id, submissions: mappedSubmissions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/homework/:id/submit
router.post('/:id/submit', authenticateToken, authorize('student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const submission = await prisma.homeworkSubmission.findFirst({
      where: { homework_id: id, student_id: student.id },
    });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const hw = await prisma.homework.findUnique({ where: { id } });
    const isLate = hw && new Date() > new Date(hw.due_date || '');

    const updated = await prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: {
        submission_date: new Date().toISOString(),
        status: isLate ? 'late' : 'submitted',
      },
    });

    res.json({ success: true, data: { ...updated, id: updated.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/homework/:id/evaluate
router.post('/:id/evaluate', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { student_id, marks_obtained, feedback } = req.body;

    const submission = await prisma.homeworkSubmission.findFirst({
      where: { homework_id: id, student_id },
    });
    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: { marks_obtained, feedback, status: 'evaluated' },
    });

    res.json({ success: true, data: { ...updated, id: updated.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

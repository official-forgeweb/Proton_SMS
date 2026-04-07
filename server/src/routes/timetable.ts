import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// GET /api/timetable
// Admins see all, Teachers see their own, Students see their class+subjects
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, class_id, teacher_id, start_date, end_date } = req.query as Record<string, string>;
    let where: any = {};

    if (date) where.date = date;
    if (class_id) where.class_id = class_id;
    if (teacher_id) where.teacher_id = teacher_id;
    if (start_date && end_date) {
        where.date = { gte: start_date, lte: end_date };
    }

    if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({
            where: { user_id: req.user!.id },
            include: {
                class_enrollments: { where: { enrollment_status: 'active' } },
                subject_enrollments: { where: { status: 'active' } }
            }
        });

        if (!student || student.class_enrollments.length === 0) {
            res.json({ success: true, data: [] });
            return;
        }

        const classIds = student.class_enrollments.map(e => e.class_id);
        const enrolledSubjects = student.subject_enrollments.map(e => e.subject);

        where.class_id = { in: classIds };
        where.subject = { in: enrolledSubjects };
    } else if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (teacher) {
            where.teacher_id = teacher.id;
        }
    }

    const timetable = await prisma.timetable.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { start_time: 'asc' }
      ],
      include: {
        class_ref: {
            select: { class_name: true, class_code: true }
        },
        teacher: {
            select: { first_name: true, last_name: true }
        }
      }
    });

    res.json({ success: true, data: timetable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/timetable (Admin only)
router.post('/', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject, teacher_id, date, start_time, end_time, room, notes } = req.body;

    const entry = await prisma.timetable.create({
      data: {
        class_id,
        subject,
        teacher_id,
        date,
        start_time,
        end_time,
        room,
        notes,
        status: 'scheduled'
      }
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/timetable/:id (Admin only)
router.put('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const entry = await prisma.timetable.update({
      where: { id },
      data: req.body
    });

    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/timetable/:id (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

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
            select: {
                class_enrollments: { 
                    where: { enrollment_status: 'active' },
                    select: { class_id: true }
                },
                subject_enrollments: { 
                    where: { status: 'active' },
                    select: { class_id: true, subject: true }
                }
            }
        });

        if (!student || student.class_enrollments.length === 0) {
            res.json({ success: true, data: [] });
            return;
        }

        const classIds = student.class_enrollments.map(e => e.class_id);
        const subjectEnrolls = student.subject_enrollments;

        const subjectsByClass: Record<string, string[]> = {};
        subjectEnrolls.forEach(e => {
            if (!subjectsByClass[e.class_id]) subjectsByClass[e.class_id] = [];
            subjectsByClass[e.class_id].push(e.subject);
        });

        const orConditions = classIds.map(cid => {
            const subjects = subjectsByClass[cid];
            if (subjects && subjects.length > 0) {
                return { 
                    class_id: cid, 
                    OR: subjects.map(s => ({
                        subject: { contains: s.trim(), mode: 'insensitive' }
                    }))
                };
            }
            return { class_id: cid };
        });

        if (where.OR) {
            // Unlikely to have OR here already, but just in case
            where.AND = [ { OR: where.OR }, { OR: orConditions } ];
            delete where.OR;
        } else {
            where.OR = orConditions;
        }
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

// POST /api/timetable/generate (Admin only)
router.post('/generate', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, class_id } = req.body;
    
    if (!start_date || !end_date) {
        res.status(400).json({ success: false, message: 'start_date and end_date are required' });
        return;
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
        res.status(400).json({ success: false, message: 'Start date must be before or equal to end date' });
        return;
    }

    let classWhere: any = { status: 'ongoing' };
    if (class_id) classWhere.id = class_id;

    const classes = await prisma.class.findMany({
        where: classWhere,
        include: { schedule: true }
    });

    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let createdCount = 0;

    for (const c of classes) {
        if (!c.schedule || c.schedule.length === 0) continue;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = daysMap[d.getDay()];
            const dateStr = d.toISOString().split('T')[0];

            for (const sched of c.schedule) {
                if (sched.days && sched.days.includes(dayOfWeek)) {
                    // Check if entry already exists to avoid duplicates
                    const existing = await prisma.timetable.findFirst({
                        where: {
                            class_id: c.id,
                            subject: sched.subject || '',
                            date: dateStr,
                        }
                    });

                    if (!existing) {
                        await prisma.timetable.create({
                            data: {
                                class_id: c.id,
                                subject: sched.subject || '',
                                teacher_id: sched.teacher_id,
                                date: dateStr,
                                start_time: sched.time_start || '09:00',
                                end_time: sched.time_end || '10:00',
                                status: 'scheduled'
                            }
                        });
                        createdCount++;
                    }
                }
            }
        }
    }

    res.json({ success: true, message: `Successfully generated ${createdCount} schedule entries.`, count: createdCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating timetable' });
  }
});

// POST /api/timetable (Admin or Teacher)
router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject, teacher_id, date, start_time, end_time, room, notes } = req.body;

    let finalTeacherId = teacher_id;
    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        finalTeacherId = teacher.id;
    }

    const entry = await prisma.timetable.create({
      data: {
        class_id,
        subject,
        teacher_id: finalTeacherId,
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

// PUT /api/timetable/:id (Admin or Teacher)
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updateData = { ...req.body };

    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        const existing = await prisma.timetable.findUnique({ where: { id } });
        if (!existing || existing.teacher_id !== teacher.id) {
            res.status(403).json({ success: false, message: 'Not authorized to update this entry' });
            return;
        }
        updateData.teacher_id = teacher.id; // Override to prevent changing
    }

    const entry = await prisma.timetable.update({
      where: { id },
      data: updateData
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

// DELETE /api/timetable/:id (Admin or Teacher)
router.delete('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        const existing = await prisma.timetable.findUnique({ where: { id } });
        if (!existing || existing.teacher_id !== teacher.id) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
            return;
        }
    }

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

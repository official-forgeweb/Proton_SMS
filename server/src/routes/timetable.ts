import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { mailEventEmitter } from '../services/mail/sendMail';
import { resolveSubjectRecord } from '../utils/normalization';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();

const notifyTimetableChange = async (classId: string, teacherId: string | null, date: string, details: string, scheduleId: string) => {
  try {
    // 1. Notify Teacher
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { email: true, first_name: true, last_name: true }
      });
      if (teacher && teacher.email) {
        mailEventEmitter.emit('timetable.updated', {
          name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
          email: teacher.email,
          details,
          date,
          scheduleId
        });
      }
    }
    
    // 2. Notify Enrolled Students
    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: classId, enrollment_status: 'active' },
      include: { student: true }
    });
    
    for (const enrollment of enrollments) {
      const student = enrollment.student;
      if (student && student.email) {
        mailEventEmitter.emit('timetable.updated', {
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          email: student.email,
          details,
          date,
          scheduleId
        });
      }
    }
  } catch (err) {
    console.error('[Mail Error] Failed to notify timetable change:', err);
  }
};

// GET /api/timetable
// Admins see all, Teachers see their own, Students see their class+subjects
router.get('/', authenticateToken, cacheMiddleware(10), async (req: Request, res: Response): Promise<void> => {
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
                    select: { class_id: true, subject_id: true }
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
            subjectsByClass[e.class_id].push(e.subject_id);
        });

        const orConditions = classIds.map(cid => {
            const subjects = subjectsByClass[cid];
            if (subjects && subjects.length > 0) {
                return { 
                    class_id: cid, 
                    OR: subjects.map(s => ({
                        subject_id: s
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
        },
        subject: {
            select: { canonical_name: true }
        }
      }
    });

    // Fetch Tests to include in the schedule
    let testWhere: any = {};
    if (date) testWhere.test_date = date;
    if (start_date && end_date) {
        testWhere.test_date = { gte: start_date, lte: end_date };
    }
    
    if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({
            where: { user_id: req.user!.id },
            select: { class_enrollments: { select: { class_id: true } } }
        });
        if (student) {
            const classIds = student.class_enrollments.map(e => e.class_id);
            testWhere.class_id = { in: classIds };
        }
    } else if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (teacher) {
            testWhere.OR = [
                { created_by: teacher.id },
                { class: { primary_teacher_id: teacher.id } }
            ];
        }
    } else if (class_id) {
        testWhere.class_id = class_id;
    }

    const tests = await prisma.test.findMany({
        where: testWhere,
        include: { 
            class: { select: { class_name: true, class_code: true } },
            subject: { select: { canonical_name: true } }
        }
    });

    const mappedTests = tests.map(t => ({
        id: t.id,
        class_id: t.class_id,
        subject: `TEST: ${t.test_name} (${t.subject?.canonical_name || 'General'})`,
        teacher_id: t.created_by,
        date: t.test_date,
        start_time: t.start_time || '00:00',
        end_time: '', // Tests usually have duration instead of end_time
        room: 'Examination Hall',
        notes: t.description,
        status: t.status,
        type: 'test',
        class_ref: t.class,
        teacher: null // Could fetch teacher info if needed
    }));

    const combinedData = [
        ...timetable.map(i => ({ ...i, subject: i.subject.canonical_name, type: 'class' })), 
        ...mappedTests
    ].sort((a: any, b: any) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
    });

    res.json({ success: true, data: combinedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/timetable/generate (Admin only)
router.post('/generate', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
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

    console.log(`Starting generation from ${startDate.toISOString()} to ${endDate.toISOString()} for class_id: ${class_id || 'all'}`);

    for (const c of classes) {
        if (!c.schedule || c.schedule.length === 0) {
            console.log(`Class ${c.class_name} has no schedule template. Skipping.`);
            continue;
        }

        // Use UTC to avoid timezone boundary issues
        const startUTC = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00Z');
        const endUTC = new Date(endDate.toISOString().split('T')[0] + 'T00:00:00Z');

        for (let d = new Date(startUTC); d <= endUTC; d.setUTCDate(d.getUTCDate() + 1)) {
            const dayOfWeek = daysMap[d.getUTCDay()];
            const dateStr = d.toISOString().split('T')[0];

            for (const sched of c.schedule) {
                // The user explicitly requested to generate timetable for all days including Saturday and Sunday
                // Check if entry already exists to avoid duplicates
                if (!sched.subject_id) continue;
                const existing = await prisma.timetable.findFirst({
                    where: {
                        class_id: c.id,
                        subject_id: sched.subject_id,
                        date: dateStr,
                        start_time: sched.time_start || '09:00'
                    }
                });

                if (!existing) {
                    await prisma.timetable.create({
                        data: {
                            class_id: c.id,
                            subject_id: sched.subject_id,
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

    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');

    res.json({ success: true, message: `Successfully generated ${createdCount} schedule entries.`, count: createdCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating timetable' });
  }
});

// POST /api/timetable (Admin or Teacher)
router.post('/', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject, teacher_id, date, start_time, end_time, room, online_link, notes } = req.body;

    let finalTeacherId = teacher_id;
    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        finalTeacherId = teacher.id;
    }

    const subRec = await resolveSubjectRecord(subject);

    const entry = await prisma.timetable.create({
      data: {
        class_id,
        subject_id: subRec.id,
        teacher_id: finalTeacherId,
        date,
        start_time,
        end_time,
        room,
        online_link,
        notes,
        status: 'scheduled'
      },
      include: {
        class_ref: { select: { class_name: true } },
        subject: { select: { canonical_name: true } }
      }
    });

    if (req.user!.role === 'teacher' || req.user!.role === 'coordinator') {
      const { logTeacherActivity } = require('../utils/activityLogger');
      await logTeacherActivity(
        req.user!.id,
        'schedule_create',
        null,
        JSON.stringify({ subject: subRec.canonical_name, date, start_time, room, online_link }),
        `Class session for ${entry.class_ref.class_name}: ${subRec.canonical_name}`,
        req
      );
    }

    // Notify affected teacher and students asynchronously
    notifyTimetableChange(
      class_id,
      finalTeacherId,
      date,
      `New class session scheduled: ${subRec.canonical_name} in Room ${room || 'N/A'} at ${start_time} - ${end_time || 'N/A'}.`,
      entry.id
    );

    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');

    res.status(201).json({ success: true, data: { ...entry, subject: entry.subject.canonical_name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/timetable/:id (Admin or Teacher)
router.put('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { class_id, subject, teacher_id, date, start_time, end_time, room, online_link, notes, status } = req.body;

    const existing = await prisma.timetable.findUnique({ 
      where: { id },
      include: { 
        class_ref: { select: { class_name: true } },
        subject: { select: { canonical_name: true } }
      }
    });
    if (!existing) {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }

    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        if (existing.teacher_id !== teacher.id) {
            res.status(403).json({ success: false, message: 'Not authorized to update this entry' });
            return;
        }
    }

    const subRec = subject ? await resolveSubjectRecord(subject) : undefined;

    const entry = await prisma.timetable.update({
      where: { id },
      data: {
        class_id,
        subject_id: subRec ? subRec.id : undefined,
        teacher_id: req.user!.role === 'teacher' ? existing.teacher_id : teacher_id,
        date,
        start_time,
        end_time,
        room,
        online_link,
        notes,
        status
      },
      include: {
        class_ref: { select: { class_name: true } },
        subject: { select: { canonical_name: true } }
      }
    });

    if (req.user!.role === 'teacher' || req.user!.role === 'coordinator') {
      const { logTeacherActivity } = require('../utils/activityLogger');
      const prevVal = {
        subject: existing.subject.canonical_name,
        date: existing.date,
        start_time: existing.start_time,
        room: existing.room,
        online_link: existing.online_link,
        status: existing.status
      };
      const newVal = {
        subject: entry.subject.canonical_name,
        date: entry.date,
        start_time: entry.start_time,
        room: entry.room,
        online_link: entry.online_link,
        status: entry.status
      };
      await logTeacherActivity(
        req.user!.id,
        'schedule_update',
        JSON.stringify(prevVal),
        JSON.stringify(newVal),
        `Class session for ${entry.class_ref.class_name}: ${entry.subject.canonical_name}`,
        req
      );
    }

    // Notify affected teacher and students asynchronously of schedule adjustment
    const hasChanged = existing.date !== date || existing.start_time !== start_time || existing.room !== room || (subRec && existing.subject_id !== subRec.id);
    if (hasChanged) {
      notifyTimetableChange(
        entry.class_id,
        entry.teacher_id,
        entry.date,
        `Class session adjusted: ${entry.subject.canonical_name} in Room ${entry.room || 'N/A'} at ${entry.start_time} - ${entry.end_time || 'N/A'}.`,
        entry.id
      );
    }

    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');

    res.json({ success: true, data: { ...entry, subject: entry.subject.canonical_name } });
  } catch (error: any) {
    if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/timetable/:id (Admin or Teacher)
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.timetable.findUnique({ 
      where: { id },
      include: { 
        class_ref: { select: { class_name: true } },
        subject: { select: { canonical_name: true } }
      }
    });
    if (!existing) {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }

    if (req.user!.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
        if (!teacher) {
            res.status(403).json({ success: false, message: 'Teacher profile not found' });
            return;
        }
        if (existing.teacher_id !== teacher.id) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
            return;
        }
    }

    await prisma.timetable.delete({ where: { id } });

    if (req.user!.role === 'teacher' || req.user!.role === 'coordinator') {
      const { logTeacherActivity } = require('../utils/activityLogger');
      await logTeacherActivity(
        req.user!.id,
        'schedule_delete',
        JSON.stringify({
          subject: existing.subject.canonical_name,
          date: existing.date,
          start_time: existing.start_time,
          room: existing.room,
          online_link: existing.online_link
        }),
        null,
        `Class session for ${existing.class_ref.class_name}: ${existing.subject.canonical_name}`,
        req
      );
    }

    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');

    res.json({ success: true, message: 'Entry deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: 'Entry not found' });
        return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

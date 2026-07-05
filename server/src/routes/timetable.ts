import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { mailEventEmitter } from '../services/mail/sendMail';
import { resolveSubjectRecord } from '../utils/normalization';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import { generateTimetable, generateTimeSlots, ClassConfig, LockedEntry } from '../services/schedulingEngine';
import { randomUUID } from 'crypto';

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
    const { class_ids, start_date, end_date, config, override_conflicts } = req.body;
    
    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
        res.status(400).json({ success: false, message: 'class_ids array is required' });
        return;
    }
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

    // 1. Save or update configs for classes if config object was passed in
    if (config) {
        const { institute_start, institute_end, lecture_duration, working_days, breaks, subjects } = config;
        
        for (const classId of class_ids) {
            await prisma.$transaction(async (tx) => {
                // Upsert TimetableConfig
                const tc = await tx.timetableConfig.upsert({
                    where: { class_id: classId },
                    create: {
                        class_id: classId,
                        institute_start: institute_start || '08:00',
                        institute_end: institute_end || '14:00',
                        lecture_duration: Number(lecture_duration) || 45,
                        working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                        subject_frequencies: JSON.stringify((subjects || []).map((s: any) => ({ ...s, teacher_id: s.teacher_id || null })))
                    },
                    update: {
                        institute_start: institute_start || '08:00',
                        institute_end: institute_end || '14:00',
                        lecture_duration: Number(lecture_duration) || 45,
                        working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                        subject_frequencies: JSON.stringify((subjects || []).map((s: any) => ({ ...s, teacher_id: s.teacher_id || null })))
                    }
                });

                // Clear and recreate breaks
                await tx.timetableBreak.deleteMany({ where: { config_id: tc.id } });
                if (breaks && Array.isArray(breaks)) {
                    await tx.timetableBreak.createMany({
                        data: breaks.map((b: any) => ({
                            config_id: tc.id,
                            break_name: b.break_name || 'Break',
                            after_period: Number(b.after_period) || 4,
                            duration_minutes: Number(b.duration_minutes) || 30
                        }))
                    });
                }
            }, {
                maxWait: 10000,
                timeout: 30000
            });
        }
    }

    // 2. Fetch all configuration and metadata for scheduling engine
    const classConfigs: ClassConfig[] = [];
    const classes = await prisma.class.findMany({
        where: { id: { in: class_ids } },
        include: {
            timetable_config: {
                include: { breaks: true }
            }
        }
    });

    const subjectRecords = await prisma.subject.findMany({ select: { id: true, canonical_name: true } });
    const teacherRecords = await prisma.teacher.findMany({ select: { id: true, first_name: true, last_name: true } });

    const subjectMap = new Map(subjectRecords.map(s => [s.id, s.canonical_name]));
    const teacherMap = new Map(teacherRecords.map(t => [t.id, `${t.first_name || ''} ${t.last_name || ''}`.trim()]));

    for (const c of classes) {
        if (!c.timetable_config) {
            // Create a default config if not exists
            const defaultTc = await prisma.timetableConfig.create({
                data: {
                    class_id: c.id,
                    institute_start: '08:00',
                    institute_end: '14:00',
                    lecture_duration: 45,
                    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    subject_frequencies: '[]'
                },
                include: { breaks: true }
            });
            c.timetable_config = defaultTc;
        }

        const tc = c.timetable_config;
        
        // Fetch ClassSchedule records directly (Academic Planning rules)
        const scheduleRecords = await prisma.classSchedule.findMany({
            where: { class_id: c.id }
        });

        const subjectsList = scheduleRecords.map(sr => {
            const allowedDays = (sr.days || []).map((d: string) => {
                return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
            });

            return {
                subject_id: sr.subject_id || '',
                subject_name: sr.subject_id ? subjectMap.get(sr.subject_id) : undefined,
                teacher_id: sr.teacher_id || null,
                teacher_name: sr.teacher_id ? teacherMap.get(sr.teacher_id) : undefined,
                weekly_count: allowedDays.length,
                allowed_days: allowedDays
            };
        }).filter(s => s.subject_id !== '');

        classConfigs.push({
            class_id: c.id,
            class_name: c.class_name || undefined,
            institute_start: tc.institute_start,
            institute_end: tc.institute_end,
            lecture_duration: tc.lecture_duration,
            working_days: tc.working_days,
            breaks: tc.breaks.map(b => ({
                break_name: b.break_name,
                after_period: b.after_period,
                duration_minutes: b.duration_minutes
            })),
            subjects: subjectsList
        });
    }

    // 3. Load locked/attendance entries in the date range
    const dateStrStart = start_date.split('T')[0];
    const dateStrEnd = end_date.split('T')[0];

    const existingEntries = await prisma.timetable.findMany({
        where: {
            class_id: { in: class_ids },
            date: { gte: dateStrStart, lte: dateStrEnd }
        },
        include: {
            attendance: { select: { id: true } }
        }
    });

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const lockedEntries: LockedEntry[] = [];
    const lockedOrAttendanceDbIds = new Set<string>();

    for (const entry of existingEntries) {
        const hasAttendance = entry.attendance.length > 0;
        if (entry.is_locked || hasAttendance) {
            lockedOrAttendanceDbIds.add(entry.id);
            const dateObj = new Date(entry.date + 'T00:00:00Z');
            const dayName = daysMap[dateObj.getUTCDay()];
            
            lockedEntries.push({
                class_id: entry.class_id,
                day: dayName,
                period_number: entry.period_number || 1,
                subject_id: entry.subject_id,
                teacher_id: entry.teacher_id
            });
        }
    }

    // 4. Run Scheduling Engine
    const genResult = generateTimetable(classConfigs, lockedEntries);

    // 5. Check conflicts
    if (genResult.conflicts.length > 0 && !override_conflicts) {
        res.status(200).json({
            success: false,
            conflicts: genResult.conflicts,
            message: 'Conflicts detected during automatic generation.'
        });
        return;
    }

    // 6. Write to database using transaction
    const generationId = randomUUID();
    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
        // Delete all non-locked entries without attendance for target classes in date range
        await tx.timetable.deleteMany({
            where: {
                class_id: { in: class_ids },
                date: { gte: dateStrStart, lte: dateStrEnd },
                id: { notIn: Array.from(lockedOrAttendanceDbIds) }
            }
        });

        // Stamp generated slots on each date in the range
        const startUTC = new Date(dateStrStart + 'T00:00:00Z');
        const endUTC = new Date(dateStrEnd + 'T00:00:00Z');

        const slotsToInsert: any[] = [];

        for (let d = new Date(startUTC); d <= endUTC; d.setUTCDate(d.getUTCDate() + 1)) {
            const dayOfWeek = daysMap[d.getUTCDay()];
            const dateStr = d.toISOString().split('T')[0];

            for (const slot of genResult.slots) {
                if (slot.day === dayOfWeek) {
                    const isAlreadyOccupied = existingEntries.some(
                        e => e.class_id === slot.class_id &&
                             e.date === dateStr &&
                             e.period_number === slot.period_number &&
                             lockedOrAttendanceDbIds.has(e.id)
                    );

                    if (!isAlreadyOccupied) {
                        slotsToInsert.push({
                            class_id: slot.class_id,
                            subject_id: slot.subject_id,
                            teacher_id: slot.teacher_id,
                            date: dateStr,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            period_number: slot.period_number,
                            is_locked: false,
                            generation_id: generationId,
                            status: 'scheduled'
                        });
                    }
                }
            }
        }

        if (slotsToInsert.length > 0) {
            await tx.timetable.createMany({ data: slotsToInsert });
            createdCount = slotsToInsert.length;
        }
    }, {
        maxWait: 10000,
        timeout: 30000
    });

    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');

    res.json({
        success: true,
        message: `Successfully generated ${createdCount} schedule entries.`,
        count: createdCount,
        analytics: genResult.analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating timetable' });
  }
});

// GET /api/timetable/config/:classId
router.get('/config/:classId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = req.params.classId as string;
    const config = await prisma.timetableConfig.findUnique({
      where: { class_id: classId },
      include: { breaks: true }
    });
    
    if (!config) {
      res.json({ success: true, data: null });
      return;
    }
    
    res.json({
      success: true,
      data: {
        ...config,
        subjects: JSON.parse(config.subject_frequencies || '[]')
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching configuration' });
  }
});

// GET /api/timetable/analytics
router.get('/analytics', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query as Record<string, string>;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, message: 'start_date and end_date queries are required' });
      return;
    }

    const startStr = start_date.split('T')[0];
    const endStr = end_date.split('T')[0];

    const entries = await prisma.timetable.findMany({
      where: { date: { gte: startStr, lte: endStr } },
      include: {
        teacher: { select: { id: true, first_name: true, last_name: true } },
        class_ref: { select: { id: true, class_name: true } }
      }
    });

    const teacherSet = new Set<string>();
    const classSet = new Set<string>();
    const teacherLoad: Record<string, { daily: Record<string, number>; weekly: number; name: string }> = {};
    const subjectDistribution: Record<string, Record<string, number>> = {};
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const entry of entries) {
      if (entry.teacher_id && entry.teacher) {
        teacherSet.add(entry.teacher_id);
        if (!teacherLoad[entry.teacher_id]) {
          teacherLoad[entry.teacher_id] = { daily: {}, weekly: 0, name: `${entry.teacher.first_name || ''} ${entry.teacher.last_name || ''}`.trim() };
        }
        
        const dateObj = new Date(entry.date + 'T00:00:00Z');
        const dayName = daysMap[dateObj.getUTCDay()];
        teacherLoad[entry.teacher_id].daily[dayName] = (teacherLoad[entry.teacher_id].daily[dayName] || 0) + 1;
        teacherLoad[entry.teacher_id].weekly++;
      }

      classSet.add(entry.class_id);
      if (!subjectDistribution[entry.class_id]) {
        subjectDistribution[entry.class_id] = {};
      }
      subjectDistribution[entry.class_id][entry.subject_id] = (subjectDistribution[entry.class_id][entry.subject_id] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        classes_scheduled: classSet.size,
        teachers_utilized: teacherSet.size,
        total_teaching_periods: entries.length,
        teacher_load: teacherLoad,
        subject_distribution: subjectDistribution
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching timetable analytics' });
  }
});

// POST /api/timetable/config
router.post('/config', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, institute_start, institute_end, lecture_duration, working_days, breaks, subjects } = req.body;
    if (!class_id) {
      res.status(400).json({ success: false, message: 'class_id is required' });
      return;
    }

    const tc = await prisma.$transaction(async (tx) => {
      const config = await tx.timetableConfig.upsert({
        where: { class_id },
        create: {
          class_id,
          institute_start: institute_start || '08:00',
          institute_end: institute_end || '14:00',
          lecture_duration: Number(lecture_duration) || 45,
          working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          subject_frequencies: JSON.stringify(subjects || [])
        },
        update: {
          institute_start: institute_start || '08:00',
          institute_end: institute_end || '14:00',
          lecture_duration: Number(lecture_duration) || 45,
          working_days: working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          subject_frequencies: JSON.stringify(subjects || [])
        }
      });

      await tx.timetableBreak.deleteMany({ where: { config_id: config.id } });
      if (breaks && Array.isArray(breaks)) {
        await tx.timetableBreak.createMany({
          data: breaks.map((b: any) => ({
            config_id: config.id,
            break_name: b.break_name || 'Break',
            after_period: Number(b.after_period) || 4,
            duration_minutes: Number(b.duration_minutes) || 30
          }))
        });
      }

      return config;
    }, {
        maxWait: 10000,
        timeout: 30000
    });

    res.json({ success: true, data: tc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error saving configuration' });
  }
});

// PUT /api/timetable/:id/lock
router.put('/:id/lock', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { is_locked } = req.body;

    const updated = await prisma.timetable.update({
      where: { id },
      data: { is_locked: Boolean(is_locked) }
    });

    invalidateCache('/api/timetable');
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error toggling lock status' });
  }
});

// PUT /api/timetable/lock-day
router.put('/lock-day', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, class_id, is_locked } = req.body;
    if (!date) {
      res.status(400).json({ success: false, message: 'date is required' });
      return;
    }

    const whereClause: any = { date };
    if (class_id) whereClause.class_id = class_id;

    await prisma.timetable.updateMany({
      where: whereClause,
      data: { is_locked: Boolean(is_locked) }
    });

    invalidateCache('/api/timetable');
    res.json({ success: true, message: `Successfully updated lock status for date ${date}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error locking/unlocking day' });
  }
});

// POST /api/timetable/swap
router.post('/swap', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id1, id2 } = req.body;
    if (!id1 || !id2) {
      res.status(400).json({ success: false, message: 'Both id1 and id2 are required' });
      return;
    }

    const entry1 = await prisma.timetable.findUnique({ where: { id: id1 } });
    const entry2 = await prisma.timetable.findUnique({ where: { id: id2 } });

    if (!entry1 || !entry2) {
      res.status(404).json({ success: false, message: 'One or both timetable entries not found' });
      return;
    }

    if (entry1.is_locked || entry2.is_locked) {
      res.status(400).json({ success: false, message: 'Cannot swap locked timetable entries' });
      return;
    }

    // Perform swap in a transaction
    await prisma.$transaction(async (tx) => {
      if (entry1.teacher_id) {
        const clash = await tx.timetable.findFirst({
          where: {
            id: { notIn: [id1, id2] },
            teacher_id: entry1.teacher_id,
            date: entry2.date,
            start_time: entry2.start_time
          },
          include: { class_ref: true }
        });
        if (clash) {
          throw new Error(`Teacher conflict: Teacher is already scheduled for class ${clash.class_ref.class_name} at that slot.`);
        }
      }

      if (entry2.teacher_id) {
        const clash = await tx.timetable.findFirst({
          where: {
            id: { notIn: [id1, id2] },
            teacher_id: entry2.teacher_id,
            date: entry1.date,
            start_time: entry1.start_time
          },
          include: { class_ref: true }
        });
        if (clash) {
          throw new Error(`Teacher conflict: Teacher is already scheduled for class ${clash.class_ref.class_name} at that slot.`);
        }
      }

      await tx.timetable.update({
        where: { id: id1 },
        data: {
          date: entry2.date,
          start_time: entry2.start_time,
          end_time: entry2.end_time,
          period_number: entry2.period_number
        }
      });

      await tx.timetable.update({
        where: { id: id2 },
        data: {
          date: entry1.date,
          start_time: entry1.start_time,
          end_time: entry1.end_time,
          period_number: entry1.period_number
        }
      });
    }, {
        maxWait: 10000,
        timeout: 30000
    });

    invalidateCache('/api/timetable');
    res.json({ success: true, message: 'Slots swapped successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'Server error swapping slots' });
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

    // Trigger WhatsApp timetable automation (non-blocking)
    const { onTimetableCreated } = require('../../services/whatsapp/automation.service');
    onTimetableCreated(entry).catch((err: any) => console.error('WhatsApp Timetable Created failed:', err));

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

// DELETE /api/timetable/clear (Admin/Coordinator only)
router.delete('/clear', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.timetable.deleteMany({});
    invalidateCache('/api/timetable');
    invalidateCache('/api/dashboard');
    res.json({ success: true, message: `Successfully cleared all ${result.count} timetable entries.` });
  } catch (error) {
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

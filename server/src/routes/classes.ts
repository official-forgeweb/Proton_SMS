import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const generateClassCode = (): string =>
  `CLS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/classes
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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
        schedule: { include: { teacher: true } },
      },
    });

    const data = classes.map((c: any) => ({
      ...c,
      teacher_name: c.primary_teacher ? `${c.primary_teacher.first_name || ''} ${c.primary_teacher.last_name || ''}`.trim() : null,
      primary_teacher_id: c.primary_teacher?.id || c.primary_teacher_id,
      id: c.id,
      schedule: c.schedule?.map((s: any) => ({
        ...s,
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
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const cls: any = await prisma.class.findUnique({
      where: { id },
      include: {
        primary_teacher: true,
        schedule: { include: { teacher: true } },
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
    });

    const subjectCounts: Record<string, number> = {};
    subjectEnrollments.forEach((se: any) => {
      subjectCounts[se.subject] = (subjectCounts[se.subject] || 0) + 1;
    });

    const students = enrollments
      .filter(e => e.student)
      .map(e => {
        const studentSubjects = subjectEnrollments
          .filter(se => se.student_id === e.student.id)
          .map(se => se.subject);
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
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/classes
router.post('/', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
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

    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      await prisma.classSchedule.createMany({
        data: schedule.map((s: any) => ({
          class_id: newClass.id,
          subject: s.subject,
          teacher_id: s.teacher_id,
          time_start: s.time_start,
          time_end: s.time_end,
          days: s.days || [],
        })),
      });
    }

    const result = await prisma.class.findUnique({
      where: { id: newClass.id },
      include: { schedule: true },
    });

    res.status(201).json({ success: true, data: { ...result, id: result!.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/classes/:id
router.put('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { schedule, ...rest } = req.body;

    const updated = await prisma.class.update({
      where: { id },
      data: rest,
    });

    if (schedule && Array.isArray(schedule)) {
      await prisma.classSchedule.deleteMany({ where: { class_id: id } });
      if (schedule.length > 0) {
        await prisma.classSchedule.createMany({
          data: schedule.map((s: any) => ({
            class_id: id,
            subject: s.subject,
            teacher_id: s.teacher_id,
            time_start: s.time_start,
            time_end: s.time_end,
            days: s.days || [],
          })),
        });
      }
    }

    const result = await prisma.class.findUnique({
      where: { id },
      include: { schedule: true },
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
router.get('/:id/attendance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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
router.post('/:id/attendance', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
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

export default router;

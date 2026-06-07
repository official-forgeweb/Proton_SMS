import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { mailEventEmitter } from '../services/mail/sendMail';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generateEmployeeId = (): string =>
  `EMP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/teachers
router.get('/', authenticateToken, authorize('admin', 'coordinator', 'teacher', 'student'), cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, subject, status } = req.query as Record<string, string>;
    let where: any = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' as const } },
        { last_name: { contains: search, mode: 'insensitive' as const } },
        { employee_id: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (subject) where.subjects = { has: subject };
    if (status) where.employment_status = status;

    const teachers = await prisma.teacher.findMany({ where });
    const teacherIds = teachers.map(t => t.id);

    // Bulk query primary classes and schedules in parallel to avoid sequential N+1 query waterfalls
    const [primaryClasses, schedules] = await Promise.all([
      prisma.class.findMany({
        where: { primary_teacher_id: { in: teacherIds } },
        select: { id: true, primary_teacher_id: true }
      }),
      prisma.classSchedule.findMany({
        where: { teacher_id: { in: teacherIds } },
        select: { class_id: true, teacher_id: true }
      })
    ]);

    // Aggregate unique classes taught by each teacher
    const teacherClassMap = new Map<string, Set<string>>();
    teacherIds.forEach(id => teacherClassMap.set(id, new Set<string>()));

    primaryClasses.forEach(c => {
      if (c.primary_teacher_id) {
        teacherClassMap.get(c.primary_teacher_id)?.add(c.id);
      }
    });

    schedules.forEach(s => {
      if (s.teacher_id && s.class_id) {
        teacherClassMap.get(s.teacher_id)?.add(s.class_id);
      }
    });

    const enriched = teachers.map(t => {
      const classCount = teacherClassMap.get(t.id)?.size || 0;
      return { ...t, id: t.id, class_count: classCount };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/teachers/:id
router.get('/:id', authenticateToken, cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const teacher = isUUID(id)
      ? await prisma.teacher.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
      : await prisma.teacher.findFirst({ where: { employee_id: id } });

    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const [classes, demos] = await Promise.all([
      prisma.class.findMany({ 
        where: { 
            OR: [
                { primary_teacher_id: teacher.id },
                { schedule: { some: { teacher_id: teacher.id } } }
            ]
        }
      }),
      prisma.demoClass.findMany({ where: { teacher_id: teacher.id } }),
    ]);

    res.json({
      success: true,
      data: {
        ...teacher,
        id: teacher.id,
        classes: classes.map(c => ({ ...c, id: c.id })),
        demo_classes: demos.map(d => ({ ...d, id: d.id })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/teachers
router.post('/', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, phone, qualification, specialization, experience_years, date_of_joining, role_type, subjects, gender } = req.body;

    const salt = await bcrypt.genSalt(10);
    const password = req.body.password || `Teacher@${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.create({
      data: { email, password_hash: await bcrypt.hash(password, salt), role: 'teacher' },
    });

    const teacher = await prisma.teacher.create({
      data: {
        user_id: user.id,
        employee_id: generateEmployeeId(),
        first_name, last_name, email, phone, gender,
        qualification, specialization,
        experience_years: experience_years ? parseInt(experience_years) : null,
        date_of_joining,
        role_type: role_type || 'subject_teacher',
        subjects: subjects || [],
      },
    });

    // Emit teacher welcome onboarding notification
    mailEventEmitter.emit('teacher.created', {
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      email,
      employeeId: teacher.employee_id || '',
      tempPass: password,
      role: role_type || 'subject_teacher'
    });

    invalidateCache('/api/teachers');
    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');

    res.status(201).json({
      success: true,
      data: { teacher: { ...teacher, id: teacher.id }, credentials: { email, password } },
      message: `Teacher added: ${teacher.employee_id}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/teachers/:id
router.put('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { password, ...teacherFields } = req.body;
    
    if (teacherFields.hasOwnProperty('experience_years')) {
      teacherFields.experience_years = teacherFields.experience_years ? parseInt(teacherFields.experience_years) : null;
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: teacherFields,
    });

    if (password && teacher.user_id) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await prisma.user.update({ where: { id: teacher.user_id }, data: { password_hash } });
    }

    invalidateCache('/api/teachers');
    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');

    res.json({ success: true, data: { ...teacher, id: teacher.id } });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/teachers/:id/classes
router.get('/:id/classes', authenticateToken, cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    let teacher: any = null;

    if (isUUID(id)) {
      teacher = await prisma.teacher.findFirst({
        where: { OR: [{ id }, { user_id: id }] },
      });
    } else {
      teacher = await prisma.teacher.findFirst({ where: { employee_id: id } });
    }

    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const classes = await prisma.class.findMany({
      where: { 
          OR: [
              { primary_teacher_id: teacher.id },
              { schedule: { some: { teacher_id: teacher.id } } }
          ]
      },
    });

    // Bulk query student counts to avoid N+1 query waterfall
    const enrollments = await prisma.studentClassEnrollment.groupBy({
      by: ['class_id'],
      where: {
        class_id: { in: classes.map(c => c.id) },
        enrollment_status: 'active'
      },
      _count: {
        _all: true
      }
    });

    const countMap: Record<string, number> = {};
    enrollments.forEach(e => {
      countMap[e.class_id] = e._count._all;
    });

    const enriched = classes.map(c => ({
      ...c,
      id: c.id,
      student_count: countMap[c.id] || 0
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/teachers/:id
router.delete('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    // Clear primary teacher associations
    await prisma.class.updateMany({
      where: { primary_teacher_id: id },
      data: { primary_teacher_id: null },
    });

    await prisma.classSchedule.updateMany({
      where: { teacher_id: id },
      data: { teacher_id: null },
    });
    
    await prisma.demoClass.updateMany({
        where: { teacher_id: id },
        data: { teacher_id: null }
    });

    await prisma.teacher.delete({ where: { id } });
    
    if (teacher.user_id) {
        await prisma.user.delete({ where: { id: teacher.user_id } });
    }

    invalidateCache('/api/teachers');
    invalidateCache('/api/classes');
    invalidateCache('/api/dashboard');

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

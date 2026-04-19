import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generateEmployeeId = (): string =>
  `EMP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/teachers
router.get('/', authenticateToken, authorize('admin', 'teacher', 'student'), async (req: Request, res: Response): Promise<void> => {
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

    const enriched = await Promise.all(
      teachers.map(async (t) => {
        const classCount = await prisma.class.count({ 
            where: { 
                OR: [
                    { primary_teacher_id: t.id },
                    { schedule: { some: { teacher_id: t.id } } }
                ]
            } 
        });
        return { ...t, id: t.id, class_count: classCount };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/teachers/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const teacher = isUUID(id)
      ? await prisma.teacher.findUnique({ where: { id } })
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
    const teacher = await prisma.teacher.update({
      where: { id },
      data: req.body,
    });

    if (req.body.password && teacher.user_id) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(req.body.password, salt);
      await prisma.user.update({ where: { id: teacher.user_id }, data: { password_hash } });
    }

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
router.get('/:id/classes', authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

    const enriched = await Promise.all(
      classes.map(async (c) => {
        const student_count = await prisma.studentClassEnrollment.count({
          where: { class_id: c.id, enrollment_status: 'active' },
        });
        return { ...c, id: c.id, student_count };
      })
    );

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

    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

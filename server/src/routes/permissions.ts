import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const paramId = (req: Request): string => String(req.params.id);

const AVAILABLE_PERMISSIONS = [
  'classes',
  'students',
  'enquiries',
  'tests',
  'homework',
  'demos',
  'attendance',
];

// GET /api/permissions/available
router.get('/available', authenticateToken, authorize('admin'), (_req: Request, res: Response): void => {
  res.json({ success: true, data: AVAILABLE_PERMISSIONS });
});

// GET /api/permissions/teachers
router.get('/teachers', authenticateToken, authorize('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { employment_status: { not: 'terminated' } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        email: true,
        role_type: true,
        permissions: true,
        employment_status: true,
      },
    });

    const data = teachers.map(t => ({
      ...t,
      id: t.id,
      permissions: t.permissions || [],
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('GET /permissions/teachers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/permissions/teachers/:id
router.put('/teachers/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, message: 'permissions must be an array' });
      return;
    }

    const sanitized = permissions.filter((p: string) => AVAILABLE_PERMISSIONS.includes(p));

    const teacher = await prisma.teacher.update({
      where: { id },
      data: { permissions: sanitized },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_id: true,
        permissions: true,
      },
    });

    res.json({
      success: true,
      message: `Permissions updated for ${teacher.first_name} ${teacher.last_name}`,
      data: { ...teacher, id: teacher.id, permissions: teacher.permissions || [] },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }
    console.error('PUT /permissions/teachers/:id error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

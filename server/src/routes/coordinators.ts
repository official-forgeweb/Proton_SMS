import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generateCoordinatorId = (): string =>
  `COORD${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const paramId = (req: Request): string => String(req.params.id);

// GET /api/coordinators
router.get('/', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query as Record<string, string>;
    let where: any = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { coordinator_id: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (status) where.status = status;

    const coordinators = await prisma.coordinator.findMany({ where });
    res.json({ success: true, data: coordinators });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/coordinators/:id
router.get('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const coordinator = isUUID(id)
      ? await prisma.coordinator.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
      : await prisma.coordinator.findFirst({ where: { coordinator_id: id } });

    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }

    res.json({ success: true, data: coordinator });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/coordinators
router.post('/', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, gender, profile_image, status } = req.body;

    const salt = await bcrypt.genSalt(10);
    const password = req.body.password || `Coord@${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.user.create({
      data: { email, password_hash: await bcrypt.hash(password, salt), role: 'coordinator' },
    });

    const coordinator = await prisma.coordinator.create({
      data: {
        user_id: user.id,
        coordinator_id: generateCoordinatorId(),
        full_name,
        email,
        phone,
        gender,
        profile_image: profile_image || null,
        status: status || 'active',
        created_by: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: { coordinator, credentials: { email, password } },
      message: `Coordinator onboarded successfully: ${coordinator.coordinator_id}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/coordinators/:id
router.put('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { password, ...coordinatorFields } = req.body;

    const coordinator = await prisma.coordinator.update({
      where: { id },
      data: coordinatorFields,
    });

    if (password && coordinator.user_id) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await prisma.user.update({ where: { id: coordinator.user_id }, data: { password_hash } });
    }

    res.json({ success: true, data: coordinator });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/coordinators/:id
router.delete('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const coordinator = await prisma.coordinator.findUnique({ where: { id } });
    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }

    await prisma.coordinator.delete({ where: { id } });

    if (coordinator.user_id) {
      await prisma.user.delete({ where: { id: coordinator.user_id } });
    }

    res.json({ success: true, message: 'Coordinator deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

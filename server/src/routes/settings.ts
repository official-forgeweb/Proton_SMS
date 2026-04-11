import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get the global settings
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findUnique({
            where: { id: 'global' }
        });

        // Initialize if not exists
        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: { id: 'global' }
            });
        }

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});

// Update the global settings
router.patch('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const updateData = req.body;

        const updated = await prisma.systemSetting.upsert({
            where: { id: 'global' },
            update: updateData,
            create: { id: 'global', ...updateData }
        });

        res.json({ success: true, data: updated, message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});

export default router;

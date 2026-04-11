import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Get Cloudinary Signature for Direct Frontend Uploads
router.get('/signature', authenticateToken, authorize('admin', 'teacher'), (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'proton_study_materials';
        
        // Ensure you have CLOUDINARY_API_SECRET in your .env
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        
        if (!apiSecret) {
            return res.status(500).json({ success: false, message: 'Cloudinary secret missing on server' });
        }

        // Parameters must be sorted alphabetically before signing
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        res.json({
            success: true,
            data: {
                signature,
                timestamp,
                folder,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate signature' });
    }
});

// Create Study Material (After Cloudinary Upload is Complete)
router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { title, subject, class_id, pdf_url } = req.body;
        const uploaderId = (req as any).user.id; // from JWT middleware

        if (!title || !subject || !class_id || !pdf_url) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const material = await prisma.studyMaterial.create({
            data: {
                title,
                subject,
                class_id,
                pdf_url,
                uploaded_by: uploaderId
            }
        });

        res.status(201).json({ success: true, data: material });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to save study material' });
    }
});

// Get all Study Materials (with filters)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { class_id, subject } = req.query;
        const userRole = (req as any).user.role;
        const userId = (req as any).user.id;

        let filters: any = { status: 'active' };

        // Admin and Teachers can see everything or filter
        if (class_id) filters.class_id = String(class_id);
        if (subject) filters.subject = String(subject);

        // If Student, restrict to their class subjects
        // (Assuming you'll enhance this via student's enrolled class later, or via frontend passing class_id securely)
        
        const materials = await prisma.studyMaterial.findMany({
            where: filters,
            include: {
                class_ref: { select: { class_name: true } },
                uploader: { select: { email: true, role: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        res.json({ success: true, data: materials });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch study materials' });
    }
});

// Delete Study Material
router.delete('/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.studyMaterial.delete({ where: { id } });
        res.json({ success: true, message: 'Study material deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete study material' });
    }
});

export default router;

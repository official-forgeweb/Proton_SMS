import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import crypto from 'crypto';
import { resolveSubjectRecord } from '../utils/normalization';

const router = Router();

// Get Cloudinary Signature for Direct Frontend Uploads
router.get('/signature', authenticateToken, authorize('admin', 'coordinator', 'teacher'), (req, res) => {
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
router.post('/', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { title, subject, class_id, pdf_url } = req.body;
        const uploaderId = (req as any).user.id; // from JWT middleware

        if (!title || !subject || !class_id || !pdf_url) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const subRec = await resolveSubjectRecord(subject);

        const material = await prisma.studyMaterial.create({
            data: {
                title,
                subject_id: subRec.id,
                class_id,
                pdf_url,
                uploaded_by: uploaderId
            }
        });

        // Trigger WhatsApp Notification
        const { onStudyMaterialCreated } = require('../services/whatsapp/automation.service');
        onStudyMaterialCreated(material).catch((err: any) => console.error('WhatsApp Study Material Notification failed:', err));

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

        // Prefill class_id and subject if passed
        if (class_id) filters.class_id = String(class_id);
        if (subject) {
            const subRec = await resolveSubjectRecord(String(subject));
            filters.subject_id = subRec.id;
        }

        // If Student, restrict to their class subjects
        if (userRole === 'student') {
            const student = await prisma.student.findUnique({ 
                where: { user_id: userId },
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

            if (student) {
                const classIds = student.class_enrollments.map(e => e.class_id);
                const subjectEnrolls = student.subject_enrollments;

                if (classIds.length === 0) {
                    res.json({ success: true, data: [] });
                    return;
                }

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

                if (filters.OR) {
                    filters.AND = [ { OR: filters.OR }, { OR: orConditions } ];
                    delete filters.OR;
                } else {
                    filters.OR = orConditions;
                }

                if (filters.class_id && !classIds.includes(filters.class_id)) {
                    res.json({ success: true, data: [] });
                    return;
                }
            }
        }

        // If Teacher, restrict to their assigned classes, schedules or uploads
        if (userRole === 'teacher') {
            const teacher = await prisma.teacher.findUnique({ where: { user_id: userId } });
            if (teacher) {
                // 1. Classes where teacher is primary instructor
                const primaryClasses = await prisma.class.findMany({
                    where: { primary_teacher_id: teacher.id },
                    select: { id: true }
                });
                const primaryClassIds = primaryClasses.map(c => c.id);

                // 2. Class-Subject combinations from schedules
                const schedules = await prisma.classSchedule.findMany({
                    where: { teacher_id: teacher.id },
                    select: { class_id: true, subject_id: true }
                });

                const teacherOrConditions: any[] = [];

                if (primaryClassIds.length > 0) {
                    teacherOrConditions.push({ class_id: { in: primaryClassIds } });
                }

                schedules.forEach(sched => {
                    if (sched.class_id && sched.subject_id) {
                        teacherOrConditions.push({
                            class_id: sched.class_id,
                            subject_id: sched.subject_id
                        });
                    }
                });

                // 3. Fallback: study materials uploaded by this teacher
                teacherOrConditions.push({ uploaded_by: userId });

                const currentClassId = filters.class_id;
                const currentSubjectId = filters.subject_id;
                delete filters.class_id;
                delete filters.subject_id;

                const andConditions: any[] = [{ OR: teacherOrConditions }];
                if (currentClassId) {
                    andConditions.push({ class_id: currentClassId });
                }
                if (currentSubjectId) {
                    andConditions.push({ subject_id: currentSubjectId });
                }

                filters.AND = andConditions;
            }
        }

        const materials = await prisma.studyMaterial.findMany({
            where: filters,
            include: {
                class_ref: { select: { class_name: true } },
                uploader: { select: { email: true, role: true } },
                subject: { select: { canonical_name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        const formatted = materials.map(m => ({
            ...m,
            subject: m.subject.canonical_name
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch study materials' });
    }
});

// Delete Study Material
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        await prisma.studyMaterial.delete({ where: { id } });
        res.json({ success: true, message: 'Study material deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete study material' });
    }
});

export default router;

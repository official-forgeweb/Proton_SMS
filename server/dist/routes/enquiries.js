"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const sendMail_1 = require("../services/mail/sendMail");
const router = (0, express_1.Router)();
const paramId = (req) => String(req.params.id);
const generateEnquiryNumber = () => `ENQ${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const generateDemoNumber = () => `DEMO${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
// GET /api/enquiries/demos/all
router.get('/demos/all', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const demos = await database_1.default.demoClass.findMany({
            orderBy: { demo_date: 'desc' },
            include: {
                enquiry: {
                    select: { id: true, student_name: true, phone: true }
                }
            },
            take: 100 // Memory boundary limit
        });
        const data = demos.map((d) => ({
            ...d,
            id: d.id,
            enquiry: d.enquiry,
            enquiry_id: d.enquiry?.id || d.enquiry_id,
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/enquiries/demos/:id
router.put('/demos/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const demo = await database_1.default.demoClass.update({
            where: { id },
            data: req.body,
        });
        if (req.body.status === 'completed') {
            await database_1.default.enquiry.update({
                where: { id: demo.enquiry_id },
                data: { status: 'demo_completed' },
            });
            await database_1.default.enquiryRemark.create({
                data: {
                    enquiry_id: demo.enquiry_id,
                    remark_type: 'meeting',
                    remark: `Demo class #${demo.demo_count || 1} marked as completed.`,
                    created_by: req.user.id,
                },
            });
        }
        res.json({ success: true, data: { ...demo, id: demo.id } });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Demo not found' });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/enquiries
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { search, status, source, priority, assigned_to, page = '1', limit = '50' } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { student_name: { contains: search, mode: 'insensitive' } },
                { enquiry_number: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (priority)
            where.priority = priority;
        if (assigned_to)
            where.assigned_to = assigned_to;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const total = await database_1.default.enquiry.count({ where });
        const skip = (pageNum - 1) * limitNum;
        const enquiries = await database_1.default.enquiry.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limitNum,
        });
        const assignedToIds = [...new Set(enquiries.filter(e => e.assigned_to).map(e => e.assigned_to))];
        let teacherMap = {};
        if (assignedToIds.length > 0) {
            const teachers = await database_1.default.teacher.findMany({
                where: { user_id: { in: assignedToIds } },
            });
            teachers.forEach(t => {
                teacherMap[t.user_id] = `${t.first_name || ''} ${t.last_name || ''}`.trim();
            });
        }
        const data = enquiries.map(e => ({
            ...e,
            id: e.id,
            assigned_teacher_name: e.assigned_to ? (teacherMap[e.assigned_to] || null) : null,
        }));
        res.json({
            success: true,
            data,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/enquiries/stats
router.get('/stats', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const [total, statusGroups, sourceGroups, enrolled] = await Promise.all([
            database_1.default.enquiry.count(),
            database_1.default.enquiry.groupBy({ by: ['status'], _count: true }),
            database_1.default.enquiry.groupBy({ by: ['source'], _count: true }),
            database_1.default.enquiry.count({ where: { converted_to_student: true } }),
        ]);
        const statusCounts = {};
        statusGroups.forEach(g => { if (g.status)
            statusCounts[g.status] = g._count; });
        const sourceCounts = {};
        sourceGroups.forEach(g => { if (g.source)
            sourceCounts[g.source] = g._count; });
        const conversionRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : 0;
        res.json({
            success: true,
            data: { total, by_status: statusCounts, by_source: sourceCounts, enrolled, conversion_rate: parseFloat(String(conversionRate)) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/enquiries/:id
router.get('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const enquiry = await database_1.default.enquiry.findUnique({ where: { id } });
        if (!enquiry) {
            res.status(404).json({ success: false, message: 'Enquiry not found' });
            return;
        }
        const [remarks, demos, teacher] = await Promise.all([
            database_1.default.enquiryRemark.findMany({ where: { enquiry_id: enquiry.id }, orderBy: { created_at: 'desc' } }),
            database_1.default.demoClass.findMany({ where: { enquiry_id: enquiry.id }, orderBy: { demo_date: 'desc' } }),
            enquiry.assigned_to ? database_1.default.teacher.findFirst({ where: { user_id: enquiry.assigned_to } }) : null,
        ]);
        res.json({
            success: true,
            data: {
                ...enquiry,
                id: enquiry.id,
                assigned_teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher.id } : null,
                remarks: remarks.map(r => ({ ...r, id: r.id })),
                demos: demos.map(d => ({ ...d, id: d.id })),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/enquiries
router.post('/', async (req, res) => {
    try {
        const enquiry = await database_1.default.enquiry.create({
            data: {
                enquiry_number: generateEnquiryNumber(),
                ...req.body,
                status: 'new',
                priority: req.body.priority || 'medium',
            },
        });
        res.status(201).json({ success: true, data: { ...enquiry, id: enquiry.id }, message: `Enquiry created: ${enquiry.enquiry_number}` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/enquiries/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const oldEnquiry = await database_1.default.enquiry.findUnique({ where: { id } });
        if (!oldEnquiry) {
            res.status(404).json({ success: false, message: 'Enquiry not found' });
            return;
        }
        const oldStatus = oldEnquiry.status;
        const updated = await database_1.default.enquiry.update({
            where: { id },
            data: req.body,
        });
        if (req.body.status && req.body.status !== oldStatus) {
            await database_1.default.enquiryRemark.create({
                data: {
                    enquiry_id: id,
                    remark_type: 'follow_up',
                    remark: `Status changed from ${oldStatus} to ${req.body.status}`,
                    created_by: req.user.id,
                },
            });
            if (req.body.status === 'resolved' && updated.email) {
                sendMail_1.mailEventEmitter.emit('enquiry.resolved', {
                    name: updated.student_name || 'Enquirer',
                    email: updated.email,
                    subject: updated.interested_course || 'ERP Enquiry',
                    response: req.body.resolution_note || 'Your enquiry has been successfully resolved by our coordinators.',
                    enquiryId: updated.id
                });
            }
        }
        res.json({ success: true, data: { ...updated, id: updated.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/enquiries/:id/remarks
router.post('/:id/remarks', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const enquiry = await database_1.default.enquiry.findUnique({ where: { id } });
        if (!enquiry) {
            res.status(404).json({ success: false, message: 'Enquiry not found' });
            return;
        }
        const remark = await database_1.default.enquiryRemark.create({
            data: {
                enquiry_id: id,
                ...req.body,
                created_by: req.user.id,
            },
        });
        await database_1.default.enquiry.update({
            where: { id },
            data: {
                followup_count: { increment: 1 },
                ...(req.body.status ? { status: req.body.status } : {}),
            },
        });
        const [teacher, user] = await Promise.all([
            database_1.default.teacher.findFirst({ where: { user_id: req.user.id } }),
            database_1.default.user.findUnique({ where: { id: req.user.id } }),
        ]);
        res.status(201).json({
            success: true,
            data: {
                ...remark,
                id: remark.id,
                added_by_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : (user?.email || 'Admin'),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/enquiries/:id/schedule-demo
router.post('/:id/schedule-demo', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const enquiry = await database_1.default.enquiry.findUnique({ where: { id } });
        if (!enquiry) {
            res.status(404).json({ success: false, message: 'Enquiry not found' });
            return;
        }
        const existingCount = await database_1.default.demoClass.count({ where: { enquiry_id: enquiry.id } });
        const demo = await database_1.default.demoClass.create({
            data: {
                demo_number: generateDemoNumber(),
                enquiry_id: enquiry.id,
                demo_date: req.body.demo_date,
                demo_time: req.body.demo_time,
                subject: req.body.subject || enquiry.interested_course,
                topic: req.body.topic,
                class_id: req.body.class_id,
                teacher_id: req.body.teacher_id,
                demo_count: existingCount + 1,
            },
        });
        await database_1.default.enquiry.update({
            where: { id: enquiry.id },
            data: { status: 'demo_scheduled' },
        });
        res.status(201).json({ success: true, data: { ...demo, id: demo.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=enquiries.js.map
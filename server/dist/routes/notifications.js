"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudentUserIds = exports.getTeacherUserIds = exports.getStudentUserIdsForClass = exports.sendNotification = void 0;
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Helper: send notification to multiple recipients
const sendNotification = async (recipientIds, senderId, type, title, message, referenceId) => {
    if (recipientIds.length === 0)
        return;
    try {
        await database_1.default.notification.createMany({
            data: recipientIds.map(rid => ({
                recipient_id: rid,
                sender_id: senderId,
                type,
                title,
                message,
                reference_id: referenceId || null,
            })),
        });
    }
    catch (error) {
        console.error('Failed to send notifications:', error);
    }
};
exports.sendNotification = sendNotification;
// Helper: get student user IDs enrolled in a class
const getStudentUserIdsForClass = async (classId) => {
    const enrollments = await database_1.default.studentClassEnrollment.findMany({
        where: { class_id: classId, enrollment_status: 'active' },
        include: { student: { select: { user_id: true } } },
    });
    return enrollments.map(e => e.student.user_id).filter(Boolean);
};
exports.getStudentUserIdsForClass = getStudentUserIdsForClass;
// Helper: get all teacher user IDs
const getTeacherUserIds = async () => {
    const teachers = await database_1.default.teacher.findMany({
        where: { employment_status: 'active' },
        select: { user_id: true },
    });
    return teachers.map(t => t.user_id);
};
exports.getTeacherUserIds = getTeacherUserIds;
// Helper: get all student user IDs
const getAllStudentUserIds = async () => {
    const students = await database_1.default.student.findMany({
        where: { academic_status: 'active' },
        select: { user_id: true },
    });
    return students.map(s => s.user_id);
};
exports.getAllStudentUserIds = getAllStudentUserIds;
// GET /api/notifications — get current user's notifications
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = '1', limit = '20', unread_only } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        let where = { recipient_id: req.user.id };
        if (unread_only === 'true')
            where.is_read = false;
        const [total, notifications] = await Promise.all([
            database_1.default.notification.count({ where }),
            database_1.default.notification.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    sender: { select: { id: true, email: true, role: true } },
                },
            }),
        ]);
        const unreadCount = await database_1.default.notification.count({
            where: { recipient_id: req.user.id, is_read: false },
        });
        res.json({
            success: true,
            data: notifications.map(n => ({
                ...n,
                sender_email: n.sender?.email,
                sender_role: n.sender?.role,
                sender: undefined,
            })),
            unread_count: unreadCount,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/notifications/unread-count
router.get('/unread-count', auth_1.authenticateToken, async (req, res) => {
    try {
        const count = await database_1.default.notification.count({
            where: { recipient_id: req.user.id, is_read: false },
        });
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/notifications/:id/read — mark single notification as read
router.put('/:id/read', auth_1.authenticateToken, async (req, res) => {
    try {
        await database_1.default.notification.updateMany({
            where: { id: req.params.id, recipient_id: req.user.id },
            data: { is_read: true },
        });
        res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', auth_1.authenticateToken, async (req, res) => {
    try {
        await database_1.default.notification.updateMany({
            where: { recipient_id: req.user.id, is_read: false },
            data: { is_read: true },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/notifications/send — Admin/Teacher sends announcement
router.post('/send', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), async (req, res) => {
    try {
        const { title, message, target } = req.body;
        if (!title || !message || !target) {
            res.status(400).json({ success: false, message: 'title, message, and target are required' });
            return;
        }
        let recipientIds = [];
        if (target === 'all_students') {
            recipientIds = await (0, exports.getAllStudentUserIds)();
        }
        else if (target === 'all_teachers') {
            recipientIds = await (0, exports.getTeacherUserIds)();
        }
        else if (target === 'all') {
            const [students, teachers] = await Promise.all([
                (0, exports.getAllStudentUserIds)(),
                (0, exports.getTeacherUserIds)(),
            ]);
            recipientIds = [...students, ...teachers];
        }
        else if (target.startsWith('class:')) {
            const classId = target.replace('class:', '');
            recipientIds = await (0, exports.getStudentUserIdsForClass)(classId);
        }
        // Filter out sender from recipients
        recipientIds = recipientIds.filter(id => id !== req.user.id);
        if (recipientIds.length === 0) {
            res.status(400).json({ success: false, message: 'No recipients found for the target audience' });
            return;
        }
        await (0, exports.sendNotification)(recipientIds, req.user.id, 'announcement', title, message);
        res.json({ success: true, message: `Announcement sent to ${recipientIds.length} recipients` });
    }
    catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/notifications/:id
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        await database_1.default.notification.deleteMany({
            where: { id: req.params.id, recipient_id: req.user.id },
        });
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map
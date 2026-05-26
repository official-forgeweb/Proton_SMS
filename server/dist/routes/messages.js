"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/messages/users - List allowed contacts based on user role
router.get('/users', auth_1.authenticateToken, async (req, res) => {
    try {
        const role = req.user.role;
        let contacts = [];
        if (role === 'admin') {
            // Admin can chat with Teachers and Students
            const [teachers, students] = await Promise.all([
                database_1.default.teacher.findMany({
                    where: { employment_status: 'active' },
                    include: { user: { select: { id: true, email: true } } }
                }),
                database_1.default.student.findMany({
                    where: { academic_status: 'active' },
                    include: { user: { select: { id: true, email: true } } }
                })
            ]);
            contacts = [
                ...teachers.map(t => ({
                    id: t.user.id,
                    name: t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : t.user.email,
                    role: 'teacher',
                    info: t.employee_id || 'Teacher'
                })),
                ...students.map(s => ({
                    id: s.user.id,
                    name: s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.user.email,
                    role: 'student',
                    info: s.PRO_ID || 'Student'
                }))
            ];
        }
        else if (role === 'teacher') {
            // Teacher can chat with Admin and Students
            const [admins, students] = await Promise.all([
                database_1.default.user.findMany({
                    where: { role: 'admin', is_active: true },
                    select: { id: true, email: true }
                }),
                database_1.default.student.findMany({
                    where: { academic_status: 'active' },
                    include: { user: { select: { id: true, email: true } } }
                })
            ]);
            contacts = [
                ...admins.map(a => ({
                    id: a.id,
                    name: a.email,
                    role: 'admin',
                    info: 'Admin'
                })),
                ...students.map(s => ({
                    id: s.user.id,
                    name: s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.user.email,
                    role: 'student',
                    info: s.PRO_ID || 'Student'
                }))
            ];
        }
        else if (role === 'student') {
            // Student can chat with Admin and Teachers
            const [admins, teachers] = await Promise.all([
                database_1.default.user.findMany({
                    where: { role: 'admin', is_active: true },
                    select: { id: true, email: true }
                }),
                database_1.default.teacher.findMany({
                    where: { employment_status: 'active' },
                    include: { user: { select: { id: true, email: true } } }
                })
            ]);
            contacts = [
                ...admins.map(a => ({
                    id: a.id,
                    name: a.email,
                    role: 'admin',
                    info: 'Admin'
                })),
                ...teachers.map(t => ({
                    id: t.user.id,
                    name: t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : t.user.email,
                    role: 'teacher',
                    info: t.employee_id || 'Teacher'
                }))
            ];
        }
        res.json({ success: true, data: contacts });
    }
    catch (error) {
        console.error('Fetch users for chat error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/messages/history/:contactId - Get chat history
router.get('/history/:contactId', auth_1.authenticateToken, async (req, res) => {
    try {
        const contactId = String(req.params.contactId);
        const userId = req.user.id;
        // Retrieve conversation history
        const messages = await database_1.default.message.findMany({
            where: {
                OR: [
                    { sender_id: userId, recipient_id: contactId },
                    { sender_id: contactId, recipient_id: userId }
                ]
            },
            orderBy: { created_at: 'asc' }
        });
        // Mark received messages as read
        await database_1.default.message.updateMany({
            where: {
                sender_id: contactId,
                recipient_id: userId,
                is_read: false
            },
            data: { is_read: true }
        });
        res.json({ success: true, data: messages });
    }
    catch (error) {
        console.error('Fetch message history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/messages/send - Send a message
router.post('/send', auth_1.authenticateToken, async (req, res) => {
    try {
        const { recipient_id, content } = req.body;
        const userId = req.user.id;
        if (!recipient_id || !content) {
            res.status(400).json({ success: false, message: 'recipient_id and content are required' });
            return;
        }
        const message = await database_1.default.message.create({
            data: {
                sender_id: userId,
                recipient_id,
                content
            }
        });
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map
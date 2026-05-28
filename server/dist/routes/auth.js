"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { email, password, pro_id, username } = req.body;
        let loginIdentifier = username || email || pro_id;
        if (!loginIdentifier) {
            res.status(400).json({ success: false, message: 'Invalid credentials provided' });
            return;
        }
        loginIdentifier = loginIdentifier.trim();
        let user = null;
        if (loginIdentifier.toUpperCase().startsWith('PRO')) {
            const student = await database_1.default.student.findFirst({
                where: { PRO_ID: { equals: loginIdentifier, mode: 'insensitive' } },
            });
            if (student) {
                user = await database_1.default.user.findUnique({ where: { id: student.user_id } });
            }
        }
        else if (loginIdentifier.toUpperCase().startsWith('EMP')) {
            const teacher = await database_1.default.teacher.findFirst({
                where: { employee_id: { equals: loginIdentifier, mode: 'insensitive' } },
            });
            if (teacher) {
                user = await database_1.default.user.findUnique({ where: { id: teacher.user_id } });
            }
        }
        else {
            user = await database_1.default.user.findFirst({
                where: { email: { equals: loginIdentifier, mode: 'insensitive' } },
            });
        }
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        if (!user.is_active) {
            res.status(403).json({ success: false, message: 'Account is deactivated' });
            return;
        }
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            res.status(423).json({ success: false, message: 'Account is locked.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            await database_1.default.user.update({
                where: { id: user.id },
                data: {
                    failed_login_attempts: { increment: 1 },
                    locked_until: user.failed_login_attempts >= 4 ? new Date(Date.now() + 30 * 60000) : null,
                },
            });
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        await database_1.default.user.update({
            where: { id: user.id },
            data: { failed_login_attempts: 0, locked_until: null, last_login: new Date() },
        });
        if (user.role === 'teacher' || user.role === 'coordinator') {
            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(user.id, 'login', null, null, `${user.role === 'coordinator' ? 'Coordinator' : 'Teacher'} Portal Login`, req);
        }
        const accessToken = (0, auth_1.generateAccessToken)(user.id, user.role);
        const refreshToken = (0, auth_1.generateRefreshToken)(user.id);
        let profile = {};
        if (user.role === 'student') {
            profile = await database_1.default.student.findUnique({ where: { user_id: user.id } }) || {};
        }
        else if (user.role === 'teacher') {
            const t = await database_1.default.teacher.findUnique({ where: { user_id: user.id } });
            profile = t ? { ...t, permissions: t.permissions || [] } : {};
        }
        else if (user.role === 'coordinator') {
            const c = await database_1.default.coordinator.findUnique({ where: { user_id: user.id } });
            profile = c ? { first_name: c.full_name?.split(' ')[0] || '', last_name: c.full_name?.split(' ').slice(1).join(' ') || '', full_name: c.full_name, email: c.email, phone: c.phone, coordinator_id: c.coordinator_id, gender: c.gender, profile_image: c.profile_image } : {};
        }
        else if (user.role === 'admin') {
            profile = { first_name: 'Admin', last_name: 'User', email: user.email };
        }
        res.json({
            success: true,
            data: { user: { id: user.id, email: user.email, role: user.role, profile }, accessToken, refreshToken },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existingUser = await database_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const password_hash = await bcryptjs_1.default.hash(password, salt);
        const user = await database_1.default.user.create({
            data: { email, password_hash, role: role || 'student' },
        });
        res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role } } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await database_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        let profile = {};
        if (user.role === 'student') {
            profile = await database_1.default.student.findUnique({ where: { user_id: user.id } }) || {};
        }
        else if (user.role === 'teacher') {
            const t = await database_1.default.teacher.findUnique({ where: { user_id: user.id } });
            profile = t ? { ...t, permissions: t.permissions || [] } : {};
        }
        else if (user.role === 'coordinator') {
            const c = await database_1.default.coordinator.findUnique({ where: { user_id: user.id } });
            profile = c ? { first_name: c.full_name?.split(' ')[0] || '', last_name: c.full_name?.split(' ').slice(1).join(' ') || '', full_name: c.full_name, email: c.email, phone: c.phone, coordinator_id: c.coordinator_id, gender: c.gender, profile_image: c.profile_image } : {};
        }
        else if (user.role === 'admin') {
            profile = { first_name: 'Admin', last_name: 'User', email: user.email };
        }
        res.json({ success: true, data: { id: user.id, email: user.email, role: user.role, profile } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/change-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await database_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password incorrect' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const password_hash = await bcryptjs_1.default.hash(newPassword, salt);
        await database_1.default.user.update({ where: { id: user.id }, data: { password_hash } });
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map
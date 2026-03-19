const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Student, Teacher, Parent } = require('../models');
const { authenticateToken, generateAccessToken, generateRefreshToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password, pro_id, username } = req.body;

        let loginIdentifier = username || email || pro_id;
        if (!loginIdentifier) return res.status(400).json({ success: false, message: 'Invalid credentials provided' });
        loginIdentifier = loginIdentifier.trim();

        let user;
        if (loginIdentifier.toUpperCase().startsWith('PRO')) {
            const student = await Student.findOne({ PRO_ID: new RegExp(`^${loginIdentifier}$`, 'i') }).lean();
            if (student) user = await User.findById(student.user_id).lean();
        } else if (loginIdentifier.toUpperCase().startsWith('EMP')) {
            const teacher = await Teacher.findOne({ employee_id: new RegExp(`^${loginIdentifier}$`, 'i') }).lean();
            if (teacher) user = await User.findById(teacher.user_id).lean();
        } else {
            user = await User.findOne({ email: new RegExp(`^${loginIdentifier}$`, 'i') }).lean();
        }

        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is deactivated' });
        if (user.locked_until && new Date(user.locked_until) > new Date()) return res.status(423).json({ success: false, message: 'Account is locked.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await User.findByIdAndUpdate(user._id, {
                $inc: { failed_login_attempts: 1 },
                $set: { locked_until: user.failed_login_attempts >= 4 ? new Date(Date.now() + 30 * 60000) : null }
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        await User.findByIdAndUpdate(user._id, { $set: { failed_login_attempts: 0, locked_until: null, last_login: new Date() } });

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        let profile = {};
        if (user.role === 'student') profile = await Student.findOne({ user_id: user._id }).lean() || {};
        else if (user.role === 'teacher') {
            const t = await Teacher.findOne({ user_id: user._id }).lean();
            profile = t ? { ...t, permissions: t.permissions || [] } : {};
        }
        else if (user.role === 'parent') profile = await Parent.findOne({ user_id: user._id }).lean() || {};
        else if (user.role === 'admin') profile = { first_name: 'Admin', last_name: 'User', email: user.email };

        res.json({
            success: true,
            data: { user: { id: user._id, email: user.email, role: user.role, profile }, accessToken, refreshToken },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await User.create({ email, password_hash, role: role || 'student' });
        res.status(201).json({ success: true, data: { user: { id: user._id, email: user.email, role: user.role } } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        let profile = {};
        if (user.role === 'student') profile = await Student.findOne({ user_id: user._id }).lean() || {};
        else if (user.role === 'teacher') {
            const t = await Teacher.findOne({ user_id: user._id }).lean();
            profile = t ? { ...t, permissions: t.permissions || [] } : {};
        }
        else if (user.role === 'parent') profile = await Parent.findOne({ user_id: user._id }).lean() || {};
        else if (user.role === 'admin') profile = { first_name: 'Admin', last_name: 'User', email: user.email };

        res.json({ success: true, data: { id: user._id, email: user.email, role: user.role, profile } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

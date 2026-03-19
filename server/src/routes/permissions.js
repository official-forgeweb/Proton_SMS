const express = require('express');
const { Teacher } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// All available permission keys that can be granted to teachers
const AVAILABLE_PERMISSIONS = [
    'classes',
    'students',
    'enquiries',
    'tests',
    'homework',
    'demos',
    'attendance',
];

// GET /api/permissions/available — list all toggleable permission keys
router.get('/available', authenticateToken, authorize('admin'), (req, res) => {
    res.json({ success: true, data: AVAILABLE_PERMISSIONS });
});

// GET /api/permissions/teachers — list all teachers with their permissions
router.get('/teachers', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const teachers = await Teacher.find(
            { employment_status: { $ne: 'terminated' } },
            'first_name last_name employee_id email role_type permissions employment_status'
        ).lean();

        const data = teachers.map(t => ({
            ...t,
            id: t._id,
            permissions: t.permissions || [],
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('GET /permissions/teachers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/permissions/teachers/:id — update a teacher's permissions
router.put('/teachers/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'permissions must be an array' });
        }

        // Only allow known permission keys
        const sanitized = permissions.filter(p => AVAILABLE_PERMISSIONS.includes(p));

        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { $set: { permissions: sanitized } },
            { new: true, select: 'first_name last_name employee_id permissions' }
        ).lean();

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        res.json({
            success: true,
            message: `Permissions updated for ${teacher.first_name} ${teacher.last_name}`,
            data: { ...teacher, id: teacher._id, permissions: teacher.permissions || [] },
        });
    } catch (error) {
        console.error('PUT /permissions/teachers/:id error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

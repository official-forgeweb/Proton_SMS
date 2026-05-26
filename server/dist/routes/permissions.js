"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const paramId = (req) => String(req.params.id);
const AVAILABLE_PERMISSIONS = [
    'classes',
    'students',
    'enquiries',
    'tests',
    'homework',
    'demos',
    'attendance',
];
// GET /api/permissions/available
router.get('/available', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), (_req, res) => {
    res.json({ success: true, data: AVAILABLE_PERMISSIONS });
});
// GET /api/permissions/teachers
router.get('/teachers', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (_req, res) => {
    try {
        const teachers = await database_1.default.teacher.findMany({
            where: { employment_status: { not: 'terminated' } },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                employee_id: true,
                email: true,
                role_type: true,
                permissions: true,
                employment_status: true,
            },
        });
        const data = teachers.map(t => ({
            ...t,
            id: t.id,
            permissions: t.permissions || [],
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('GET /permissions/teachers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/permissions/teachers/:id
router.put('/teachers/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            res.status(400).json({ success: false, message: 'permissions must be an array' });
            return;
        }
        const sanitized = permissions.filter((p) => AVAILABLE_PERMISSIONS.includes(p));
        const teacher = await database_1.default.teacher.update({
            where: { id },
            data: { permissions: sanitized },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                employee_id: true,
                permissions: true,
            },
        });
        res.json({
            success: true,
            message: `Permissions updated for ${teacher.first_name} ${teacher.last_name}`,
            data: { ...teacher, id: teacher.id, permissions: teacher.permissions || [] },
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Teacher not found' });
            return;
        }
        console.error('PUT /permissions/teachers/:id error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=permissions.js.map
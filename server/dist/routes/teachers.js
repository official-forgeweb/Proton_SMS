"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const sendMail_1 = require("../services/mail/sendMail");
const cache_1 = require("../middleware/cache");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const generateEmployeeId = () => `EMP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const paramId = (req) => String(req.params.id);
// GET /api/teachers
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher', 'student'), (0, cache_1.cacheMiddleware)(15), async (req, res) => {
    try {
        const { search, subject, status } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { employee_id: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (subject)
            where.subjects = { has: subject };
        if (status)
            where.employment_status = status;
        const teachers = await database_1.default.teacher.findMany({ where });
        const enriched = await Promise.all(teachers.map(async (t) => {
            const classCount = await database_1.default.class.count({
                where: {
                    OR: [
                        { primary_teacher_id: t.id },
                        { schedule: { some: { teacher_id: t.id } } }
                    ]
                }
            });
            return { ...t, id: t.id, class_count: classCount };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/teachers/:id
router.get('/:id', auth_1.authenticateToken, (0, cache_1.cacheMiddleware)(15), async (req, res) => {
    try {
        const id = paramId(req);
        const teacher = isUUID(id)
            ? await database_1.default.teacher.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.teacher.findFirst({ where: { employee_id: id } });
        if (!teacher) {
            res.status(404).json({ success: false, message: 'Teacher not found' });
            return;
        }
        const [classes, demos] = await Promise.all([
            database_1.default.class.findMany({
                where: {
                    OR: [
                        { primary_teacher_id: teacher.id },
                        { schedule: { some: { teacher_id: teacher.id } } }
                    ]
                }
            }),
            database_1.default.demoClass.findMany({ where: { teacher_id: teacher.id } }),
        ]);
        res.json({
            success: true,
            data: {
                ...teacher,
                id: teacher.id,
                classes: classes.map(c => ({ ...c, id: c.id })),
                demo_classes: demos.map(d => ({ ...d, id: d.id })),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/teachers
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, qualification, specialization, experience_years, date_of_joining, role_type, subjects, gender } = req.body;
        const salt = await bcryptjs_1.default.genSalt(10);
        const password = req.body.password || `Teacher@${Math.floor(1000 + Math.random() * 9000)}`;
        const user = await database_1.default.user.create({
            data: { email, password_hash: await bcryptjs_1.default.hash(password, salt), role: 'teacher' },
        });
        const teacher = await database_1.default.teacher.create({
            data: {
                user_id: user.id,
                employee_id: generateEmployeeId(),
                first_name, last_name, email, phone, gender,
                qualification, specialization,
                experience_years: experience_years ? parseInt(experience_years) : null,
                date_of_joining,
                role_type: role_type || 'subject_teacher',
                subjects: subjects || [],
            },
        });
        // Emit teacher welcome onboarding notification
        sendMail_1.mailEventEmitter.emit('teacher.created', {
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            email,
            employeeId: teacher.employee_id || '',
            tempPass: password,
            role: role_type || 'subject_teacher'
        });
        (0, cache_1.invalidateCache)('/api/teachers');
        (0, cache_1.invalidateCache)('/api/classes');
        (0, cache_1.invalidateCache)('/api/dashboard');
        res.status(201).json({
            success: true,
            data: { teacher: { ...teacher, id: teacher.id }, credentials: { email, password } },
            message: `Teacher added: ${teacher.employee_id}`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/teachers/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const { password, ...teacherFields } = req.body;
        if (teacherFields.hasOwnProperty('experience_years')) {
            teacherFields.experience_years = teacherFields.experience_years ? parseInt(teacherFields.experience_years) : null;
        }
        const teacher = await database_1.default.teacher.update({
            where: { id },
            data: teacherFields,
        });
        if (password && teacher.user_id) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const password_hash = await bcryptjs_1.default.hash(password, salt);
            await database_1.default.user.update({ where: { id: teacher.user_id }, data: { password_hash } });
        }
        (0, cache_1.invalidateCache)('/api/teachers');
        (0, cache_1.invalidateCache)('/api/classes');
        (0, cache_1.invalidateCache)('/api/dashboard');
        res.json({ success: true, data: { ...teacher, id: teacher.id } });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Teacher not found' });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/teachers/:id/classes
router.get('/:id/classes', auth_1.authenticateToken, (0, cache_1.cacheMiddleware)(15), async (req, res) => {
    try {
        const id = paramId(req);
        let teacher = null;
        if (isUUID(id)) {
            teacher = await database_1.default.teacher.findFirst({
                where: { OR: [{ id }, { user_id: id }] },
            });
        }
        else {
            teacher = await database_1.default.teacher.findFirst({ where: { employee_id: id } });
        }
        if (!teacher) {
            res.status(404).json({ success: false, message: 'Teacher not found' });
            return;
        }
        const classes = await database_1.default.class.findMany({
            where: {
                OR: [
                    { primary_teacher_id: teacher.id },
                    { schedule: { some: { teacher_id: teacher.id } } }
                ]
            },
        });
        const enriched = await Promise.all(classes.map(async (c) => {
            const student_count = await database_1.default.studentClassEnrollment.count({
                where: { class_id: c.id, enrollment_status: 'active' },
            });
            return { ...c, id: c.id, student_count };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/teachers/:id
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const teacher = await database_1.default.teacher.findUnique({ where: { id } });
        if (!teacher) {
            res.status(404).json({ success: false, message: 'Teacher not found' });
            return;
        }
        // Clear primary teacher associations
        await database_1.default.class.updateMany({
            where: { primary_teacher_id: id },
            data: { primary_teacher_id: null },
        });
        await database_1.default.classSchedule.updateMany({
            where: { teacher_id: id },
            data: { teacher_id: null },
        });
        await database_1.default.demoClass.updateMany({
            where: { teacher_id: id },
            data: { teacher_id: null }
        });
        await database_1.default.teacher.delete({ where: { id } });
        if (teacher.user_id) {
            await database_1.default.user.delete({ where: { id: teacher.user_id } });
        }
        (0, cache_1.invalidateCache)('/api/teachers');
        (0, cache_1.invalidateCache)('/api/classes');
        (0, cache_1.invalidateCache)('/api/dashboard');
        res.json({ success: true, message: 'Teacher deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=teachers.js.map
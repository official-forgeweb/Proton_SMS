"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const generateClassCode = () => `CLS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const paramId = (req) => String(req.params.id);
// GET /api/classes
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { subject, grade_level, status, batch_type, academic_year } = req.query;
        let where = {};
        if (subject)
            where.subject = subject;
        if (grade_level)
            where.grade_level = grade_level;
        if (status)
            where.status = status;
        if (batch_type)
            where.batch_type = batch_type;
        if (academic_year)
            where.academic_year = academic_year;
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (teacher) {
                where.OR = [
                    { primary_teacher_id: teacher.id },
                    { schedule: { some: { teacher_id: teacher.id } } }
                ];
            }
        }
        const classes = await database_1.default.class.findMany({
            where,
            include: {
                primary_teacher: true,
                schedule: { include: { teacher: true } },
            },
        });
        const data = classes.map((c) => ({
            ...c,
            teacher_name: c.primary_teacher ? `${c.primary_teacher.first_name || ''} ${c.primary_teacher.last_name || ''}`.trim() : null,
            primary_teacher_id: c.primary_teacher?.id || c.primary_teacher_id,
            id: c.id,
            schedule: c.schedule?.map((s) => ({
                ...s,
                teacher_name: s.teacher ? `${s.teacher.first_name || ''} ${s.teacher.last_name || ''}`.trim() : 'Unassigned',
                teacher_id: s.teacher?.id || s.teacher_id,
            })),
            primary_teacher: undefined,
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/classes/:id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const cls = await database_1.default.class.findUnique({
            where: { id },
            include: {
                primary_teacher: true,
                schedule: { include: { teacher: true } },
            },
        });
        if (!cls) {
            res.status(404).json({ success: false, message: 'Class not found' });
            return;
        }
        const enrollments = await database_1.default.studentClassEnrollment.findMany({
            where: { class_id: cls.id, enrollment_status: 'active' },
            include: { student: true },
        });
        // Get subject enrollment counts
        const subjectEnrollments = await database_1.default.studentSubjectEnrollment.findMany({
            where: { class_id: cls.id, status: 'active' },
        });
        const subjectCounts = {};
        subjectEnrollments.forEach((se) => {
            subjectCounts[se.subject] = (subjectCounts[se.subject] || 0) + 1;
        });
        const students = enrollments
            .filter(e => e.student)
            .map(e => {
            const studentSubjects = subjectEnrollments
                .filter(se => se.student_id === e.student.id)
                .map(se => se.subject);
            return {
                ...e.student,
                id: e.student.id,
                enrolled_subjects: studentSubjects,
                enrollment: { ...e, student_id: e.student_id, student: undefined },
            };
        });
        const teacher = cls.primary_teacher;
        res.json({
            success: true,
            data: {
                ...cls,
                id: cls.id,
                teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher.id } : null,
                primary_teacher_id: teacher?.id,
                primary_teacher: undefined,
                students,
                subject_counts: subjectCounts,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/classes
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const { schedule, ...rest } = req.body;
        const newClass = await database_1.default.class.create({
            data: {
                class_code: generateClassCode(),
                ...rest,
                current_students_count: 0,
                status: rest.status || 'upcoming',
            },
        });
        if (schedule && Array.isArray(schedule) && schedule.length > 0) {
            await database_1.default.classSchedule.createMany({
                data: schedule.map((s) => ({
                    class_id: newClass.id,
                    subject: s.subject,
                    teacher_id: s.teacher_id,
                    time_start: s.time_start,
                    time_end: s.time_end,
                    days: s.days || [],
                })),
            });
        }
        const result = await database_1.default.class.findUnique({
            where: { id: newClass.id },
            include: { schedule: true },
        });
        res.status(201).json({ success: true, data: { ...result, id: result.id } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/classes/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        const { schedule, ...rest } = req.body;
        const updated = await database_1.default.class.update({
            where: { id },
            data: rest,
        });
        if (schedule && Array.isArray(schedule)) {
            await database_1.default.classSchedule.deleteMany({ where: { class_id: id } });
            if (schedule.length > 0) {
                await database_1.default.classSchedule.createMany({
                    data: schedule.map((s) => ({
                        class_id: id,
                        subject: s.subject,
                        teacher_id: s.teacher_id,
                        time_start: s.time_start,
                        time_end: s.time_end,
                        days: s.days || [],
                    })),
                });
            }
        }
        const result = await database_1.default.class.findUnique({
            where: { id },
            include: { schedule: true },
        });
        res.json({ success: true, data: { ...result, id: result.id } });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Class not found' });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/classes/:id/attendance
router.get('/:id/attendance', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const { date } = req.query;
        let attWhere = { class_id: id };
        if (date)
            attWhere.attendance_date = date;
        const [records, enrollments] = await Promise.all([
            database_1.default.attendance.findMany({ where: attWhere }),
            database_1.default.studentClassEnrollment.findMany({
                where: { class_id: id, enrollment_status: 'active' },
                include: { student: true },
            }),
        ]);
        const students = enrollments
            .filter(e => e.student)
            .map(e => {
            const student = e.student;
            const att = date ? records.find(r => r.student_id === student.id) : null;
            return {
                ...student,
                id: student.id,
                attendance_status: att?.status || null,
                attendance_id: att?.id || null,
            };
        });
        res.json({
            success: true,
            data: { students, date, class_id: id },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/classes/:id/attendance
router.post('/:id/attendance', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const { date, records } = req.body;
        if (!records || !Array.isArray(records)) {
            res.status(400).json({ success: false, message: 'Records array required' });
            return;
        }
        const savedRecords = [];
        for (const record of records) {
            const existing = await database_1.default.attendance.findFirst({
                where: {
                    student_id: record.student_id,
                    class_id: id,
                    attendance_date: date,
                },
            });
            if (existing) {
                const updated = await database_1.default.attendance.update({
                    where: { id: existing.id },
                    data: { status: record.status },
                });
                savedRecords.push(updated);
            }
            else {
                const created = await database_1.default.attendance.create({
                    data: {
                        student_id: record.student_id,
                        class_id: id,
                        attendance_date: date,
                        status: record.status,
                        marked_by: req.user.id,
                    },
                });
                savedRecords.push(created);
            }
        }
        res.json({
            success: true,
            data: savedRecords,
            message: `Attendance marked for ${savedRecords.length} students`,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=classes.js.map
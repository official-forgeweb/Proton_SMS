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
const notifyTimetableChange = async (classId, teacherId, date, details, scheduleId) => {
    try {
        // 1. Notify Teacher
        if (teacherId) {
            const teacher = await database_1.default.teacher.findUnique({
                where: { id: teacherId },
                select: { email: true, first_name: true, last_name: true }
            });
            if (teacher && teacher.email) {
                sendMail_1.mailEventEmitter.emit('timetable.updated', {
                    name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
                    email: teacher.email,
                    details,
                    date,
                    scheduleId
                });
            }
        }
        // 2. Notify Enrolled Students
        const enrollments = await database_1.default.studentClassEnrollment.findMany({
            where: { class_id: classId, enrollment_status: 'active' },
            include: { student: true }
        });
        for (const enrollment of enrollments) {
            const student = enrollment.student;
            if (student && student.email) {
                sendMail_1.mailEventEmitter.emit('timetable.updated', {
                    name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
                    email: student.email,
                    details,
                    date,
                    scheduleId
                });
            }
        }
    }
    catch (err) {
        console.error('[Mail Error] Failed to notify timetable change:', err);
    }
};
// GET /api/timetable
// Admins see all, Teachers see their own, Students see their class+subjects
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { date, class_id, teacher_id, start_date, end_date } = req.query;
        let where = {};
        if (date)
            where.date = date;
        if (class_id)
            where.class_id = class_id;
        if (teacher_id)
            where.teacher_id = teacher_id;
        if (start_date && end_date) {
            where.date = { gte: start_date, lte: end_date };
        }
        if (req.user.role === 'student') {
            const student = await database_1.default.student.findUnique({
                where: { user_id: req.user.id },
                select: {
                    class_enrollments: {
                        where: { enrollment_status: 'active' },
                        select: { class_id: true }
                    },
                    subject_enrollments: {
                        where: { status: 'active' },
                        select: { class_id: true, subject: true }
                    }
                }
            });
            if (!student || student.class_enrollments.length === 0) {
                res.json({ success: true, data: [] });
                return;
            }
            const classIds = student.class_enrollments.map(e => e.class_id);
            const subjectEnrolls = student.subject_enrollments;
            const subjectsByClass = {};
            subjectEnrolls.forEach(e => {
                if (!subjectsByClass[e.class_id])
                    subjectsByClass[e.class_id] = [];
                subjectsByClass[e.class_id].push(e.subject);
            });
            const orConditions = classIds.map(cid => {
                const subjects = subjectsByClass[cid];
                if (subjects && subjects.length > 0) {
                    return {
                        class_id: cid,
                        OR: subjects.map(s => ({
                            subject: { contains: s.trim(), mode: 'insensitive' }
                        }))
                    };
                }
                return { class_id: cid };
            });
            if (where.OR) {
                // Unlikely to have OR here already, but just in case
                where.AND = [{ OR: where.OR }, { OR: orConditions }];
                delete where.OR;
            }
            else {
                where.OR = orConditions;
            }
        }
        else if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (teacher) {
                where.teacher_id = teacher.id;
            }
        }
        const timetable = await database_1.default.timetable.findMany({
            where,
            orderBy: [
                { date: 'asc' },
                { start_time: 'asc' }
            ],
            include: {
                class_ref: {
                    select: { class_name: true, class_code: true }
                },
                teacher: {
                    select: { first_name: true, last_name: true }
                }
            }
        });
        // Fetch Tests to include in the schedule
        let testWhere = {};
        if (date)
            testWhere.test_date = date;
        if (start_date && end_date) {
            testWhere.test_date = { gte: start_date, lte: end_date };
        }
        if (req.user.role === 'student') {
            const student = await database_1.default.student.findUnique({
                where: { user_id: req.user.id },
                select: { class_enrollments: { select: { class_id: true } } }
            });
            if (student) {
                const classIds = student.class_enrollments.map(e => e.class_id);
                testWhere.class_id = { in: classIds };
            }
        }
        else if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (teacher) {
                testWhere.OR = [
                    { created_by: teacher.id },
                    { class: { primary_teacher_id: teacher.id } }
                ];
            }
        }
        else if (class_id) {
            testWhere.class_id = class_id;
        }
        const tests = await database_1.default.test.findMany({
            where: testWhere,
            include: { class: { select: { class_name: true, class_code: true } } }
        });
        const mappedTests = tests.map(t => ({
            id: t.id,
            class_id: t.class_id,
            subject: `TEST: ${t.test_name} (${t.subject})`,
            teacher_id: t.created_by,
            date: t.test_date,
            start_time: t.start_time || '00:00',
            end_time: '', // Tests usually have duration instead of end_time
            room: 'Examination Hall',
            notes: t.description,
            status: t.status,
            type: 'test',
            class_ref: t.class,
            teacher: null // Could fetch teacher info if needed
        }));
        const combinedData = [...timetable.map(i => ({ ...i, type: 'class' })), ...mappedTests].sort((a, b) => {
            if (a.date !== b.date)
                return a.date.localeCompare(b.date);
            return a.start_time.localeCompare(b.start_time);
        });
        res.json({ success: true, data: combinedData });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/timetable/generate (Admin only)
router.post('/generate', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const { start_date, end_date, class_id } = req.body;
        if (!start_date || !end_date) {
            res.status(400).json({ success: false, message: 'start_date and end_date are required' });
            return;
        }
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate > endDate) {
            res.status(400).json({ success: false, message: 'Start date must be before or equal to end date' });
            return;
        }
        let classWhere = { status: 'ongoing' };
        if (class_id)
            classWhere.id = class_id;
        const classes = await database_1.default.class.findMany({
            where: classWhere,
            include: { schedule: true }
        });
        const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let createdCount = 0;
        console.log(`Starting generation from ${startDate.toISOString()} to ${endDate.toISOString()} for class_id: ${class_id || 'all'}`);
        for (const c of classes) {
            if (!c.schedule || c.schedule.length === 0) {
                console.log(`Class ${c.class_name} has no schedule template. Skipping.`);
                continue;
            }
            // Use UTC to avoid timezone boundary issues
            const startUTC = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00Z');
            const endUTC = new Date(endDate.toISOString().split('T')[0] + 'T00:00:00Z');
            for (let d = new Date(startUTC); d <= endUTC; d.setUTCDate(d.getUTCDate() + 1)) {
                const dayOfWeek = daysMap[d.getUTCDay()];
                const dateStr = d.toISOString().split('T')[0];
                for (const sched of c.schedule) {
                    // The user explicitly requested to generate timetable for all days including Saturday and Sunday
                    // Check if entry already exists to avoid duplicates
                    const existing = await database_1.default.timetable.findFirst({
                        where: {
                            class_id: c.id,
                            subject: sched.subject || '',
                            date: dateStr,
                            start_time: sched.time_start || '09:00'
                        }
                    });
                    if (!existing) {
                        await database_1.default.timetable.create({
                            data: {
                                class_id: c.id,
                                subject: sched.subject || '',
                                teacher_id: sched.teacher_id,
                                date: dateStr,
                                start_time: sched.time_start || '09:00',
                                end_time: sched.time_end || '10:00',
                                status: 'scheduled'
                            }
                        });
                        createdCount++;
                    }
                }
            }
        }
        res.json({ success: true, message: `Successfully generated ${createdCount} schedule entries.`, count: createdCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error generating timetable' });
    }
});
// POST /api/timetable (Admin or Teacher)
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { class_id, subject, teacher_id, date, start_time, end_time, room, online_link, notes } = req.body;
        let finalTeacherId = teacher_id;
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (!teacher) {
                res.status(403).json({ success: false, message: 'Teacher profile not found' });
                return;
            }
            finalTeacherId = teacher.id;
        }
        const entry = await database_1.default.timetable.create({
            data: {
                class_id,
                subject,
                teacher_id: finalTeacherId,
                date,
                start_time,
                end_time,
                room,
                online_link,
                notes,
                status: 'scheduled'
            },
            include: {
                class_ref: { select: { class_name: true } }
            }
        });
        if (req.user.role === 'teacher' || req.user.role === 'coordinator') {
            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(req.user.id, 'schedule_create', null, JSON.stringify({ subject, date, start_time, room, online_link }), `Class session for ${entry.class_ref.class_name}: ${subject}`, req);
        }
        // Notify affected teacher and students asynchronously
        notifyTimetableChange(class_id, finalTeacherId, date, `New class session scheduled: ${subject} in Room ${room || 'N/A'} at ${start_time} - ${end_time || 'N/A'}.`, entry.id);
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/timetable/:id (Admin or Teacher)
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = req.params.id;
        const { class_id, subject, teacher_id, date, start_time, end_time, room, online_link, notes, status } = req.body;
        const existing = await database_1.default.timetable.findUnique({
            where: { id },
            include: { class_ref: { select: { class_name: true } } }
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (!teacher) {
                res.status(403).json({ success: false, message: 'Teacher profile not found' });
                return;
            }
            if (existing.teacher_id !== teacher.id) {
                res.status(403).json({ success: false, message: 'Not authorized to update this entry' });
                return;
            }
        }
        const entry = await database_1.default.timetable.update({
            where: { id },
            data: {
                class_id,
                subject,
                teacher_id: req.user.role === 'teacher' ? existing.teacher_id : teacher_id,
                date,
                start_time,
                end_time,
                room,
                online_link,
                notes,
                status
            },
            include: {
                class_ref: { select: { class_name: true } }
            }
        });
        if (req.user.role === 'teacher' || req.user.role === 'coordinator') {
            const { logTeacherActivity } = require('../utils/activityLogger');
            const prevVal = {
                subject: existing.subject,
                date: existing.date,
                start_time: existing.start_time,
                room: existing.room,
                online_link: existing.online_link,
                status: existing.status
            };
            const newVal = {
                subject: entry.subject,
                date: entry.date,
                start_time: entry.start_time,
                room: entry.room,
                online_link: entry.online_link,
                status: entry.status
            };
            await logTeacherActivity(req.user.id, 'schedule_update', JSON.stringify(prevVal), JSON.stringify(newVal), `Class session for ${entry.class_ref.class_name}: ${entry.subject}`, req);
        }
        // Notify affected teacher and students asynchronously of schedule adjustment
        const hasChanged = existing.date !== date || existing.start_time !== start_time || existing.room !== room || existing.subject !== subject;
        if (hasChanged) {
            notifyTimetableChange(entry.class_id, entry.teacher_id, entry.date, `Class session adjusted: ${entry.subject} in Room ${entry.room || 'N/A'} at ${entry.start_time} - ${entry.end_time || 'N/A'}.`, entry.id);
        }
        res.json({ success: true, data: entry });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/timetable/:id (Admin or Teacher)
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await database_1.default.timetable.findUnique({
            where: { id },
            include: { class_ref: { select: { class_name: true } } }
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (!teacher) {
                res.status(403).json({ success: false, message: 'Teacher profile not found' });
                return;
            }
            if (existing.teacher_id !== teacher.id) {
                res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
                return;
            }
        }
        await database_1.default.timetable.delete({ where: { id } });
        if (req.user.role === 'teacher' || req.user.role === 'coordinator') {
            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(req.user.id, 'schedule_delete', JSON.stringify({
                subject: existing.subject,
                date: existing.date,
                start_time: existing.start_time,
                room: existing.room,
                online_link: existing.online_link
            }), null, `Class session for ${existing.class_ref.class_name}: ${existing.subject}`, req);
        }
        res.json({ success: true, message: 'Entry deleted' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=timetable.js.map
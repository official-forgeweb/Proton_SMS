"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const notifications_1 = require("./notifications");
const normalization_1 = require("../utils/normalization");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const paramId = (req) => String(req.params.id);
const generateHomeworkCode = () => `HW${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
// GET /api/homework
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { class_id } = req.query;
        let where = {};
        if (class_id && isUUID(class_id))
            where.class_id = class_id;
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (teacher) {
                // 1. Classes where teacher is primary instructor
                const primaryClasses = await database_1.default.class.findMany({
                    where: { primary_teacher_id: teacher.id },
                    select: { id: true },
                });
                const primaryClassIds = primaryClasses.map(c => c.id);
                // 2. Classes where teacher is scheduled
                const schedules = await database_1.default.classSchedule.findMany({
                    where: { teacher_id: teacher.id },
                    select: { class_id: true }
                });
                const scheduleClassIds = schedules.map(s => s.class_id).filter(Boolean);
                const allClassIds = Array.from(new Set([...primaryClassIds, ...scheduleClassIds]));
                const teacherOrConditions = [
                    { class_id: { in: allClassIds } },
                    { created_by: req.user.id }
                ];
                if (where.class_id) {
                    if (!allClassIds.includes(where.class_id) && where.created_by !== req.user.id) {
                        res.json({ success: true, data: [] });
                        return;
                    }
                }
                else {
                    where.OR = teacherOrConditions;
                }
            }
        }
        const homeworks = await database_1.default.homework.findMany({
            where,
            orderBy: { assigned_date: 'desc' },
            include: {
                class: true,
                subject: true,
                creator: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        teacher: { select: { first_name: true, last_name: true } },
                        coordinator: { select: { full_name: true } }
                    }
                }
            },
        });
        if (homeworks.length === 0) {
            res.json({ success: true, data: [] });
            return;
        }
        const hwIds = homeworks.map(h => h.id);
        const classIds = [...new Set(homeworks.map((h) => h.class?.id).filter(Boolean))];
        const [submissionStats, studentCountStats] = await Promise.all([
            database_1.default.homeworkSubmission.groupBy({
                by: ['homework_id'],
                where: { homework_id: { in: hwIds } },
                _count: true,
            }),
            database_1.default.studentClassEnrollment.groupBy({
                by: ['class_id'],
                where: { class_id: { in: classIds }, enrollment_status: 'active' },
                _count: true,
            }),
        ]);
        const allSubmissions = await database_1.default.homeworkSubmission.findMany({
            where: { homework_id: { in: hwIds } },
            select: { homework_id: true, status: true },
        });
        const submissionMap = {};
        allSubmissions.forEach(s => {
            if (!submissionMap[s.homework_id])
                submissionMap[s.homework_id] = { submitted: 0, pending: 0, evaluated: 0 };
            if (s.status === 'pending')
                submissionMap[s.homework_id].pending++;
            else if (s.status === 'evaluated')
                submissionMap[s.homework_id].evaluated++;
            else
                submissionMap[s.homework_id].submitted++;
        });
        const studentCountMap = {};
        studentCountStats.forEach(s => { studentCountMap[s.class_id] = s._count; });
        const data = homeworks.map((h) => {
            const stats = submissionMap[h.id] || { submitted: 0, pending: 0, evaluated: 0 };
            let creatorName = 'System';
            let creatorRole = 'admin';
            if (h.creator) {
                creatorRole = h.creator.role;
                if (h.creator.role === 'teacher' && h.creator.teacher) {
                    creatorName = `${h.creator.teacher.first_name || ''} ${h.creator.teacher.last_name || ''}`.trim();
                }
                else if (h.creator.role === 'coordinator' && h.creator.coordinator) {
                    creatorName = (h.creator.coordinator.full_name || '').trim();
                }
                else {
                    creatorName = 'Admin';
                }
            }
            return {
                ...h,
                id: h.id,
                class_id: h.class?.id || h.class_id,
                class_name: h.class?.class_name || '',
                subject: h.subject?.canonical_name || h.subject_id || '',
                total_students: studentCountMap[h.class?.id || ''] || 0,
                submitted: stats.submitted,
                pending: stats.pending,
                evaluated: stats.evaluated,
                creator_name: creatorName,
                creator_role: creatorRole,
                class: undefined,
                creator: undefined,
            };
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/homework
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const createdBy = req.user.id; // Store User.id universally
        const { subject, subject_id, ...otherFields } = req.body;
        let finalSubjectId = null;
        const subjectQuery = subject_id || subject;
        if (subjectQuery) {
            const subRec = await (0, normalization_1.resolveSubjectRecord)(subjectQuery);
            finalSubjectId = subRec.id;
        }
        const hw = await database_1.default.homework.create({
            data: {
                homework_code: generateHomeworkCode(),
                ...otherFields,
                subject_id: finalSubjectId,
                created_by: createdBy,
            },
        });
        const enrollments = await database_1.default.studentClassEnrollment.findMany({
            where: { class_id: hw.class_id, enrollment_status: 'active' },
            select: { student_id: true },
        });
        if (enrollments.length > 0) {
            await database_1.default.homeworkSubmission.createMany({
                data: enrollments.map(e => ({
                    homework_id: hw.id,
                    student_id: e.student_id,
                    status: 'pending',
                })),
            });
            // Send notifications to all enrolled students
            const studentUserIds = await (0, notifications_1.getStudentUserIdsForClass)(hw.class_id);
            if (studentUserIds.length > 0) {
                await (0, notifications_1.sendNotification)(studentUserIds, req.user.id, 'general', 'New Homework Assigned', `A new homework assignment "${hw.title || 'Untitled'}" has been published. Due date: ${hw.due_date || 'N/A'}.`, hw.id);
            }
        }
        res.status(201).json({ success: true, data: { ...hw, id: hw.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/homework/:id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const hw = await database_1.default.homework.findUnique({
            where: { id },
            include: { subject: true }
        });
        if (!hw) {
            res.status(404).json({ success: false, message: 'Homework not found' });
            return;
        }
        const submissions = await database_1.default.homeworkSubmission.findMany({
            where: { homework_id: hw.id },
            include: { student: true },
        });
        const mappedSubmissions = submissions.map((s) => {
            const student = s.student;
            return {
                ...s,
                id: s.id,
                student_id: student?.id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
                student: undefined,
            };
        });
        res.json({
            success: true,
            data: {
                ...hw,
                id: hw.id,
                subject: hw.subject?.canonical_name || hw.subject_id || '',
                submissions: mappedSubmissions
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/homework/:id/submit
router.post('/:id/submit', auth_1.authenticateToken, (0, auth_1.authorize)('student'), async (req, res) => {
    try {
        const id = paramId(req);
        const student = await database_1.default.student.findUnique({ where: { user_id: req.user.id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const submission = await database_1.default.homeworkSubmission.findFirst({
            where: { homework_id: id, student_id: student.id },
        });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }
        const hw = await database_1.default.homework.findUnique({ where: { id } });
        const isLate = hw && new Date() > new Date(hw.due_date || '');
        const updated = await database_1.default.homeworkSubmission.update({
            where: { id: submission.id },
            data: {
                submission_date: new Date().toISOString(),
                status: isLate ? 'late' : 'submitted',
            },
        });
        res.json({ success: true, data: { ...updated, id: updated.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/homework/:id/evaluate
router.post('/:id/evaluate', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const { student_id, marks_obtained, feedback } = req.body;
        const submission = await database_1.default.homeworkSubmission.findFirst({
            where: { homework_id: id, student_id },
        });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }
        const updated = await database_1.default.homeworkSubmission.update({
            where: { id: submission.id },
            data: { marks_obtained, feedback, status: 'evaluated' },
        });
        // Notify the student about evaluated homework
        const student = await database_1.default.student.findUnique({ where: { id: student_id }, select: { user_id: true } });
        const hwObj = await database_1.default.homework.findUnique({ where: { id }, select: { title: true } });
        if (student && student.user_id) {
            await (0, notifications_1.sendNotification)([student.user_id], req.user.id, 'general', 'Homework Evaluated', `Your homework "${hwObj?.title || 'Untitled'}" has been evaluated. Marks: ${marks_obtained}. Feedback: ${feedback || 'None'}.`, id);
        }
        res.json({ success: true, data: { ...updated, id: updated.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=homework.js.map
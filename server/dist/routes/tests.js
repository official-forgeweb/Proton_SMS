"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const notifications_1 = require("./notifications");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const paramId = (req) => String(req.params.id);
const generateTestCode = () => `TEST${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
// GET /api/tests
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { class_id, status, test_type } = req.query;
        let where = {};
        if (class_id && isUUID(class_id))
            where.class_id = class_id;
        if (status)
            where.status = status;
        if (test_type)
            where.test_type = test_type;
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (teacher) {
                // 1. Classes where teacher is primary instructor
                const primaryClasses = await database_1.default.class.findMany({
                    where: { primary_teacher_id: teacher.id },
                    select: { id: true },
                });
                const primaryClassIds = primaryClasses.map(c => c.id);
                // 2. Class-Subject combinations from schedules
                const schedules = await database_1.default.classSchedule.findMany({
                    where: { teacher_id: teacher.id },
                    select: { class_id: true, subject: true }
                });
                const teacherOrConditions = [];
                if (primaryClassIds.length > 0) {
                    teacherOrConditions.push({ class_id: { in: primaryClassIds } });
                }
                schedules.forEach(sched => {
                    if (sched.class_id && sched.subject) {
                        teacherOrConditions.push({
                            class_id: sched.class_id,
                            subject: { equals: sched.subject, mode: 'insensitive' }
                        });
                    }
                });
                // 3. Fallback: tests personally created by this teacher
                teacherOrConditions.push({ created_by: req.user.id });
                if (where.class_id) {
                    where = {
                        ...where,
                        AND: [
                            { class_id: where.class_id },
                            { OR: teacherOrConditions }
                        ]
                    };
                    delete where.class_id;
                }
                else {
                    where.OR = teacherOrConditions;
                }
            }
        }
        const tests = await database_1.default.test.findMany({
            where,
            orderBy: { test_date: 'desc' },
            include: {
                class: true,
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
        const testIds = tests.map(t => t.id);
        let resultMap = {};
        if (testIds.length > 0) {
            const resultStats = await database_1.default.testResult.groupBy({
                by: ['test_id'],
                where: { test_id: { in: testIds } },
                _count: true,
                _avg: { marks_obtained: true },
            });
            resultStats.forEach(r => {
                resultMap[r.test_id] = { count: r._count, avgMarks: r._avg.marks_obtained || 0 };
            });
        }
        const data = tests.map((t) => {
            const stats = resultMap[t.id] || { count: 0, avgMarks: 0 };
            let creatorName = 'System';
            let creatorRole = 'admin';
            if (t.creator) {
                creatorRole = t.creator.role;
                if (t.creator.role === 'teacher' && t.creator.teacher) {
                    creatorName = `${t.creator.teacher.first_name || ''} ${t.creator.teacher.last_name || ''}`.trim();
                }
                else if (t.creator.role === 'coordinator' && t.creator.coordinator) {
                    creatorName = (t.creator.coordinator.full_name || '').trim();
                }
                else {
                    creatorName = 'Admin';
                }
            }
            return {
                ...t,
                id: t.id,
                class_id: t.class?.id || t.class_id,
                class_name: t.class?.class_name || '',
                results_count: stats.count,
                average_marks: stats.count > 0 ? stats.avgMarks.toFixed(1) : 0,
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
// GET /api/tests/:id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const test = isUUID(id)
            ? await database_1.default.test.findUnique({
                where: { id },
                include: {
                    class: true,
                    creator: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            teacher: { select: { first_name: true, last_name: true } },
                            coordinator: { select: { full_name: true } }
                        }
                    }
                }
            })
            : await database_1.default.test.findFirst({
                where: { test_code: id },
                include: {
                    class: true,
                    creator: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            teacher: { select: { first_name: true, last_name: true } },
                            coordinator: { select: { full_name: true } }
                        }
                    }
                }
            });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test not found' });
            return;
        }
        const results = await database_1.default.testResult.findMany({
            where: { test_id: test.id },
            include: { student: true },
            orderBy: { rank_in_class: 'asc' },
        });
        const mappedResults = results.map((r) => {
            const student = r.student;
            return {
                ...r,
                id: r.id,
                student_id: student?.id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
                student: undefined,
            };
        });
        const stats = {
            total_students: mappedResults.length,
            average: mappedResults.length > 0 ? (mappedResults.reduce((s, r) => s + (r.percentage || 0), 0) / mappedResults.length).toFixed(1) : 0,
            highest: mappedResults.length > 0 ? Math.max(...mappedResults.map((r) => r.marks_obtained || 0)) : 0,
            lowest: mappedResults.length > 0 ? Math.min(...mappedResults.map((r) => r.marks_obtained || 0)) : 0,
            passed: mappedResults.filter((r) => r.pass_fail === 'pass').length,
            failed: mappedResults.filter((r) => r.pass_fail === 'fail').length,
            pass_percentage: mappedResults.length > 0 ? ((mappedResults.filter((r) => r.pass_fail === 'pass').length / mappedResults.length) * 100).toFixed(1) : 0,
        };
        let creatorName = 'System';
        let creatorRole = 'admin';
        if (test.creator) {
            creatorRole = test.creator.role;
            if (test.creator.role === 'teacher' && test.creator.teacher) {
                creatorName = `${test.creator.teacher.first_name || ''} ${test.creator.teacher.last_name || ''}`.trim();
            }
            else if (test.creator.role === 'coordinator' && test.creator.coordinator) {
                creatorName = (test.creator.coordinator.full_name || '').trim();
            }
            else {
                creatorName = 'Admin';
            }
        }
        res.json({
            success: true,
            data: {
                ...test,
                id: test.id,
                class_name: test.class?.class_name,
                results: mappedResults,
                stats,
                creator_name: creatorName,
                creator_role: creatorRole,
                class: undefined,
                creator: undefined
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/tests
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { test_name, class_id, subject, test_type, test_date, start_time, duration_minutes, total_marks, passing_marks, description, images, status } = req.body;
        if (!class_id || !subject) {
            res.status(400).json({ success: false, message: 'Class ID and Subject are required.' });
            return;
        }
        // Validate that a subject teacher is assigned to this class and subject in ClassSchedule
        const mapping = await database_1.default.classSchedule.findFirst({
            where: {
                class_id,
                subject: { equals: subject.trim(), mode: 'insensitive' },
                teacher_id: { not: null }
            }
        });
        if (!mapping) {
            res.status(400).json({
                success: false,
                message: 'No teacher is assigned to this subject for the selected class. Please assign a subject teacher before creating the test.'
            });
            return;
        }
        const createdBy = req.user.id; // Store User.id universally
        const test = await database_1.default.test.create({
            data: {
                test_code: generateTestCode(),
                test_name,
                class_id,
                subject,
                test_type,
                test_date,
                start_time: start_time || '09:00',
                duration_minutes: Number(duration_minutes),
                total_marks: Number(total_marks),
                passing_marks: Number(passing_marks),
                description: description || null,
                images: images || [],
                status: status || 'scheduled',
                results_published: false,
                students_appeared: 0,
                created_by: createdBy,
            },
        });
        // Send notifications to all students in the class
        const studentUserIds = await (0, notifications_1.getStudentUserIdsForClass)(test.class_id);
        if (studentUserIds.length > 0) {
            await (0, notifications_1.sendNotification)(studentUserIds, req.user.id, 'test_scheduled', `New Test Scheduled: ${test.test_name}`, `A new ${test.test_type?.replace('_', ' ') || 'test'} "${test.test_name}" has been scheduled for ${test.test_date || 'TBD'}. Subject: ${test.subject || 'N/A'}. Total Marks: ${test.total_marks || 'N/A'}.`, test.id);
        }
        res.status(201).json({ success: true, data: { ...test, id: test.id } });
    }
    catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/tests/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const existing = await database_1.default.test.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Test not found' });
            return;
        }
        const { description, images, ...restBody } = req.body;
        const test = await database_1.default.test.update({
            where: { id },
            data: {
                ...restBody,
                description: description !== undefined ? description : existing.description,
                images: images !== undefined ? images : existing.images,
            },
        });
        res.json({ success: true, data: { ...test, id: test.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/tests/:id/results
router.post('/:id/results', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const test = await database_1.default.test.findUnique({ where: { id } });
        if (!test) {
            res.status(404).json({ success: false, message: 'Test not found' });
            return;
        }
        const { results } = req.body;
        if (!results || !Array.isArray(results)) {
            res.status(400).json({ success: false, message: 'Results array required' });
            return;
        }
        // Get all students enrolled in this class to handle absentees
        const enrollments = await database_1.default.studentClassEnrollment.findMany({
            where: { class_id: test.class_id, enrollment_status: 'active' },
            select: { student_id: true }
        });
        const allStudentIds = enrollments.map(e => e.student_id);
        const submittedStudentIds = results.map((r) => r.student_id);
        const sortedResults = [...results].sort((a, b) => (b.marks_obtained || 0) - (a.marks_obtained || 0));
        await database_1.default.testResult.deleteMany({ where: { test_id: test.id } });
        const savedResults = [];
        // Save submitted results
        for (let i = 0; i < sortedResults.length; i++) {
            const r = sortedResults[i];
            const marks = r.marks_obtained || 0;
            const percentage = (marks / (test.total_marks || 1)) * 100;
            const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D';
            const newResult = await database_1.default.testResult.create({
                data: {
                    test_id: test.id,
                    student_id: r.student_id,
                    marks_obtained: marks,
                    total_marks: test.total_marks,
                    percentage: parseFloat(percentage.toFixed(1)),
                    grade,
                    pass_fail: percentage >= ((test.passing_marks || 0) / (test.total_marks || 1) * 100) ? 'pass' : 'fail',
                    rank_in_class: i + 1,
                    was_present: r.was_present !== false,
                },
            });
            savedResults.push({ ...newResult, id: newResult.id });
        }
        // Handle missing students (Mark as Absent)
        const missingStudentIds = allStudentIds.filter(id => !submittedStudentIds.includes(id));
        for (const sid of missingStudentIds) {
            const absenteeResult = await database_1.default.testResult.create({
                data: {
                    test_id: test.id,
                    student_id: sid,
                    marks_obtained: 0,
                    total_marks: test.total_marks,
                    percentage: 0,
                    grade: 'F',
                    pass_fail: 'fail',
                    rank_in_class: savedResults.length + 1,
                    was_present: false,
                },
            });
            savedResults.push({ ...absenteeResult, id: absenteeResult.id });
        }
        const presentCount = savedResults.filter((r) => r.was_present !== false).length;
        await database_1.default.test.update({
            where: { id: test.id },
            data: {
                students_appeared: presentCount,
                results_published: true,
                status: 'completed',
            },
        });
        // Send notification to students that marks have been uploaded
        const studentUserIds = await (0, notifications_1.getStudentUserIdsForClass)(test.class_id);
        if (studentUserIds.length > 0) {
            await (0, notifications_1.sendNotification)(studentUserIds, req.user.id, 'marks_uploaded', `Results Published: ${test.test_name}`, `Results for "${test.test_name}" (${test.subject || 'N/A'}) have been published. Check your performance now!`, test.id);
        }
        if (req.user.role === 'teacher' || req.user.role === 'coordinator') {
            const classInfo = await database_1.default.class.findUnique({
                where: { id: test.class_id },
                select: { class_name: true }
            });
            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(req.user.id, 'marks_upload', null, JSON.stringify({
                test_id: test.id,
                test_name: test.test_name,
                subject: test.subject,
                total_students: savedResults.length,
                present_students: presentCount
            }), `Uploaded marks for ${test.test_name} (${test.subject || 'N/A'}) - ${classInfo?.class_name || 'Class'}`, req);
        }
        res.json({ success: true, data: savedResults, message: 'Results saved successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/tests/:id
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        await database_1.default.testResult.deleteMany({ where: { test_id: id } });
        await database_1.default.test.delete({ where: { id } });
        res.json({ success: true, message: 'Test deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=tests.js.map
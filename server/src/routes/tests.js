const express = require('express');
const { Test, TestResult, Class, Student, Teacher } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();
const generateTestCode = () => `TEST${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { class_id, status, test_type } = req.query;
        let query = {};
        if (class_id && mongoose.isValidObjectId(class_id)) query.class_id = class_id;
        if (status) query.status = status;
        if (test_type) query.test_type = test_type;

        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ user_id: req.user.id });
            if (teacher) {
                const myClasses = await Class.find({ $or: [{ primary_teacher_id: teacher._id }, { assistant_teacher_id: teacher._id }] });
                const classIds = myClasses.map(c => c._id);
                if (query.class_id && !classIds.some(id => id.equals(query.class_id))) {
                    return res.json({ success: true, data: [] });
                }
                if (!query.class_id) query.class_id = { $in: classIds };
            }
        }

        const tests = await Test.find(query).sort({ test_date: -1 }).populate('class_id').lean();
        const data = [];

        for (const t of tests) {
            const results = await TestResult.find({ test_id: t._id }).lean();
            data.push({
                ...t,
                id: t._id,
                class_id: t.class_id?._id,
                class_name: t.class_id?.class_name || '',
                results_count: results.length,
                average_marks: results.length > 0 ? (results.reduce((s, r) => s + r.marks_obtained, 0) / results.length).toFixed(1) : 0,
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { test_code: req.params.id };
        const test = await Test.findOne(query).populate('class_id').lean();
        if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

        const results = await TestResult.find({ test_id: test._id }).populate('student_id').sort({ rank_in_class: 1 }).lean();

        const mappedResults = results.map(r => {
            const student = r.student_id;
            return {
                ...r,
                id: r._id,
                student_id: student?._id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
            };
        });

        const stats = {
            total_students: mappedResults.length,
            average: mappedResults.length > 0 ? (mappedResults.reduce((s, r) => s + r.percentage, 0) / mappedResults.length).toFixed(1) : 0,
            highest: mappedResults.length > 0 ? Math.max(...mappedResults.map(r => r.marks_obtained)) : 0,
            lowest: mappedResults.length > 0 ? Math.min(...mappedResults.map(r => r.marks_obtained)) : 0,
            passed: mappedResults.filter(r => r.pass_fail === 'pass').length,
            failed: mappedResults.filter(r => r.pass_fail === 'fail').length,
            pass_percentage: mappedResults.length > 0 ? ((mappedResults.filter(r => r.pass_fail === 'pass').length / mappedResults.length) * 100).toFixed(1) : 0,
        };

        res.json({
            success: true,
            data: { ...test, id: test._id, class_name: test.class_id?.class_name, results: mappedResults, stats },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        let createdBy = req.user.id;
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ user_id: req.user.id });
            if (teacher) createdBy = teacher._id;
        }

        const test = await Test.create({
            test_code: generateTestCode(),
            ...req.body,
            status: req.body.status || 'scheduled',
            results_published: false,
            students_appeared: 0,
            created_by: createdBy,
        });

        res.status(201).json({ success: true, data: { ...test.toObject(), id: test._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/results', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

        const { results } = req.body;
        if (!results || !Array.isArray(results)) {
            return res.status(400).json({ success: false, message: 'Results array required' });
        }

        const sortedResults = [...results].sort((a, b) => b.marks_obtained - a.marks_obtained);
        const savedResults = [];

        await TestResult.deleteMany({ test_id: test._id });

        for (let i = 0; i < sortedResults.length; i++) {
            const r = sortedResults[i];
            const percentage = (r.marks_obtained / test.total_marks) * 100;
            const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D';

            const newResult = await TestResult.create({
                test_id: test._id,
                student_id: r.student_id,
                marks_obtained: r.marks_obtained,
                total_marks: test.total_marks,
                percentage: parseFloat(percentage.toFixed(1)),
                grade,
                pass_fail: percentage >= (test.passing_marks / test.total_marks * 100) ? 'pass' : 'fail',
                rank_in_class: i + 1,
                was_present: r.was_present !== false,
            });

            savedResults.push({ ...newResult.toObject(), id: newResult._id });
        }

        test.students_appeared = savedResults.length;
        test.results_published = true;
        test.status = 'completed';

        if (savedResults.length > 0) {
            test.average_marks = parseFloat((savedResults.reduce((s, r) => s + r.marks_obtained, 0) / savedResults.length).toFixed(1));
            test.highest_marks = Math.max(...savedResults.map(r => r.marks_obtained));
            test.lowest_marks = Math.min(...savedResults.map(r => r.marks_obtained));
        }

        await test.save();

        res.json({ success: true, data: savedResults, message: 'Results saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

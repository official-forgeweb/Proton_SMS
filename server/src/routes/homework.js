const express = require('express');
const { Homework, HomeworkSubmission, Class, StudentClassEnrollment, Student, Teacher } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();
const generateHomeworkCode = () => `HW${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { class_id } = req.query;
        let query = {};
        if (class_id && mongoose.isValidObjectId(class_id)) query.class_id = class_id;

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

        const homeworks = await Homework.find(query).sort({ assigned_date: -1 }).populate('class_id').lean();
        const data = [];

        for (const h of homeworks) {
            const submissions = await HomeworkSubmission.find({ homework_id: h._id }).lean();
            const totalStudents = await StudentClassEnrollment.countDocuments({ class_id: h.class_id?._id, enrollment_status: 'active' });

            data.push({
                ...h,
                id: h._id,
                class_id: h.class_id?._id,
                class_name: h.class_id?.class_name || '',
                total_students: totalStudents,
                submitted: submissions.filter(s => s.status !== 'pending').length,
                pending: submissions.filter(s => s.status === 'pending').length,
                evaluated: submissions.filter(s => s.status === 'evaluated').length,
            });
        }

        res.json({ success: true, data });
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

        const hw = await Homework.create({
            homework_code: generateHomeworkCode(),
            ...req.body,
            created_by: createdBy,
        });

        const enrollments = await StudentClassEnrollment.find({ class_id: hw.class_id, enrollment_status: 'active' }).lean();

        const submissionsBuffer = enrollments.map(e => ({
            homework_id: hw._id,
            student_id: e.student_id,
            status: 'pending',
        }));

        if (submissionsBuffer.length > 0) {
            await HomeworkSubmission.insertMany(submissionsBuffer);
        }

        res.status(201).json({ success: true, data: { ...hw.toObject(), id: hw._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const hw = await Homework.findById(req.params.id).lean();
        if (!hw) return res.status(404).json({ success: false, message: 'Homework not found' });

        const submissions = await HomeworkSubmission.find({ homework_id: hw._id }).populate('student_id').lean();
        const mappedSubmissions = submissions.map(s => {
            const student = s.student_id;
            return {
                ...s,
                id: s._id,
                student_id: student?._id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
            };
        });

        res.json({ success: true, data: { ...hw, id: hw._id, submissions: mappedSubmissions } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/submit', authenticateToken, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user_id: req.user.id });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const submission = await HomeworkSubmission.findOne({ homework_id: req.params.id, student_id: student._id });
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        const hw = await Homework.findById(req.params.id);
        const isLate = hw && new Date() > new Date(hw.due_date);

        submission.submission_date = new Date().toISOString();
        submission.status = isLate ? 'late' : 'submitted';
        await submission.save();

        res.json({ success: true, data: { ...submission.toObject(), id: submission._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/:id/evaluate', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { student_id, marks_obtained, feedback } = req.body;

        const submission = await HomeworkSubmission.findOne({ homework_id: req.params.id, student_id });
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        submission.marks_obtained = marks_obtained;
        submission.feedback = feedback;
        submission.status = 'evaluated';
        await submission.save();

        res.json({ success: true, data: { ...submission.toObject(), id: submission._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

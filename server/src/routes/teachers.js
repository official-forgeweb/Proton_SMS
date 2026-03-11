const express = require('express');
const { Teacher, User, Class, DemoClass, StudentClassEnrollment } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const router = express.Router();
const generateEmployeeId = () => `EMP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

router.get('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { search, subject, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { first_name: new RegExp(search, 'i') },
                { last_name: new RegExp(search, 'i') },
                { employee_id: new RegExp(search, 'i') }
            ];
        }
        if (subject) query.subjects = subject;
        if (status) query.employment_status = status;

        const teachers = await Teacher.find(query).lean();

        for (let i = 0; i < teachers.length; i++) {
            const classCount = await Class.countDocuments({ primary_teacher_id: teachers[i]._id });
            teachers[i] = { ...teachers[i], id: teachers[i]._id, class_count: classCount };
        }

        res.json({ success: true, data: teachers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { employee_id: req.params.id };
        const teacher = await Teacher.findOne(query).lean();

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const classes = await Class.find({ $or: [{ primary_teacher_id: teacher._id }, { assistant_teacher_id: teacher._id }] }).lean();
        const demos = await DemoClass.find({ teacher_id: teacher._id }).lean();

        res.json({
            success: true,
            data: {
                ...teacher, id: teacher._id,
                classes: classes.map(c => ({ ...c, id: c._id })),
                demo_classes: demos.map(d => ({ ...d, id: d._id }))
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { first_name, last_name, email, phone, qualification, specialization, experience_years, date_of_joining, role_type, subjects, gender } = req.body;

        const salt = await bcrypt.genSalt(10);
        const password = req.body.password || `Teacher@${Math.floor(1000 + Math.random() * 9000)}`;

        const user = await User.create({ email, password_hash: await bcrypt.hash(password, salt), role: 'teacher' });

        const teacher = await Teacher.create({
            user_id: user._id, employee_id: generateEmployeeId(), first_name, last_name, email, phone, gender, qualification, specialization, experience_years, date_of_joining, role_type: role_type || 'subject_teacher', subjects: subjects || [], created_by: req.user.id
        });

        res.status(201).json({ success: true, data: { teacher: { ...teacher.toObject(), id: teacher._id }, credentials: { email, password } }, message: `Teacher added: ${teacher.employee_id}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        if (req.body.password && teacher.user_id) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(req.body.password, salt);
            await User.findByIdAndUpdate(teacher.user_id, { password_hash });
        }

        res.json({ success: true, data: { ...teacher, id: teacher._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/classes', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId
            ? { $or: [{ _id: req.params.id }, { user_id: req.params.id }] }
            : { employee_id: req.params.id };
        const teacher = await Teacher.findOne(query);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const classes = await Class.find({ $or: [{ primary_teacher_id: teacher._id }, { assistant_teacher_id: teacher._id }] }).lean();

        for (let i = 0; i < classes.length; i++) {
            classes[i].student_count = await StudentClassEnrollment.countDocuments({ class_id: classes[i]._id, enrollment_status: 'active' });
            classes[i].id = classes[i]._id;
        }

        res.json({ success: true, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

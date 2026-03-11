const express = require('express');
const { Class, Teacher, StudentClassEnrollment, Student, Attendance } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const generateId = () => crypto.randomUUID();
const generateClassCode = () => `CLS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// GET /api/classes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { subject, grade_level, status, batch_type, academic_year } = req.query;
        let query = {};

        if (subject) query.subject = subject;
        if (grade_level) query.grade_level = grade_level;
        if (status) query.status = status;
        if (batch_type) query.batch_type = batch_type;
        if (academic_year) query.academic_year = academic_year;

        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ user_id: req.user.id });
            if (teacher) {
                query.$or = [{ primary_teacher_id: teacher._id }, { assistant_teacher_id: teacher._id }];
            }
        }

        const classes = await Class.find(query).populate('primary_teacher_id').lean();

        const data = classes.map(c => ({
            ...c,
            teacher_name: c.primary_teacher_id ? `${c.primary_teacher_id.first_name || ''} ${c.primary_teacher_id.last_name || ''}`.trim() : null,
            primary_teacher_id: c.primary_teacher_id?._id || c.primary_teacher_id,
            id: c._id
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/classes/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id)
            .populate('primary_teacher_id')
            .lean();

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const enrollments = await StudentClassEnrollment.find({ class_id: cls._id, enrollment_status: 'active' })
            .populate('student_id')
            .lean();

        const students = enrollments.map(e => {
            if (!e.student_id) return null;
            return {
                ...e.student_id,
                id: e.student_id._id,
                enrollment: { ...e, student_id: e.student_id._id }
            };
        }).filter(Boolean);

        const teacher = cls.primary_teacher_id;
        res.json({
            success: true,
            data: {
                ...cls,
                id: cls._id,
                teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher._id } : null,
                primary_teacher_id: teacher?._id,
                students,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/classes
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const classData = {
            class_code: generateClassCode(),
            ...req.body,
            current_students_count: 0,
            status: req.body.status || 'upcoming',
        };

        const newClass = await Class.create(classData);
        res.status(201).json({ success: true, data: { ...newClass.toObject(), id: newClass._id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/classes/:id
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!updated) return res.status(404).json({ success: false, message: 'Class not found' });

        res.json({ success: true, data: { ...updated, id: updated._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/classes/:id/attendance
router.get('/:id/attendance', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        let attQuery = { class_id: req.params.id };
        if (date) attQuery.attendance_date = date;

        const records = await Attendance.find(attQuery).lean();
        const enrollments = await StudentClassEnrollment.find({ class_id: req.params.id, enrollment_status: 'active' }).populate('student_id').lean();

        const students = enrollments.map(e => {
            const student = e.student_id;
            if (!student) return null;
            const att = date ? records.find(r => r.student_id.toString() === student._id.toString()) : null;
            return {
                ...student,
                id: student._id,
                attendance_status: att?.status || null,
                attendance_id: att?._id || null,
            };
        }).filter(Boolean);

        res.json({
            success: true,
            data: { students, date, class_id: req.params.id },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/classes/:id/attendance
router.post('/:id/attendance', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { date, records } = req.body;
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Records array required' });
        }

        const savedRecords = [];
        for (const record of records) {
            let att = await Attendance.findOne({
                student_id: record.student_id,
                class_id: req.params.id,
                attendance_date: date
            });

            if (att) {
                att.status = record.status;
                if (record.remarks) att.remarks = record.remarks;
                await att.save();
                savedRecords.push(att);
            } else {
                att = await Attendance.create({
                    student_id: record.student_id,
                    class_id: req.params.id,
                    attendance_date: date,
                    status: record.status,
                    marked_by: req.user.id
                });
                savedRecords.push(att);
            }
        }

        res.json({
            success: true,
            data: savedRecords,
            message: `Attendance marked for ${savedRecords.length} students`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

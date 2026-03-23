const express = require('express');
const { Student, User, Parent, ParentStudentMapping, StudentClassEnrollment, Class, StudentFeeAssignment, FeePayment, TestResult, Test, Attendance, FeeStructure, Teacher, HomeworkSubmission, Homework } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const router = express.Router();

const generateProId = () => `PRO${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

router.get('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { search, status, class_id, fee_status, page = 1, limit = 50 } = req.query;
        let query = {};

        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ user_id: req.user.id });
            if (teacher) {
                const myClasses = await Class.find({ $or: [{ primary_teacher_id: teacher._id }, { assistant_teacher_id: teacher._id }] });
                const classIds = myClasses.map(c => c._id);
                // If a specific class_id is requested, check if the teacher has access to it
                if (class_id && mongoose.isValidObjectId(class_id)) {
                    if (!classIds.some(id => id.equals(class_id))) {
                        return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit, pages: 0 } });
                    }
                } else {
                    // Otherwise, filter students to only those in the teacher's classes
                    const enrollments = await StudentClassEnrollment.find({ class_id: { $in: classIds } }).lean();
                    const studentIds = enrollments.map(e => e.student_id);
                    query._id = { $in: studentIds };
                }
            }
        }

        if (search) {
            query.$or = [
                { first_name: new RegExp(search, 'i') },
                { last_name: new RegExp(search, 'i') },
                { PRO_ID: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }
        if (status) query.academic_status = status;

        if (class_id) {
            const enrollments = await StudentClassEnrollment.find({ class_id, enrollment_status: 'active' }).lean();
            const studentIds = enrollments.map(e => e.student_id);
            query._id = { $in: studentIds };
        }

        const total = await Student.countDocuments(query);
        const startIdx = (page - 1) * limit;

        let students = await Student.find(query).skip(startIdx).limit(parseInt(limit)).lean();

        if (students.length > 0) {
            const studentIds = students.map(s => s._id);

            // Batch queries instead of N+1 loop
            const [feeAssignments, enrollments] = await Promise.all([
                StudentFeeAssignment.find({ student_id: { $in: studentIds } }).lean(),
                StudentClassEnrollment.find({ student_id: { $in: studentIds }, enrollment_status: 'active' }).populate('class_id').lean(),
            ]);

            // Build lookup maps
            const feeMap = {};
            feeAssignments.forEach(f => { feeMap[f.student_id.toString()] = f; });

            const enrollmentMap = {};
            enrollments.forEach(e => {
                const sid = e.student_id.toString();
                if (!enrollmentMap[sid]) enrollmentMap[sid] = [];
                enrollmentMap[sid].push(e);
            });

            students = students.map(s => {
                const sid = s._id.toString();
                const feeAssignment = feeMap[sid];
                const studentEnrollments = enrollmentMap[sid] || [];
                return {
                    ...s,
                    id: s._id,
                    fee_status: feeAssignment?.payment_status || 'pending',
                    total_fee: feeAssignment?.final_fee || 0,
                    total_paid: feeAssignment?.total_paid || 0,
                    classes: studentEnrollments.map(e => ({
                        id: e.class_id?._id, name: e.class_id?.class_name, code: e.class_id?.class_code
                    })),
                    attendance_percentage: studentEnrollments[0]?.overall_attendance_percentage || 0,
                };
            });
        }

        if (fee_status) students = students.filter(s => s.fee_status === fee_status);

        res.json({ success: true, data: students, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/stats', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        // Run independent queries in parallel
        const [total, active, maleCount, femaleCount, feeAgg, revenueAgg] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ academic_status: 'active' }),
            Student.countDocuments({ gender: 'male' }),
            Student.countDocuments({ gender: 'female' }),
            // Use aggregation instead of fetching all documents
            StudentFeeAssignment.aggregate([
                { $group: {
                    _id: null,
                    fully_paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, 1, 0] } },
                    partial: { $sum: { $cond: [{ $eq: ['$payment_status', 'partial'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$payment_status', 'pending'] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $eq: ['$payment_status', 'overdue'] }, 1, 0] } },
                    totalPaid: { $sum: '$total_paid' },
                    totalPending: { $sum: '$total_pending' },
                } }
            ]),
            // This is a no-op placeholder to keep array alignment clean
            Promise.resolve(null),
        ]);

        const inactive = total - active;
        const feeData = feeAgg[0] || { fully_paid: 0, partial: 0, pending: 0, overdue: 0, totalPaid: 0, totalPending: 0 };

        res.json({ success: true, data: { total, active, inactive, gender: { male: maleCount, female: femaleCount }, fee: { fully_paid: feeData.fully_paid, partial: feeData.partial, pending: feeData.pending, overdue: feeData.overdue }, revenue: { total: feeData.totalPaid, pending: feeData.totalPending } } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id };
        const student = await Student.findOne(query).lean();

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // Run all independent queries in parallel
        const [enrollments, feeAssignment, payments, parentMapping, recentTests] = await Promise.all([
            StudentClassEnrollment.find({ student_id: student._id }).populate('class_id').lean(),
            StudentFeeAssignment.findOne({ student_id: student._id }).lean(),
            FeePayment.find({ student_id: student._id }).lean(),
            ParentStudentMapping.findOne({ student_id: student._id }).populate('parent_id').lean(),
            TestResult.find({ student_id: student._id }).sort({ created_at: -1 }).limit(5).populate('test_id').lean(),
        ]);

        res.json({
            success: true,
            data: {
                ...student, id: student._id,
                classes: enrollments.map(e => ({ ...e.class_id, enrollment: { ...e, class_id: e.class_id._id } })),
                fee: feeAssignment, payments,
                parent: parentMapping?.parent_id,
                recent_tests: recentTests.map(tr => ({ ...tr, test: tr.test_id })),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { first_name, last_name, date_of_birth, gender, email, phone, school_name, class_id, admission_type, enquiry_id, parent_name, parent_phone, parent_email, parent_relationship } = req.body;

        const salt = await bcrypt.genSalt(10);
        let password = `Proton@${Math.floor(1000 + Math.random() * 9000)}`;

        if (date_of_birth) {
            // date_of_birth typically comes as YYYY-MM-DD
            const parts = date_of_birth.split('-');
            if (parts.length === 3) {
                const year = parts[0].substring(2, 4);
                const month = parts[1];
                const day = parts[2];
                password = `${day}${month}${year}`;
            }
        }

        const fName = (first_name || 'student').toLowerCase();
        const lName = (last_name || '').toLowerCase();
        const user = await User.create({ email: email || `${fName}.${lName}.${Math.floor(Math.random() * 10000)}@proton.com`, password_hash: await bcrypt.hash(password, salt), role: 'student' });

        const proId = generateProId();
        const student = await Student.create({ user_id: user._id, PRO_ID: proId, first_name, last_name, date_of_birth, gender, email, phone, school_name, enrollment_date: new Date().toISOString(), enrollment_number: `ENR${proId}`, admission_type: admission_type || 'fresh', enquiry_id, created_by: req.user.id });

        if (parent_name && parent_phone) {
            const pLName = (last_name || '').toLowerCase();
            const parentUser = await User.create({ email: parent_email || `parent.${pLName}.${Math.floor(Math.random() * 10000)}@proton.com`, password_hash: await bcrypt.hash(`Parent@${Math.floor(1000 + Math.random() * 9000)}`, salt), role: 'parent' });
            const parent = await Parent.create({ user_id: parentUser._id, first_name: parent_name, last_name, email: parent_email, phone: parent_phone });
            await ParentStudentMapping.create({ parent_id: parent._id, student_id: student._id, relationship: parent_relationship || 'father' });
        }

        if (class_id) {
            await StudentClassEnrollment.create({ student_id: student._id, class_id, enrollment_date: new Date().toISOString() });
            await Class.findByIdAndUpdate(class_id, { $inc: { current_students_count: 1 } });
        }

        res.status(201).json({ success: true, data: { student: { ...student.toObject(), id: student._id }, credentials: { email: student.email, password, pro_id: proId } } });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ success: false, message: `An account with this ${field} (${error.keyValue[field]}) already exists. Please use a different one.` });
        }
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        res.json({ success: true, data: { ...student, id: student._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/students/:id/enroll
router.post('/:id/enroll', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { class_id } = req.body;
        if (!class_id) return res.status(400).json({ success: false, message: 'Class ID is required' });

        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const existing = await StudentClassEnrollment.findOne({ student_id: student._id, class_id });
        if (existing) return res.status(400).json({ success: false, message: 'Student already enrolled in this class' });

        const enrollment = await StudentClassEnrollment.create({
            student_id: student._id,
            class_id,
            enrollment_date: new Date().toISOString(),
            enrollment_status: 'active'
        });

        await Class.findByIdAndUpdate(class_id, { $inc: { current_students_count: 1 } });

        res.json({ success: true, message: 'Student enrolled successfully', data: enrollment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/attendance', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id };
        const student = await Student.findOne(query).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const { month, year } = req.query;
        let attQuery = { student_id: student._id };
        if (month && year) {
            attQuery.attendance_date = new RegExp(`^${year}-${String(month).padStart(2, '0')}`);
        }

        const records = await Attendance.find(attQuery).sort({ attendance_date: -1 }).lean();
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;

        res.json({ success: true, data: { records, summary: { total, present, absent: total - present - late, late, percentage: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0 } } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/tests', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id };
        const student = await Student.findOne(query).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const results = await TestResult.find({ student_id: student._id }).populate('test_id').lean();

        const validResults = results.map(tr => ({ ...tr, test: tr.test_id }));
        const avgPercentage = validResults.length > 0 ? (validResults.reduce((sum, r) => sum + r.percentage, 0) / validResults.length).toFixed(1) : 0;

        res.json({ success: true, data: { results: validResults, summary: { total_tests: validResults.length, average_percentage: parseFloat(avgPercentage), passed: validResults.filter(r => r.pass_fail === 'pass').length, failed: validResults.filter(r => r.pass_fail === 'fail').length } } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/fees', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id };
        const student = await Student.findOne(query).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const assignment = await StudentFeeAssignment.findOne({ student_id: student._id }).lean();
        const payments = await FeePayment.find({ student_id: student._id }).lean();
        const structure = assignment ? await FeeStructure.findById(assignment.fee_structure_id).lean() : null;

        res.json({ success: true, data: { assignment, payments, structure } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/homework-history', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = (req.params.id === 'me' && req.user.role === 'student')
            ? { user_id: req.user.id }
            : (isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id });

        const student = await Student.findOne(query).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const submissions = await HomeworkSubmission.find({
            student_id: student._id,
            status: { $in: ['submitted', 'late', 'evaluated'] }
        }).populate('homework_id').sort({ submission_date: -1 }).lean();

        res.json({ success: true, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/:id/performance', authenticateToken, async (req, res) => {
    try {
        const isMongoId = mongoose.isValidObjectId(req.params.id);
        const query = (req.params.id === 'me' && req.user.role === 'student')
            ? { user_id: req.user.id }
            : (isMongoId ? { _id: req.params.id } : { PRO_ID: req.params.id });

        const student = await Student.findOne(query).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const results = await TestResult.find({ student_id: student._id }).populate('test_id').lean();

        // Subject-wise performance
        const subjectPerformance = {};
        results.forEach(r => {
            const subject = r.test_id?.subject || 'General';
            if (!subjectPerformance[subject]) {
                subjectPerformance[subject] = { total: 0, count: 0 };
            }
            subjectPerformance[subject].total += r.percentage;
            subjectPerformance[subject].count += 1;
        });

        const subjectAnalytics = Object.keys(subjectPerformance).map(s => ({
            subject: s,
            average: parseFloat((subjectPerformance[s].total / subjectPerformance[s].count).toFixed(1))
        }));

        // Performance trend
        const trend = results
            .filter(r => r.test_id)
            .sort((a, b) => new Date(a.test_id.test_date) - new Date(b.test_id.test_date))
            .map(r => ({
                date: r.test_id.test_date,
                score: r.percentage,
                name: r.test_id.test_name
            }));

        res.json({ success: true, data: { subjectAnalytics, trend } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

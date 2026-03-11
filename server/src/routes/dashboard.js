const express = require('express');
const { Student, Teacher, Class, Enquiry, DemoClass, FeePayment, StudentFeeAssignment, Attendance, TestResult, Test, HomeworkSubmission, Homework, Parent, ParentStudentMapping, StudentClassEnrollment } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ academic_status: 'active' });
        const totalTeachers = await Teacher.countDocuments();
        const activeTeachers = await Teacher.countDocuments({ employment_status: 'active' });
        const totalClasses = await Class.countDocuments();
        const activeClasses = await Class.countDocuments({ status: 'ongoing' });
        const totalEnquiries = await Enquiry.countDocuments();
        const newEnquiries = await Enquiry.countDocuments({ status: 'new' });
        const totalDemos = await DemoClass.countDocuments();
        const completedDemos = await DemoClass.countDocuments({ status: 'completed' });

        const completedPayments = await FeePayment.find({ payment_status: 'completed' }).lean();
        const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount_paid, 0);

        const feeAssignments = await StudentFeeAssignment.find().lean();
        const totalPending = feeAssignments.reduce((sum, f) => sum + (f.total_pending || 0), 0);

        const contacted = await Enquiry.countDocuments({ status: { $in: ['contacted', 'demo_scheduled', 'demo_completed', 'enrolled'] } });
        const demoScheduled = await Enquiry.countDocuments({ status: { $in: ['demo_scheduled', 'demo_completed', 'enrolled'] } });
        const demoCompleted = await Enquiry.countDocuments({ status: { $in: ['demo_completed', 'enrolled'] } });
        const enrolled = await Enquiry.countDocuments({ converted_to_student: true });

        const recentStudents = await Student.find().sort({ created_at: -1 }).limit(5).lean();
        const recentPayments = await FeePayment.find().sort({ created_at: -1 }).limit(5).populate('student_id').lean();
        const recentEnquiries = await Enquiry.find().sort({ created_at: -1 }).limit(5).lean();

        const recentActivity = [
            ...recentStudents.map(s => ({ type: 'enrollment', message: `New enrollment: ${s.first_name} ${s.last_name} (${s.PRO_ID})`, time: s.created_at })),
            ...recentPayments.map(p => ({ type: 'payment', message: `Payment received: ₹${p.amount_paid.toLocaleString()} from ${p.student_id?.first_name || 'Unknown'}`, time: p.payment_date })),
            ...recentEnquiries.map(e => ({ type: 'enquiry', message: `New enquiry: ${e.student_name} - ${e.interested_course}`, time: e.created_at })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        res.json({
            success: true,
            data: {
                stats: { students: { total: totalStudents, active: activeStudents }, teachers: { total: totalTeachers, active: activeTeachers }, classes: { total: totalClasses, active: activeClasses }, enquiries: { total: totalEnquiries, new: newEnquiries }, demos: { total: totalDemos, completed: completedDemos }, revenue: { total: totalRevenue, pending: totalPending } },
                funnel: { enquiries: totalEnquiries, contacted, demo_scheduled: demoScheduled, demo_completed: demoCompleted, enrolled, conversion_rate: totalEnquiries > 0 ? ((enrolled / totalEnquiries) * 100).toFixed(1) : 0 },
                recent_activity: recentActivity,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/teacher', authenticateToken, authorize('teacher'), async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ user_id: req.user.id }).lean();
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const myClasses = await Class.find({ primary_teacher_id: teacher._id }).lean();
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

        const todaysClasses = myClasses.filter(c => c.class_days?.includes(dayOfWeek));

        const classIds = myClasses.map(c => c._id);
        const todaysAttendance = await Attendance.find({ attendance_date: today, class_id: { $in: classIds } }).lean();

        let totalStudents = 0;
        for (let i = 0; i < myClasses.length; i++) {
            totalStudents += await StudentClassEnrollment.countDocuments({ class_id: myClasses[i]._id, enrollment_status: 'active' });
        }

        const pendingEvaluations = await TestResult.countDocuments({ evaluated_at: null }); // Adjust based on schema if needed

        const myEnquiries = await Enquiry.find({ assigned_to: req.user.id }).limit(5).lean();
        const pendingDemos = await DemoClass.find({ teacher_id: teacher._id, status: 'scheduled' }).limit(5).lean();

        const todayClassesData = [];
        for (let c of todaysClasses) {
            todayClassesData.push({
                ...c,
                id: c._id,
                attendance_marked: todaysAttendance.some(a => a.class_id.toString() === c._id.toString()),
                student_count: await StudentClassEnrollment.countDocuments({ class_id: c._id, enrollment_status: 'active' }),
            });
        }

        const myClassesData = [];
        for (let c of myClasses) {
            myClassesData.push({
                ...c,
                id: c._id,
                student_count: await StudentClassEnrollment.countDocuments({ class_id: c._id, enrollment_status: 'active' }),
            });
        }

        res.json({
            success: true,
            data: {
                teacher_name: `${teacher.first_name} ${teacher.last_name}`,
                today: {
                    classes: todayClassesData,
                    attendance_summary: { present: todaysAttendance.filter(a => a.status === 'present').length, absent: todaysAttendance.filter(a => a.status === 'absent').length, total: todaysAttendance.length }
                },
                classes: myClassesData,
                stats: { total_classes: myClasses.length, total_students: totalStudents, pending_evaluations: pendingEvaluations, assigned_enquiries: await Enquiry.countDocuments({ assigned_to: req.user.id }), pending_demos: await DemoClass.countDocuments({ teacher_id: teacher._id, status: 'scheduled' }) },
                enquiries: myEnquiries.map(e => ({ ...e, id: e._id })),
                upcoming_demos: pendingDemos.map(d => ({ ...d, id: d._id })),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/student', authenticateToken, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user_id: req.user.id }).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

        const enrollments = await StudentClassEnrollment.find({ student_id: student._id, enrollment_status: 'active' }).populate('class_id').lean();
        const classes = enrollments.map(e => e.class_id);

        const attendance = await Attendance.find({ student_id: student._id }).lean();
        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        const recentTests = await TestResult.find({ student_id: student._id }).sort({ created_at: -1 }).limit(3).populate('test_id').lean();

        const pendingHomework = await HomeworkSubmission.find({ student_id: student._id, status: 'pending' }).populate('homework_id').lean();

        const feeAssignment = await StudentFeeAssignment.findOne({ student_id: student._id }).lean();

        res.json({
            success: true,
            data: {
                student: { ...student, id: student._id },
                classes: classes.map(c => ({ ...c, id: c._id })),
                attendance: { percentage: parseFloat(attendancePercentage), total: totalClasses, present: presentCount, absent: totalClasses - presentCount },
                recent_tests: recentTests.map(tr => ({ ...tr, test_name: tr.test_id?.test_name, test_date: tr.test_id?.test_date })),
                pending_homework: pendingHomework.map(s => ({ ...s, homework: s.homework_id })),
                fee: feeAssignment ? { total: feeAssignment.final_fee, paid: feeAssignment.total_paid, pending: feeAssignment.total_pending, status: feeAssignment.payment_status } : null,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/parent', authenticateToken, authorize('parent'), async (req, res) => {
    try {
        const parent = await Parent.findOne({ user_id: req.user.id }).lean();
        if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

        const mappings = await ParentStudentMapping.find({ parent_id: parent._id }).populate('student_id').lean();
        const children = [];

        for (const m of mappings) {
            const student = m.student_id;
            if (!student) continue;

            const enrollment = await StudentClassEnrollment.findOne({ student_id: student._id, enrollment_status: 'active' }).populate('class_id').lean();
            const attendance = await Attendance.find({ student_id: student._id }).lean();
            const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
            const attendancePercent = attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0;

            const recentTest = await TestResult.findOne({ student_id: student._id }).sort({ created_at: -1 }).populate('test_id').lean();
            const feeAssignment = await StudentFeeAssignment.findOne({ student_id: student._id }).lean();

            children.push({
                ...student,
                id: student._id,
                relationship: m.relationship,
                class_name: enrollment?.class_id?.class_name,
                attendance_percentage: parseFloat(attendancePercent),
                last_test: recentTest ? { ...recentTest, test_name: recentTest.test_id?.test_name } : null,
                fee: feeAssignment ? { total: feeAssignment.final_fee, paid: feeAssignment.total_paid, pending: feeAssignment.total_pending, status: feeAssignment.payment_status } : null,
            });
        }

        res.json({ success: true, data: { parent: { ...parent, id: parent._id }, children } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

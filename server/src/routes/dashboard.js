const express = require('express');
const { Student, Teacher, Class, Enquiry, DemoClass, FeePayment, StudentFeeAssignment, Attendance, TestResult, Test, HomeworkSubmission, Homework, Parent, ParentStudentMapping, StudentClassEnrollment } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

router.get('/admin', authenticateToken, authorize('admin'), cacheMiddleware(30), async (req, res) => {
    try {
        // Run ALL independent count queries in parallel instead of sequentially
        const [
            totalStudents, activeStudents,
            totalTeachers, activeTeachers,
            totalClasses, activeClasses,
            totalEnquiries, newEnquiries,
            totalDemos, completedDemos,
            contacted, demoScheduled, demoCompleted, enrolled,
            revenueAgg, pendingAgg,
            recentStudents, recentPayments, recentEnquiries,
        ] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ academic_status: 'active' }),
            Teacher.countDocuments(),
            Teacher.countDocuments({ employment_status: 'active' }),
            Class.countDocuments(),
            Class.countDocuments({ status: 'ongoing' }),
            Enquiry.countDocuments(),
            Enquiry.countDocuments({ status: 'new' }),
            DemoClass.countDocuments(),
            DemoClass.countDocuments({ status: 'completed' }),
            Enquiry.countDocuments({ status: { $in: ['contacted', 'demo_scheduled', 'demo_completed', 'enrolled'] } }),
            Enquiry.countDocuments({ status: { $in: ['demo_scheduled', 'demo_completed', 'enrolled'] } }),
            Enquiry.countDocuments({ status: { $in: ['demo_completed', 'enrolled'] } }),
            Enquiry.countDocuments({ converted_to_student: true }),
            // Use aggregation instead of fetching all documents
            FeePayment.aggregate([
                { $match: { payment_status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount_paid' } } }
            ]),
            StudentFeeAssignment.aggregate([
                { $group: { _id: null, total: { $sum: '$total_pending' } } }
            ]),
            Student.find().sort({ created_at: -1 }).limit(5).lean(),
            FeePayment.find().sort({ created_at: -1 }).limit(5).populate('student_id').lean(),
            Enquiry.find().sort({ created_at: -1 }).limit(5).lean(),
        ]);

        const totalRevenue = revenueAgg[0]?.total || 0;
        const totalPending = pendingAgg[0]?.total || 0;

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
        console.error('Dashboard admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/teacher', authenticateToken, authorize('teacher'), cacheMiddleware(15), async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ user_id: req.user.id }).lean();
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const myClasses = await Class.find({ primary_teacher_id: teacher._id }).lean();
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

        const todaysClasses = myClasses.filter(c => c.class_days?.includes(dayOfWeek));
        const classIds = myClasses.map(c => c._id);

        // Batch all independent queries in parallel
        const [todaysAttendance, studentCountsAgg, pendingEvaluations, myEnquiries, pendingDemos, assignedEnquiriesCount, pendingDemosCount] = await Promise.all([
            Attendance.find({ attendance_date: today, class_id: { $in: classIds } }).lean(),
            // Single aggregation instead of N separate countDocuments calls
            StudentClassEnrollment.aggregate([
                { $match: { class_id: { $in: classIds }, enrollment_status: 'active' } },
                { $group: { _id: '$class_id', count: { $sum: 1 } } }
            ]),
            TestResult.countDocuments({ evaluated_at: null }),
            Enquiry.find({ assigned_to: req.user.id }).limit(5).lean(),
            DemoClass.find({ teacher_id: teacher._id, status: 'scheduled' }).limit(5).lean(),
            Enquiry.countDocuments({ assigned_to: req.user.id }),
            DemoClass.countDocuments({ teacher_id: teacher._id, status: 'scheduled' }),
        ]);

        // Build a lookup map from the aggregation result
        const studentCountMap = {};
        studentCountsAgg.forEach(r => { studentCountMap[r._id.toString()] = r.count; });

        const totalStudents = Object.values(studentCountMap).reduce((sum, c) => sum + c, 0);

        const todayClassesData = todaysClasses.map(c => ({
            ...c,
            id: c._id,
            attendance_marked: todaysAttendance.some(a => a.class_id.toString() === c._id.toString()),
            student_count: studentCountMap[c._id.toString()] || 0,
        }));

        const myClassesData = myClasses.map(c => ({
            ...c,
            id: c._id,
            student_count: studentCountMap[c._id.toString()] || 0,
        }));

        res.json({
            success: true,
            data: {
                teacher_name: `${teacher.first_name} ${teacher.last_name}`,
                today: {
                    classes: todayClassesData,
                    attendance_summary: { present: todaysAttendance.filter(a => a.status === 'present').length, absent: todaysAttendance.filter(a => a.status === 'absent').length, total: todaysAttendance.length }
                },
                classes: myClassesData,
                stats: { total_classes: myClasses.length, total_students: totalStudents, pending_evaluations: pendingEvaluations, assigned_enquiries: assignedEnquiriesCount, pending_demos: pendingDemosCount },
                enquiries: myEnquiries.map(e => ({ ...e, id: e._id })),
                upcoming_demos: pendingDemos.map(d => ({ ...d, id: d._id })),
            },
        });
    } catch (error) {
        console.error('Dashboard teacher error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/student', authenticateToken, authorize('student'), cacheMiddleware(15), async (req, res) => {
    try {
        const student = await Student.findOne({ user_id: req.user.id }).lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

        // Run ALL independent queries in parallel
        const [enrollments, attendance, recentTests, pendingHomework, feeAssignment] = await Promise.all([
            StudentClassEnrollment.find({ student_id: student._id, enrollment_status: 'active' }).populate('class_id').lean(),
            Attendance.find({ student_id: student._id }).lean(),
            TestResult.find({ student_id: student._id }).sort({ created_at: -1 }).limit(3).populate('test_id').lean(),
            HomeworkSubmission.find({ student_id: student._id, status: 'pending' }).populate('homework_id').lean(),
            StudentFeeAssignment.findOne({ student_id: student._id }).lean(),
        ]);

        const classes = enrollments.map(e => e.class_id);

        const totalClasses = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        // Fetch all tests for enrolled classes
        const classIds = enrollments.map(e => e.class_id._id);
        const allTests = await Test.find({ class_id: { $in: classIds } }).sort({ test_date: -1 }).lean();

        const now = new Date();
        const completedTests = allTests.filter(t => t.status === 'completed' || t.results_published || new Date(t.test_date) < now);
        const upcomingTests = allTests.filter(t => t.status === 'scheduled' && new Date(t.test_date) > now);
        const ongoingTests = allTests.filter(t => t.status === 'ongoing' || (new Date(t.test_date).toDateString() === now.toDateString() && t.status !== 'completed'));

        res.json({
            success: true,
            data: {
                student: { ...student, id: student._id },
                classes: classes.map(c => ({ ...c, id: c._id })),
                attendance: { percentage: parseFloat(attendancePercentage), total: totalClasses, present: presentCount, absent: totalClasses - presentCount },
                recent_tests: recentTests.map(tr => ({ ...tr, test_name: tr.test_id?.test_name, test_date: tr.test_id?.test_date })),
                tests: {
                    upcoming: upcomingTests,
                    ongoing: ongoingTests,
                    completed: completedTests
                },
                pending_homework: pendingHomework.map(s => ({ ...s, homework: s.homework_id })),
                fee: feeAssignment ? { total: feeAssignment.final_fee, paid: feeAssignment.total_paid, pending: feeAssignment.total_pending, status: feeAssignment.payment_status } : null,
            },
        });
    } catch (error) {
        console.error('Dashboard student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/parent', authenticateToken, authorize('parent'), cacheMiddleware(15), async (req, res) => {
    try {
        const parent = await Parent.findOne({ user_id: req.user.id }).lean();
        if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

        const mappings = await ParentStudentMapping.find({ parent_id: parent._id }).populate('student_id').lean();
        const studentIds = mappings.map(m => m.student_id?._id).filter(Boolean);

        if (studentIds.length === 0) {
            return res.json({ success: true, data: { parent: { ...parent, id: parent._id }, children: [] } });
        }

        // Batch all queries for ALL children at once instead of looping per child
        const [allEnrollments, allAttendance, allRecentTests, allFeeAssignments] = await Promise.all([
            StudentClassEnrollment.find({ student_id: { $in: studentIds }, enrollment_status: 'active' }).populate('class_id').lean(),
            Attendance.find({ student_id: { $in: studentIds } }).lean(),
            TestResult.find({ student_id: { $in: studentIds } }).sort({ created_at: -1 }).populate('test_id').lean(),
            StudentFeeAssignment.find({ student_id: { $in: studentIds } }).lean(),
        ]);

        // Build lookup maps
        const enrollmentMap = {};
        allEnrollments.forEach(e => {
            const sid = e.student_id.toString();
            if (!enrollmentMap[sid]) enrollmentMap[sid] = [];
            enrollmentMap[sid].push(e);
        });

        const attendanceMap = {};
        allAttendance.forEach(a => {
            const sid = a.student_id.toString();
            if (!attendanceMap[sid]) attendanceMap[sid] = [];
            attendanceMap[sid].push(a);
        });

        const testMap = {};
        allRecentTests.forEach(t => {
            const sid = t.student_id.toString();
            if (!testMap[sid]) testMap[sid] = t; // Only keep the first (most recent) one
        });

        const feeMap = {};
        allFeeAssignments.forEach(f => {
            feeMap[f.student_id.toString()] = f;
        });

        const children = mappings.map(m => {
            const student = m.student_id;
            if (!student) return null;
            const sid = student._id.toString();

            const studentAttendance = attendanceMap[sid] || [];
            const present = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
            const attendancePercent = studentAttendance.length > 0 ? ((present / studentAttendance.length) * 100).toFixed(1) : 0;

            const enrollment = (enrollmentMap[sid] || [])[0];
            const recentTest = testMap[sid];
            const feeAssignment = feeMap[sid];

            return {
                ...student,
                id: student._id,
                relationship: m.relationship,
                class_name: enrollment?.class_id?.class_name,
                attendance_percentage: parseFloat(attendancePercent),
                last_test: recentTest ? { ...recentTest, test_name: recentTest.test_id?.test_name } : null,
                fee: feeAssignment ? { total: feeAssignment.final_fee, paid: feeAssignment.total_paid, pending: feeAssignment.total_pending, status: feeAssignment.payment_status } : null,
            };
        }).filter(Boolean);

        res.json({ success: true, data: { parent: { ...parent, id: parent._id }, children } });
    } catch (error) {
        console.error('Dashboard parent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

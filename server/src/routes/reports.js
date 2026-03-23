const express = require('express');
const { Student, Class, FeePayment, StudentFeeAssignment, TestResult, Attendance, Enquiry } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper to calculate age from DOB
const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// GET /api/reports/enrollment
router.get('/enrollment', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const students = await Student.find().lean();
        
        // Group by enrollment month and year
        const data = students.map(s => {
            const date = s.enrollment_date ? new Date(s.enrollment_date) : new Date(s.created_at);
            return {
                Student_ID: s.PRO_ID || s._id.toString(),
                Name: `${s.first_name} ${s.last_name}`,
                Enrollment_Date: date.toISOString().split('T')[0],
                Admission_Type: s.admission_type || 'N/A',
                Status: s.academic_status || 'active',
                Gender: s.gender || 'N/A',
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ success: false, message: 'Server error generating report' });
    }
});

// GET /api/reports/revenue
router.get('/revenue', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const payments = await FeePayment.find().populate('student_id', 'first_name last_name PRO_ID').lean();
        
        const data = payments.map(p => ({
            Payment_Number: p.payment_number || 'N/A',
            Student_ID: p.student_id ? p.student_id.PRO_ID : 'Unknown',
            Student_Name: p.student_id ? `${p.student_id.first_name} ${p.student_id.last_name}` : 'Unknown',
            Amount: p.amount_paid || 0,
            Method: p.payment_method || 'N/A',
            Date: p.payment_date || 'N/A',
            Status: p.payment_status || 'completed',
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ success: false, message: 'Server error generating report' });
    }
});

// GET /api/reports/batch-performance
router.get('/batch-performance', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const results = await TestResult.find()
            .populate({ path: 'test_id', populate: { path: 'class_id' } })
            .populate('student_id', 'first_name last_name PRO_ID')
            .lean();
            
        const data = results.map(r => ({
            Test_ID: r.test_id?.test_code || 'N/A',
            Test_Name: r.test_id?.test_name || 'N/A',
            Class_Name: r.test_id?.class_id?.class_name || 'N/A',
            Subject: r.test_id?.subject || 'N/A',
            Student_ID: r.student_id?.PRO_ID || 'N/A',
            Student_Name: r.student_id ? `${r.student_id.first_name} ${r.student_id.last_name}` : 'N/A',
            Marks_Obtained: r.marks_obtained || 0,
            Total_Marks: r.total_marks || 0,
            Percentage: r.percentage || 0,
            Grade: r.grade || 'N/A',
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ success: false, message: 'Server error generating report' });
    }
});

// GET /api/reports/demographics
router.get('/demographics', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const students = await Student.find().lean();
        
        const data = students.map(s => ({
            Student_ID: s.PRO_ID || s._id.toString(),
            Name: `${s.first_name} ${s.last_name}`,
            Age: calculateAge(s.date_of_birth),
            Gender: s.gender || 'N/A',
            School: s.school_name || 'N/A',
            Status: s.academic_status || 'active',
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ success: false, message: 'Server error generating report' });
    }
});

// GET /api/reports/visual
router.get('/visual', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const [feeAgg, genderAgg, statusAgg, demoAgg] = await Promise.all([
            StudentFeeAssignment.aggregate([
                { $group: {
                    _id: '$payment_status',
                    count: { $sum: 1 },
                    amount: { $sum: '$total_paid' }
                } }
            ]),
            Student.aggregate([
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]),
            Enquiry.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            TestResult.aggregate([
                { $group: { _id: '$grade', count: { $sum: 1 } } }
            ])
        ]);

        const formatAgg = (aggData) => aggData.map(d => ({ name: d._id || 'Unknown', value: d.count }));

        res.json({
            success: true,
            data: {
                fees: feeAgg.map(f => ({ name: f._id, students: f.count, amount: f.amount })),
                demographics: formatAgg(genderAgg),
                enquiries: formatAgg(statusAgg),
                testGrades: formatAgg(demoAgg),
            }
        });
    } catch (error) {
        console.error('Reports visual error:', error);
        res.status(500).json({ success: false, message: 'Server error generating visual data' });
    }
});

// GET /api/reports/master
router.get('/master', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const [students, classes, activeStudents] = await Promise.all([
            Student.countDocuments(),
            Class.countDocuments(),
            Student.countDocuments({ academic_status: 'active' })
        ]);

        const enquiries = await Enquiry.countDocuments();
        
        const data = [{
            Report: 'Master Summary',
            Generated_At: new Date().toISOString(),
            Total_Students: students,
            Active_Students: activeStudents,
            Total_Classes: classes,
            Total_Enquiries: enquiries,
        }];

        res.json({ success: true, data });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ success: false, message: 'Server error generating report' });
    }
});

module.exports = router;

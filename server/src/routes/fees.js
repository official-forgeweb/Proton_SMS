const express = require('express');
const { FeeStructure, StudentFeeAssignment, FeePayment, Student } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

const generatePaymentNumber = () => `PAY${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const generateReceiptNumber = () => `RCPT${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

router.get('/structures', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const structures = await FeeStructure.find().lean();
        const data = structures.map(s => ({ ...s, id: s._id }));
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/structures', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const structure = await FeeStructure.create({
            ...req.body,
            total_annual_fee: (req.body.tuition_fee || 0) + (req.body.registration_fee || 0) + (req.body.development_fee || 0) + (req.body.examination_fee || 0) + (req.body.library_fee || 0) + (req.body.sports_fee || 0),
        });
        res.status(201).json({ success: true, data: { ...structure.toObject(), id: structure._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/assignments', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { student_id, final_fee, due_date } = req.body;

        // Prevent duplicate assignments
        const existing = await StudentFeeAssignment.findOne({ student_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Fee already assigned to this student' });
        }

        const assignment = await StudentFeeAssignment.create({
            student_id,
            final_fee: final_fee || 0,
            total_paid: 0,
            total_pending: final_fee || 0,
            payment_status: 'pending',
            due_date: due_date || new Date().toISOString()
        });

        res.status(201).json({ success: true, data: { ...assignment.toObject(), id: assignment._id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/assignments', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.payment_status = status;

        const assignments = await StudentFeeAssignment.find(query).populate('student_id').lean();
        const data = assignments.map(a => {
            const student = a.student_id;
            return {
                ...a,
                id: a._id,
                student_id: student?._id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const payments = await FeePayment.find({ payment_status: 'completed' }).lean();
        const totalCollected = payments.reduce((sum, p) => sum + p.amount_paid, 0);

        const assignments = await StudentFeeAssignment.find().lean();
        const totalPending = assignments.reduce((sum, f) => sum + (f.total_pending || 0), 0);

        const totalStudents = assignments.length;
        const paidStudents = assignments.filter(f => f.payment_status === 'paid').length;
        const partialStudents = assignments.filter(f => f.payment_status === 'partial').length;
        const overdueStudents = assignments.filter(f => f.payment_status === 'overdue').length;

        res.json({ success: true, data: { total_collected: totalCollected, total_pending: totalPending, total_students: totalStudents, paid_students: paidStudents, partial_students: partialStudents, overdue_students: overdueStudents, pending_students: totalStudents - paidStudents } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/pay', authenticateToken, async (req, res) => {
    try {
        const { student_id, amount_paid, payment_method, installment_number, remarks } = req.body;

        const assignment = await StudentFeeAssignment.findOne({ student_id });
        if (!assignment) return res.status(404).json({ success: false, message: 'Fee assignment not found' });

        const payment = await FeePayment.create({
            payment_number: generatePaymentNumber(),
            student_id,
            amount_paid,
            payment_date: new Date().toISOString(),
            payment_method: payment_method || 'online_gateway',
            transaction_id: `TXN${Date.now()}`,
            installment_number,
            receipt_number: generateReceiptNumber(),
            receipt_generated_at: new Date().toISOString(),
            received_by: req.user.id,
        });

        assignment.total_paid = (assignment.total_paid || 0) + amount_paid;
        assignment.total_pending = assignment.final_fee - assignment.total_paid;
        assignment.payment_status = assignment.total_paid >= assignment.final_fee ? 'paid' : 'partial';
        await assignment.save();

        res.status(201).json({ success: true, data: { ...payment.toObject(), id: payment._id }, message: `Payment recorded: ${payment.receipt_number}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/payments', authenticateToken, async (req, res) => {
    try {
        const { student_id } = req.query;
        let query = {};
        if (student_id && mongoose.isValidObjectId(student_id)) query.student_id = student_id;

        const payments = await FeePayment.find(query).sort({ payment_date: -1 }).populate('student_id').lean();
        const data = payments.map(p => {
            const student = p.student_id;
            return {
                ...p,
                id: p._id,
                student_id: student?._id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const generatePaymentNumber = () => `PAY${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const generateReceiptNumber = () => `RCPT${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
// GET /api/fees/structures
router.get('/structures', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const structures = await database_1.default.feeStructure.findMany();
        const data = structures.map(s => ({ ...s, id: s.id }));
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/fees/structures
router.post('/structures', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const structure = await database_1.default.feeStructure.create({
            data: {
                ...req.body,
                total_annual_fee: (req.body.tuition_fee || 0) + (req.body.registration_fee || 0) + (req.body.development_fee || 0) + (req.body.examination_fee || 0) + (req.body.library_fee || 0) + (req.body.sports_fee || 0),
            },
        });
        res.status(201).json({ success: true, data: { ...structure, id: structure.id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/fees/assignments
router.post('/assignments', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), async (req, res) => {
    try {
        const { student_id, final_fee, due_date } = req.body;
        const existing = await database_1.default.studentFeeAssignment.findFirst({ where: { student_id } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Fee already assigned to this student' });
            return;
        }
        const assignment = await database_1.default.studentFeeAssignment.create({
            data: {
                student_id,
                final_fee: final_fee || 0,
                total_paid: 0,
                total_pending: final_fee || 0,
                payment_status: 'pending',
                assigned_date: due_date || new Date().toISOString(),
            },
        });
        res.status(201).json({ success: true, data: { ...assignment, id: assignment.id } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/fees/assignments
router.get('/assignments', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        let where = {};
        if (status)
            where.payment_status = status;
        const assignments = await database_1.default.studentFeeAssignment.findMany({
            where,
            include: { student: true },
        });
        const data = assignments.map(a => {
            const student = a.student;
            return {
                ...a,
                id: a.id,
                student_id: student?.id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
                student: undefined,
            };
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/fees/stats
router.get('/stats', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const [paymentAgg, feeAgg] = await Promise.all([
            database_1.default.feePayment.aggregate({
                where: { payment_status: 'completed' },
                _sum: { amount_paid: true },
            }),
            database_1.default.studentFeeAssignment.groupBy({
                by: ['payment_status'],
                _count: true,
                _sum: { total_pending: true },
            }),
        ]);
        const totalCollected = paymentAgg._sum.amount_paid || 0;
        let totalPending = 0, totalStudents = 0, paidStudents = 0, partialStudents = 0, overdueStudents = 0;
        feeAgg.forEach(g => {
            totalStudents += g._count;
            totalPending += g._sum.total_pending || 0;
            if (g.payment_status === 'paid')
                paidStudents = g._count;
            if (g.payment_status === 'partial')
                partialStudents = g._count;
            if (g.payment_status === 'overdue')
                overdueStudents = g._count;
        });
        res.json({
            success: true,
            data: {
                total_collected: totalCollected,
                total_pending: totalPending,
                total_students: totalStudents,
                paid_students: paidStudents,
                partial_students: partialStudents,
                overdue_students: overdueStudents,
                pending_students: totalStudents - paidStudents,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/fees/pay
router.post('/pay', auth_1.authenticateToken, async (req, res) => {
    try {
        const { student_id, amount_paid, payment_method, installment_number } = req.body;
        const assignment = await database_1.default.studentFeeAssignment.findFirst({ where: { student_id } });
        if (!assignment) {
            res.status(404).json({ success: false, message: 'Fee assignment not found' });
            return;
        }
        const payment = await database_1.default.feePayment.create({
            data: {
                payment_number: generatePaymentNumber(),
                student_id,
                amount_paid,
                payment_date: new Date().toISOString(),
                payment_method: payment_method || 'online_gateway',
                transaction_id: `TXN${Date.now()}`,
                installment_number,
                receipt_number: generateReceiptNumber(),
                receipt_generated_at: new Date(),
                received_by: req.user.id,
            },
        });
        const newTotalPaid = (assignment.total_paid || 0) + amount_paid;
        const newTotalPending = (assignment.final_fee || 0) - newTotalPaid;
        const newStatus = newTotalPaid >= (assignment.final_fee || 0) ? 'paid' : 'partial';
        await database_1.default.studentFeeAssignment.update({
            where: { id: assignment.id },
            data: {
                total_paid: newTotalPaid,
                total_pending: newTotalPending,
                payment_status: newStatus,
            },
        });
        res.status(201).json({ success: true, data: { ...payment, id: payment.id }, message: `Payment recorded: ${payment.receipt_number}` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/fees/payments
router.get('/payments', auth_1.authenticateToken, async (req, res) => {
    try {
        const { student_id } = req.query;
        let where = {};
        if (student_id && isUUID(student_id))
            where.student_id = student_id;
        const payments = await database_1.default.feePayment.findMany({
            where,
            orderBy: { payment_date: 'desc' },
            include: { student: true },
        });
        const data = payments.map(p => {
            const student = p.student;
            return {
                ...p,
                id: p.id,
                student_id: student?.id,
                student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
                pro_id: student?.PRO_ID,
                student: undefined,
            };
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=fees.js.map
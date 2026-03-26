import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generatePaymentNumber = (): string =>
  `PAY${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const generateReceiptNumber = (): string =>
  `RCPT${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// GET /api/fees/structures
router.get('/structures', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const structures = await prisma.feeStructure.findMany();
    const data = structures.map(s => ({ ...s, id: s.id }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/structures
router.post('/structures', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const structure = await prisma.feeStructure.create({
      data: {
        ...req.body,
        total_annual_fee: (req.body.tuition_fee || 0) + (req.body.registration_fee || 0) + (req.body.development_fee || 0) + (req.body.examination_fee || 0) + (req.body.library_fee || 0) + (req.body.sports_fee || 0),
      },
    });
    res.status(201).json({ success: true, data: { ...structure, id: structure.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/assignments
router.post('/assignments', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, final_fee, due_date } = req.body;

    const existing = await prisma.studentFeeAssignment.findFirst({ where: { student_id } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Fee already assigned to this student' });
      return;
    }

    const assignment = await prisma.studentFeeAssignment.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/assignments
router.get('/assignments', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>;
    let where: any = {};
    if (status) where.payment_status = status;

    const assignments = await prisma.studentFeeAssignment.findMany({
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/stats
router.get('/stats', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [paymentAgg, feeAgg] = await Promise.all([
      prisma.feePayment.aggregate({
        where: { payment_status: 'completed' },
        _sum: { amount_paid: true },
      }),
      prisma.studentFeeAssignment.groupBy({
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
      if (g.payment_status === 'paid') paidStudents = g._count;
      if (g.payment_status === 'partial') partialStudents = g._count;
      if (g.payment_status === 'overdue') overdueStudents = g._count;
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/pay
router.post('/pay', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, amount_paid, payment_method, installment_number } = req.body;

    const assignment = await prisma.studentFeeAssignment.findFirst({ where: { student_id } });
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Fee assignment not found' });
      return;
    }

    const payment = await prisma.feePayment.create({
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
        received_by: req.user!.id,
      },
    });

    const newTotalPaid = (assignment.total_paid || 0) + amount_paid;
    const newTotalPending = (assignment.final_fee || 0) - newTotalPaid;
    const newStatus = newTotalPaid >= (assignment.final_fee || 0) ? 'paid' : 'partial';

    await prisma.studentFeeAssignment.update({
      where: { id: assignment.id },
      data: {
        total_paid: newTotalPaid,
        total_pending: newTotalPending,
        payment_status: newStatus,
      },
    });

    res.status(201).json({ success: true, data: { ...payment, id: payment.id }, message: `Payment recorded: ${payment.receipt_number}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/payments
router.get('/payments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id } = req.query as Record<string, string>;
    let where: any = {};
    if (student_id && isUUID(student_id)) where.student_id = student_id;

    const payments = await prisma.feePayment.findMany({
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

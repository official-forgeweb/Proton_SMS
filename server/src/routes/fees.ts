import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const generatePaymentNumber = (): string =>
  `PAY${new Date().getFullYear()}${String(Math.floor(100000 + Math.random() * 900000))}`;
const generateReceiptNumber = (): string =>
  `RCPT${new Date().getFullYear()}${String(Math.floor(100000 + Math.random() * 900000))}`;

// ──────────────────────────────────────────────
// Helper: Generate Installments Preview
// ──────────────────────────────────────────────
function generateInstallmentsPreview(params: {
  final_fee: number;
  installment_count: number;
  course_duration_months: number;
  start_date: string; // YYYY-MM-DD
  preferred_due_day?: number;
}) {
  const { final_fee, installment_count, course_duration_months, start_date, preferred_due_day } = params;
  
  // Calculate interval in months: course_duration_months / installment_count
  const interval = course_duration_months / installment_count;
  
  const baseAmount = Math.floor((final_fee / installment_count) * 100) / 100;
  const lastAmount = Math.round((final_fee - (baseAmount * (installment_count - 1))) * 100) / 100;
  
  const installments = [];
  const baseDate = new Date(start_date);
  
  for (let i = 1; i <= installment_count; i++) {
    const amount = i === installment_count ? lastAmount : baseAmount;
    
    // Calculate months to add
    const monthsToAdd = Math.round((i - 1) * interval);
    const targetDate = new Date(baseDate);
    targetDate.setMonth(targetDate.getMonth() + monthsToAdd);
    
    // Adjust to preferred due day if provided
    if (preferred_due_day !== undefined && preferred_due_day !== null) {
      // Clamp between 1 and 28 to avoid month overflow issues (e.g. Feb 30)
      const day = Math.min(28, Math.max(1, preferred_due_day));
      targetDate.setDate(day);
    }
    
    const formattedDate = targetDate.toISOString().split('T')[0];
    
    installments.push({
      installment_number: i,
      amount,
      due_date: formattedDate,
      remaining_amount: amount,
      paid_amount: 0,
      status: 'upcoming'
    });
  }
  
  return installments;
}

// ──────────────────────────────────────────────
// Helper: Centralized Fee Allocation & Recalculation Engine
// ──────────────────────────────────────────────
async function reallocatePaymentsAndRecalculate(assignmentId: string, tx: any) {
  // 1. Fetch the assignment and all active installments (sorted by installment_number)
  const assignment = await tx.studentFeeAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      installments: {
        where: { is_deleted: false },
        orderBy: { installment_number: 'asc' }
      }
    }
  });
  
  if (!assignment) return;
  
  // 2. Fetch all active payments for this student
  const activePayments = await tx.feePayment.findMany({
    where: {
      student_id: assignment.student_id,
      is_deleted: false,
      payment_status: 'completed'
    },
    orderBy: { payment_date: 'asc' }
  });
  
  // 3. Reset all active installments to unpaid state
  const installments = assignment.installments.map((inst: any) => ({
    ...inst,
    paid_amount: 0,
    remaining_amount: inst.amount,
    paid_date: null,
    payment_id: null,
    status: 'upcoming'
  }));
  
  // 4. Sequentially allocate each payment
  for (const payment of activePayments) {
    let remainingPayment = payment.amount_paid || 0;
    
    for (let i = 0; i < installments.length; i++) {
      if (remainingPayment <= 0) break;
      
      const inst = installments[i];
      if (inst.remaining_amount <= 0) continue;
      
      const toAllocate = Math.min(remainingPayment, inst.remaining_amount);
      inst.paid_amount = Math.round((inst.paid_amount + toAllocate) * 100) / 100;
      inst.remaining_amount = Math.round((inst.remaining_amount - toAllocate) * 100) / 100;
      remainingPayment = Math.round((remainingPayment - toAllocate) * 100) / 100;
      
      if (inst.remaining_amount === 0) {
        inst.paid_date = payment.payment_date || new Date().toISOString().split('T')[0];
        inst.payment_id = payment.id;
      }
    }
    
    // Allocate excess payment to the last installment if any left
    if (remainingPayment > 0 && installments.length > 0) {
      const lastInst = installments[installments.length - 1];
      lastInst.paid_amount = Math.round((lastInst.paid_amount + remainingPayment) * 100) / 100;
      lastInst.remaining_amount = 0;
      lastInst.paid_date = payment.payment_date || new Date().toISOString().split('T')[0];
      lastInst.payment_id = payment.id;
    }
  }
  
  // 5. Update installment statuses based on due dates
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlus7Str = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  for (const inst of installments) {
    if (inst.remaining_amount === 0) {
      inst.status = 'paid';
    } else if (inst.due_date < todayStr) {
      inst.status = 'overdue';
    } else if (inst.due_date <= todayPlus7Str) {
      inst.status = 'due';
    } else if (inst.paid_amount > 0) {
      inst.status = 'partially_paid';
    } else {
      inst.status = 'upcoming';
    }
    
    // Save the installment changes
    await tx.feeInstallment.update({
      where: { id: inst.id },
      data: {
        paid_amount: inst.paid_amount,
        remaining_amount: inst.remaining_amount,
        paid_date: inst.paid_date,
        payment_id: inst.payment_id,
        status: inst.status
      }
    });
  }
  
  // 6. Recalculate overall assignment fields
  const totalPaid = Math.round(installments.reduce((sum: number, inst: any) => sum + inst.paid_amount, 0) * 100) / 100;
  const totalPending = Math.round(installments.reduce((sum: number, inst: any) => sum + inst.remaining_amount, 0) * 100) / 100;
  
  let overallStatus = 'pending';
  if (totalPaid === 0) {
    overallStatus = 'pending';
  } else if (totalPending === 0) {
    overallStatus = 'paid';
  } else {
    const hasOverdue = installments.some((inst: any) => inst.status === 'overdue');
    if (hasOverdue) {
      overallStatus = 'overdue';
    } else {
      overallStatus = 'partial';
    }
  }
  
  await tx.studentFeeAssignment.update({
    where: { id: assignment.id },
    data: {
      total_paid: totalPaid,
      total_pending: totalPending,
      payment_status: overallStatus
    }
  });
}

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

// GET /api/fees/structures
router.get('/structures', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const structures = await prisma.feeStructure.findMany({
      include: { class: true }
    });
    res.json({ success: true, data: structures });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/structures
router.post('/structures', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { structure_name, class_id, academic_year, tuition_fee, registration_fee, admission_fee, max_installments } = req.body;
    
    const baseTuition = Number(tuition_fee || 0);
    const baseReg = Number(registration_fee || 0);
    const baseAdm = Number(admission_fee || 0);
    const total = baseTuition + baseReg + baseAdm;

    const structure = await prisma.feeStructure.create({
      data: {
        structure_name,
        class_id: class_id || null,
        academic_year,
        tuition_fee: baseTuition,
        registration_fee: baseReg,
        admission_fee: baseAdm,
        total_annual_fee: total,
        max_installments: max_installments ? Number(max_installments) : 12,
        is_active: true
      },
    });
    res.status(201).json({ success: true, data: structure });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/assignments
router.get('/assignments', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    let where: any = {};
    if (status) where.payment_status = status;

    const assignments = await prisma.studentFeeAssignment.findMany({
      where,
      include: {
        student: {
          include: {
            class_enrollments: {
              where: { enrollment_status: 'active' },
              include: { class: true },
              take: 1
            }
          }
        },
        fee_structure: true,
        installments: {
          where: { is_deleted: false },
          orderBy: { installment_number: 'asc' }
        }
      },
    });

    const data = assignments.map(a => {
      const student = a.student;
      const classEnrollment = student?.class_enrollments?.[0];
      const className = classEnrollment?.class?.class_name || 'N/A';
      return {
        ...a,
        student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
        pro_id: student?.PRO_ID,
        class_name: className,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/assignments/preview
router.post('/assignments/preview', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { final_fee, installment_count, course_duration_months, start_date, preferred_due_day } = req.body;
    
    if (!final_fee || !installment_count || !course_duration_months || !start_date) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }
    
    const installments = generateInstallmentsPreview({
      final_fee: Number(final_fee),
      installment_count: Number(installment_count),
      course_duration_months: Number(course_duration_months),
      start_date,
      preferred_due_day: preferred_due_day ? Number(preferred_due_day) : undefined
    });
    
    res.json({ success: true, data: installments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/assignments
router.post('/assignments', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      student_id,
      fee_structure_id,
      academic_year,
      total_fee,
      admission_fee,
      registration_fee,
      discount_percentage,
      discount_amount,
      scholarship_amount,
      payment_mode,
      installment_strategy,
      installment_count,
      course_duration_months,
      preferred_due_day,
      start_date,
      notes,
      custom_installments // Array of { installment_number, amount, due_date }
    } = req.body;

    const existing = await prisma.studentFeeAssignment.findFirst({
      where: { student_id }
    });
    
    if (existing) {
      res.status(400).json({ success: false, message: 'Fee already assigned to this student' });
      return;
    }

    const baseFee = Number(total_fee || 0);
    const admFee = Number(admission_fee || 0);
    const regFee = Number(registration_fee || 0);
    const discPct = Number(discount_percentage || 0);
    
    let discAmt = Number(discount_amount || 0);
    if (discPct > 0 && discAmt === 0) {
      discAmt = (baseFee * discPct) / 100;
    }
    
    const scholAmt = Number(scholarship_amount || 0);
    const final_fee = (baseFee + admFee + regFee) - discAmt - scholAmt;
    
    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.studentFeeAssignment.create({
        data: {
          student_id,
          fee_structure_id: fee_structure_id || null,
          academic_year,
          total_fee: baseFee,
          admission_fee: admFee,
          registration_fee: regFee,
          discount_percentage: discPct,
          discount_amount: discAmt,
          scholarship_amount: scholAmt,
          final_fee,
          total_paid: 0,
          total_pending: final_fee,
          payment_status: 'pending',
          payment_mode: payment_mode || 'one_time',
          installment_strategy: installment_strategy || 'auto_equal',
          installment_count: payment_mode === 'one_time' ? 1 : Number(installment_count || 1),
          course_duration_months: Number(course_duration_months || 12),
          preferred_due_day: preferred_due_day ? Number(preferred_due_day) : null,
          start_date: start_date || new Date().toISOString().split('T')[0],
          notes,
          assigned_date: new Date().toISOString().split('T')[0]
        }
      });

      let generatedInstallments = [];
      
      if (payment_mode === 'one_time') {
        generatedInstallments = [{
          installment_number: 1,
          amount: final_fee,
          remaining_amount: final_fee,
          due_date: start_date || new Date().toISOString().split('T')[0],
          status: 'upcoming'
        }];
      } else if (installment_strategy === 'manual_custom' && custom_installments && custom_installments.length > 0) {
        const sum = custom_installments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
        if (Math.abs(sum - final_fee) > 0.01) {
          throw new Error(`Sum of custom installments (${sum}) does not match net payable fee (${final_fee})`);
        }
        
        generatedInstallments = custom_installments.map((inst: any, idx: number) => ({
          installment_number: inst.installment_number || (idx + 1),
          amount: Number(inst.amount),
          remaining_amount: Number(inst.amount),
          due_date: inst.due_date,
          status: 'upcoming'
        }));
      } else {
        generatedInstallments = generateInstallmentsPreview({
          final_fee,
          installment_count: payment_mode === 'one_time' ? 1 : Number(installment_count || 1),
          course_duration_months: Number(course_duration_months || 12),
          start_date: start_date || new Date().toISOString().split('T')[0],
          preferred_due_day: preferred_due_day ? Number(preferred_due_day) : undefined
        });
      }

      await Promise.all(
        generatedInstallments.map((inst: any) =>
          tx.feeInstallment.create({
            data: {
              assignment_id: assignment.id,
              installment_number: inst.installment_number,
              amount: inst.amount,
              remaining_amount: inst.remaining_amount,
              due_date: inst.due_date,
              status: inst.status
            }
          })
        )
      );

      await reallocatePaymentsAndRecalculate(assignment.id, tx);
      
      await tx.feeAuditLog.create({
        data: {
          assignment_id: assignment.id,
          user_id: req.user!.id,
          action: 'fee_assigned',
          details: `Assigned fee structure. Net payable: ${final_fee}. Installments: ${generatedInstallments.length}`
        }
      });

      return assignment;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/fees/assignments/:id
router.get('/assignments/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: {
          include: {
            class_enrollments: {
              where: { enrollment_status: 'active' },
              include: { class: true },
              take: 1
            }
          }
        },
        fee_structure: true,
        installments: {
          where: { is_deleted: false },
          orderBy: { installment_number: 'asc' }
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Fee assignment not found' });
      return;
    }

    const classEnrollment = assignment.student?.class_enrollments?.[0];
    const className = classEnrollment?.class?.class_name || 'N/A';

    const data = {
      ...assignment,
      student_name: assignment.student ? `${assignment.student.first_name || ''} ${assignment.student.last_name || ''}`.trim() : '',
      pro_id: assignment.student?.PRO_ID,
      class_name: className,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/fees/assignments/:id
router.put('/assignments/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const { installments: updatedInstallments, notes } = req.body;
    
    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
      include: { installments: { where: { is_deleted: false } } }
    });
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Fee assignment not found' });
      return;
    }
    
    await prisma.$transaction(async (tx) => {
      for (const updated of updatedInstallments) {
        const existing = (assignment.installments as any[]).find((i: any) => i.installment_number === updated.installment_number);
        if (existing) {
          if (existing.amount !== Number(updated.amount) || existing.due_date !== updated.due_date) {
            if (existing.paid_amount > 0 && existing.amount !== Number(updated.amount)) {
              throw new Error(`Cannot change amount for installment ${existing.installment_number} because it has already been paid/partially paid.`);
            }
            
            await tx.feeAuditLog.create({
              data: {
                assignment_id: assignmentId,
                user_id: req.user!.id,
                action: 'installment_edited',
                field_changed: existing.amount !== Number(updated.amount) ? 'amount' : 'due_date',
                old_value: existing.amount !== Number(updated.amount) ? String(existing.amount) : existing.due_date,
                new_value: existing.amount !== Number(updated.amount) ? String(updated.amount) : updated.due_date,
                details: `Installment ${existing.installment_number} updated`
              }
            });
            
            await tx.feeInstallment.update({
              where: { id: existing.id },
              data: {
                amount: Number(updated.amount),
                due_date: updated.due_date
              }
            });
          }
        }
      }
      
      if (notes !== undefined) {
        await tx.studentFeeAssignment.update({
          where: { id: assignmentId },
          data: { notes }
        });
      }
      
      const allActive = await tx.feeInstallment.findMany({
        where: { assignment_id: assignmentId, is_deleted: false }
      });
      const newFinalFee = allActive.reduce((acc, curr) => acc + curr.amount, 0);
      
      await tx.studentFeeAssignment.update({
        where: { id: assignmentId },
        data: { final_fee: newFinalFee }
      });
      
      await reallocatePaymentsAndRecalculate(assignmentId, tx);
    });
    
    res.json({ success: true, message: 'Installments updated successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/fees/pay
router.post('/pay', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, amount_paid, payment_method, transaction_id, remarks } = req.body;

    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { student_id }
    });
    
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Fee assignment not found' });
      return;
    }

    const payAmount = Number(amount_paid);
    if (isNaN(payAmount) || payAmount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid payment amount' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          payment_number: generatePaymentNumber(),
          student_id,
          amount_paid: payAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: payment_method || 'cash',
          transaction_id: transaction_id || `TXN${Date.now()}`,
          payment_status: 'completed',
          receipt_number: generateReceiptNumber(),
          receipt_generated_at: new Date(),
          received_by: req.user!.id,
          remarks
        },
      });

      await reallocatePaymentsAndRecalculate(assignment.id, tx);

      await tx.feeAuditLog.create({
        data: {
          assignment_id: assignment.id,
          user_id: req.user!.id,
          action: 'payment_recorded',
          details: `Recorded payment: ${payment.receipt_number} of amount ${payAmount} via ${payment_method || 'cash'}`
        }
      });

      return payment;
    });

    res.status(201).json({ success: true, data: result, message: `Payment recorded: ${result.receipt_number}` });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/fees/payments
router.get('/payments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const studentIdQuery = typeof req.query.student_id === 'string' ? req.query.student_id : undefined;
    let where: any = { is_deleted: false };
    if (studentIdQuery && isUUID(studentIdQuery)) where.student_id = studentIdQuery;

    // Students can only see their own payments
    if (req.user!.role === 'student') {
      const studentUser = await prisma.student.findUnique({
        where: { user_id: req.user!.id }
      });
      if (!studentUser) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
      where.student_id = studentUser.id;
    }

    const payments = await prisma.feePayment.findMany({
      where,
      orderBy: { payment_date: 'desc' },
      include: {
        student: {
          include: {
            class_enrollments: {
              where: { enrollment_status: 'active' },
              include: { class: true },
              take: 1
            }
          }
        },
        receiver: {
          select: {
            email: true,
            role: true
          }
        }
      },
    });

    const data = payments.map(p => {
      const student = p.student;
      const classEnrollment = student?.class_enrollments?.[0];
      const className = classEnrollment?.class?.class_name || 'N/A';
      return {
        ...p,
        student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
        pro_id: student?.PRO_ID,
        class_name: className,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/fees/payments/:id
router.delete('/payments/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentId = req.params.id as string;
    const { remarks } = req.body || {};
    
    const payment = await prisma.feePayment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            fee_assignments: true
          }
        }
      }
    });
    
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }
    
    const assignment = payment.student.fee_assignments[0];
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Associated fee assignment not found' });
      return;
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.feePayment.update({
        where: { id: paymentId },
        data: {
          is_deleted: true,
          remarks: remarks ? `${payment.remarks || ''} [DELETED: ${remarks}]` : payment.remarks
        }
      });
      
      await reallocatePaymentsAndRecalculate(assignment.id, tx);
      
      await tx.feeAuditLog.create({
        data: {
          assignment_id: assignment.id,
          user_id: req.user!.id,
          action: 'payment_reversed',
          details: `Reversed payment ${payment.receipt_number} of amount ${payment.amount_paid}. Remarks: ${remarks || 'None'}`
        }
      });
    });
    
    res.json({ success: true, message: 'Payment deleted and balances restored successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/student/:studentId
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    let { studentId } = req.params;
    
    if (studentId === 'me') {
      const studentUser = await prisma.student.findUnique({
        where: { user_id: req.user!.id }
      });
      if (!studentUser) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }
      studentId = studentUser.id;
    } else {
      if (req.user!.role === 'student') {
        const studentUser = await prisma.student.findUnique({
          where: { user_id: req.user!.id }
        });
        if (!studentUser || studentUser.id !== studentId) {
          res.status(403).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }
    }
    
    const sId = studentId as string;
    
    const assignment = await prisma.studentFeeAssignment.findFirst({
      where: { student_id: sId },
      include: {
        fee_structure: true,
        installments: {
          where: { is_deleted: false },
          orderBy: { installment_number: 'asc' }
        },
        audit_logs: {
          orderBy: { created_at: 'desc' },
          include: { user: { select: { email: true, role: true } } }
        }
      }
    });
    
    const payments = await prisma.feePayment.findMany({
      where: { student_id: sId, is_deleted: false },
      orderBy: { payment_date: 'desc' }
    });
    
    res.json({
      success: true,
      data: {
        assignment,
        payments
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/fees/stats
router.get('/stats', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [paymentAgg, assignments] = await Promise.all([
      prisma.feePayment.aggregate({
        where: { is_deleted: false, payment_status: 'completed' },
        _sum: { amount_paid: true },
      }),
      prisma.studentFeeAssignment.findMany({
        select: {
          payment_status: true,
          total_pending: true,
        }
      })
    ]);

    const totalCollected = paymentAgg._sum.amount_paid || 0;
    let totalPending = 0;
    let totalStudents = assignments.length;
    let paidStudents = 0;
    let partialStudents = 0;
    let overdueStudents = 0;
    let pendingStudents = 0;

    assignments.forEach(a => {
      totalPending += a.total_pending || 0;
      if (a.payment_status === 'paid') paidStudents++;
      else if (a.payment_status === 'partial') partialStudents++;
      else if (a.payment_status === 'overdue') overdueStudents++;
      else pendingStudents++;
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
        pending_students: pendingStudents,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/fees/overdue-check
router.post('/overdue-check', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await prisma.studentFeeAssignment.findMany({
      select: { id: true }
    });
    
    await prisma.$transaction(async (tx) => {
      for (const a of assignments) {
        await reallocatePaymentsAndRecalculate(a.id, tx);
      }
    });
    
    res.json({ success: true, message: 'Overdue check completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


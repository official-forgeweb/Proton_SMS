import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// Helper to calculate age from DOB
const calculateAge = (dobString: string | null): number => {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// GET /api/reports/enrollment
router.get('/enrollment', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany();

    const data = students.map(s => {
      const date = s.enrollment_date ? new Date(s.enrollment_date) : new Date(s.created_at);
      return {
        Student_ID: s.PRO_ID || s.id,
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
router.get('/revenue', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await prisma.feePayment.findMany({
      include: { student: { select: { first_name: true, last_name: true, PRO_ID: true } } },
    });

    const data = payments.map(p => ({
      Payment_Number: p.payment_number || 'N/A',
      Student_ID: p.student ? p.student.PRO_ID : 'Unknown',
      Student_Name: p.student ? `${p.student.first_name} ${p.student.last_name}` : 'Unknown',
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
router.get('/batch-performance', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const results = await prisma.testResult.findMany({
      include: {
        test: { include: { class: true } },
        student: { select: { first_name: true, last_name: true, PRO_ID: true } },
      },
    });

    const data = results.map(r => ({
      Test_ID: r.test?.test_code || 'N/A',
      Test_Name: r.test?.test_name || 'N/A',
      Class_Name: r.test?.class?.class_name || 'N/A',
      Subject: r.test?.subject || 'N/A',
      Student_ID: r.student?.PRO_ID || 'N/A',
      Student_Name: r.student ? `${r.student.first_name} ${r.student.last_name}` : 'N/A',
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
router.get('/demographics', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany();

    const data = students.map(s => ({
      Student_ID: s.PRO_ID || s.id,
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
router.get('/visual', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [feeAgg, genderAgg, statusAgg, gradeAgg] = await Promise.all([
      prisma.studentFeeAssignment.groupBy({
        by: ['payment_status'],
        _count: true,
        _sum: { total_paid: true },
      }),
      prisma.student.groupBy({ by: ['gender'], _count: true }),
      prisma.enquiry.groupBy({ by: ['status'], _count: true }),
      prisma.testResult.groupBy({ by: ['grade'], _count: true }),
    ]);

    const formatAgg = (aggData: { _count: number; [key: string]: any }[], keyField: string) =>
      aggData.map(d => ({ name: d[keyField] || 'Unknown', value: d._count }));

    res.json({
      success: true,
      data: {
        fees: feeAgg.map(f => ({ name: f.payment_status, students: f._count, amount: f._sum.total_paid })),
        demographics: formatAgg(genderAgg, 'gender'),
        enquiries: formatAgg(statusAgg, 'status'),
        testGrades: formatAgg(gradeAgg, 'grade'),
      },
    });
  } catch (error) {
    console.error('Reports visual error:', error);
    res.status(500).json({ success: false, message: 'Server error generating visual data' });
  }
});

// GET /api/reports/master
router.get('/master', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [students, classes, activeStudents, enquiries] = await Promise.all([
      prisma.student.count(),
      prisma.class.count(),
      prisma.student.count({ where: { academic_status: 'active' } }),
      prisma.enquiry.count(),
    ]);

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

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const paramId = (req: Request): string => String(req.params.id);

const generateTestCode = (): string =>
  `TEST${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// GET /api/tests
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, status, test_type } = req.query as Record<string, string>;
    let where: any = {};
    if (class_id && isUUID(class_id)) where.class_id = class_id;
    if (status) where.status = status;
    if (test_type) where.test_type = test_type;

    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) {
        const myClasses = await prisma.class.findMany({
          where: { primary_teacher_id: teacher.id },
          select: { id: true },
        });
        const classIds = myClasses.map(c => c.id);
        if (where.class_id && !classIds.includes(where.class_id)) {
          res.json({ success: true, data: [] });
          return;
        }
        if (!where.class_id) where.class_id = { in: classIds };
      }
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: { test_date: 'desc' },
      include: { class: true },
    });

    const testIds = tests.map(t => t.id);
    let resultMap: Record<string, { count: number; avgMarks: number }> = {};

    if (testIds.length > 0) {
      const resultStats = await prisma.testResult.groupBy({
        by: ['test_id'],
        where: { test_id: { in: testIds } },
        _count: true,
        _avg: { marks_obtained: true },
      });
      resultStats.forEach(r => {
        resultMap[r.test_id] = { count: r._count, avgMarks: r._avg.marks_obtained || 0 };
      });
    }

    const data = tests.map((t: any) => {
      const stats = resultMap[t.id] || { count: 0, avgMarks: 0 };
      return {
        ...t,
        id: t.id,
        class_id: t.class?.id || t.class_id,
        class_name: t.class?.class_name || '',
        results_count: stats.count,
        average_marks: stats.count > 0 ? stats.avgMarks.toFixed(1) : 0,
        class: undefined,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tests/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const test: any = isUUID(id)
      ? await prisma.test.findUnique({ where: { id }, include: { class: true } })
      : await prisma.test.findFirst({ where: { test_code: id }, include: { class: true } });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    const results = await prisma.testResult.findMany({
      where: { test_id: test.id },
      include: { student: true },
      orderBy: { rank_in_class: 'asc' },
    });

    const mappedResults = results.map((r: any) => {
      const student = r.student;
      return {
        ...r,
        id: r.id,
        student_id: student?.id,
        student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
        pro_id: student?.PRO_ID,
        student: undefined,
      };
    });

    const stats = {
      total_students: mappedResults.length,
      average: mappedResults.length > 0 ? (mappedResults.reduce((s: number, r: any) => s + (r.percentage || 0), 0) / mappedResults.length).toFixed(1) : 0,
      highest: mappedResults.length > 0 ? Math.max(...mappedResults.map((r: any) => r.marks_obtained || 0)) : 0,
      lowest: mappedResults.length > 0 ? Math.min(...mappedResults.map((r: any) => r.marks_obtained || 0)) : 0,
      passed: mappedResults.filter((r: any) => r.pass_fail === 'pass').length,
      failed: mappedResults.filter((r: any) => r.pass_fail === 'fail').length,
      pass_percentage: mappedResults.length > 0 ? ((mappedResults.filter((r: any) => r.pass_fail === 'pass').length / mappedResults.length) * 100).toFixed(1) : 0,
    };

    res.json({
      success: true,
      data: { ...test, id: test.id, class_name: test.class?.class_name, results: mappedResults, stats, class: undefined },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tests
router.post('/', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    let createdBy = req.user!.id;
    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) createdBy = teacher.id;
    }

    const test = await prisma.test.create({
      data: {
        test_code: generateTestCode(),
        ...req.body,
        status: req.body.status || 'scheduled',
        results_published: false,
        students_appeared: 0,
        created_by: createdBy,
      },
    });

    res.status(201).json({ success: true, data: { ...test, id: test.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tests/:id/results
router.post('/:id/results', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    const { results } = req.body;
    if (!results || !Array.isArray(results)) {
      res.status(400).json({ success: false, message: 'Results array required' });
      return;
    }

    const sortedResults = [...results].sort((a: any, b: any) => b.marks_obtained - a.marks_obtained);

    await prisma.testResult.deleteMany({ where: { test_id: test.id } });

    const savedResults: any[] = [];
    for (let i = 0; i < sortedResults.length; i++) {
      const r = sortedResults[i];
      const percentage = (r.marks_obtained / (test.total_marks || 1)) * 100;
      const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D';

      const newResult = await prisma.testResult.create({
        data: {
          test_id: test.id,
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          total_marks: test.total_marks,
          percentage: parseFloat(percentage.toFixed(1)),
          grade,
          pass_fail: percentage >= ((test.passing_marks || 0) / (test.total_marks || 1) * 100) ? 'pass' : 'fail',
          rank_in_class: i + 1,
          was_present: r.was_present !== false,
        },
      });

      savedResults.push({ ...newResult, id: newResult.id });
    }

    await prisma.test.update({
      where: { id: test.id },
      data: {
        students_appeared: savedResults.length,
        results_published: true,
        status: 'completed',
      },
    });

    res.json({ success: true, data: savedResults, message: 'Results saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

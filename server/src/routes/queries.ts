import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

const generateQueryNumber = (): string =>
  `QRY${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

// GET /api/queries — list queries based on role
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, query_type, student_id, raised_by, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    let where: any = {};

    if (status) where.status = status;
    if (query_type) where.query_type = query_type;
    if (raised_by) where.raised_by = raised_by;

    if (req.user!.role === 'student') {
      // Students see only their own queries
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student) {
        res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: limitNum, pages: 0 } });
        return;
      }
      where.student_id = student.id;
    } else if (req.user!.role === 'teacher') {
      // Teachers see all queries (they manage student queries)
      if (student_id) where.student_id = student_id;
    } else if (req.user!.role === 'admin') {
      // Admin sees everything
      if (student_id) where.student_id = student_id;
    }

    const skip = (pageNum - 1) * limitNum;
    const [total, queries] = await Promise.all([
      prisma.studentQuery.count({ where }),
      prisma.studentQuery.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          student: {
            select: {
              id: true, PRO_ID: true, first_name: true, last_name: true,
              phone: true, email: true,
              class_enrollments: {
                where: { enrollment_status: 'active' },
                select: { class: { select: { class_name: true } } },
                take: 1
              }
            }
          },
          target_teacher: {
            select: { id: true, first_name: true, last_name: true }
          },
          created_by_user: {
            select: { id: true, email: true, role: true }
          },
          resolved_by_user: {
            select: { id: true, email: true, role: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: queries,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/queries/stats — query stats for dashboard
router.get('/stats', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, newCount, processing, resolved, unresolved] = await Promise.all([
      prisma.studentQuery.count(),
      prisma.studentQuery.count({ where: { status: 'new' } }),
      prisma.studentQuery.count({ where: { status: 'processing' } }),
      prisma.studentQuery.count({ where: { status: 'resolved' } }),
      prisma.studentQuery.count({ where: { status: 'unresolved' } }),
    ]);

    // Type breakdown
    const typeBreakdown = await prisma.studentQuery.groupBy({
      by: ['query_type'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        total, new: newCount, processing, resolved, unresolved,
        by_type: typeBreakdown.map(t => ({ type: t.query_type, count: t._count }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/queries/:id — single query detail
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const query = await prisma.studentQuery.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          select: {
            id: true, PRO_ID: true, first_name: true, last_name: true,
            phone: true, email: true,
            class_enrollments: {
              where: { enrollment_status: 'active' },
              select: { class: { select: { class_name: true } } }
            },
            parent_mappings: {
              include: { parent: { select: { first_name: true, last_name: true, phone: true } } },
              take: 1
            }
          }
        },
        target_teacher: { select: { id: true, first_name: true, last_name: true } },
        created_by_user: { select: { id: true, email: true, role: true } },
        resolved_by_user: { select: { id: true, email: true, role: true } }
      }
    });

    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    // Authorization check
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student || query.student_id !== student.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
    }

    res.json({ success: true, data: query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/queries — create a new query
router.post('/', authenticateToken, authorize('admin', 'teacher', 'student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, query_type, query_subtype, description, target_teacher_id, priority } = req.body;

    let finalStudentId = student_id;
    let raisedBy = 'teacher';

    // If student is creating, resolve their own student_id
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student) {
        res.status(403).json({ success: false, message: 'Student profile not found' });
        return;
      }
      finalStudentId = student.id;
      raisedBy = 'student';
    }

    if (!finalStudentId || !query_type) {
      res.status(400).json({ success: false, message: 'student_id and query_type are required' });
      return;
    }

    // Verify the student exists
    const student = await prisma.student.findUnique({ where: { id: finalStudentId } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const query = await prisma.studentQuery.create({
      data: {
        query_number: generateQueryNumber(),
        student_id: finalStudentId,
        query_type,
        query_subtype: query_subtype || null,
        description: description || null,
        target_teacher_id: target_teacher_id || null,
        priority: priority || 'medium',
        raised_by: raisedBy,
        created_by_user_id: req.user!.id,
        status: 'new'
      },
      include: {
        student: { select: { first_name: true, last_name: true, PRO_ID: true } }
      }
    });

    res.status(201).json({ success: true, data: query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/queries/:id — update query status (teacher/admin)
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, resolution_note } = req.body;
    const id = req.params.id;

    const existing = await prisma.studentQuery.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    const updateData: any = { ...req.body };

    // If resolving, set resolved fields
    if (status === 'resolved' || status === 'unresolved') {
      updateData.resolved_by_user_id = req.user!.id;
      updateData.resolved_at = new Date();
    }
    if (resolution_note) {
      updateData.resolution_note = resolution_note;
    }

    const query = await prisma.studentQuery.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { first_name: true, last_name: true, PRO_ID: true } },
        target_teacher: { select: { first_name: true, last_name: true } }
      }
    });

    res.json({ success: true, data: query });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/queries/:id — delete query (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.studentQuery.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Query deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

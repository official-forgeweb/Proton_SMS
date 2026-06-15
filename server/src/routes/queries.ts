import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { sendNotification } from './notifications';

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
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (!teacher) {
        res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: limitNum, pages: 0 } });
        return;
      }
      
      const assignedClasses = await prisma.class.findMany({
        where: { primary_teacher_id: teacher.id },
        select: { id: true }
      });
      const assignedClassIds = assignedClasses.map(c => c.id);
      const enrollments = await prisma.studentClassEnrollment.findMany({
        where: { class_id: { in: assignedClassIds }, enrollment_status: 'active' },
        select: { student_id: true }
      });
      const assignedStudentIds = enrollments.map(e => e.student_id);

      const teacherCondition = {
        OR: [
          { student_id: { in: assignedStudentIds } },
          { target_teacher_id: teacher.id }
        ]
      };

      if (student_id) {
        const isAssigned = assignedStudentIds.includes(student_id);
        const hasTargeted = await prisma.studentQuery.count({
          where: { student_id, target_teacher_id: teacher.id }
        }) > 0;
        
        if (isAssigned || hasTargeted) {
          where.student_id = student_id;
          if (!isAssigned) {
            where.target_teacher_id = teacher.id;
          }
        } else {
          res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: limitNum, pages: 0 } });
          return;
        }
      } else {
        where.AND = [
          teacherCondition
        ];
      }
    } else if (req.user!.role === 'admin' || req.user!.role === 'coordinator') {
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
          },
          attachments: true
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
router.get('/stats', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
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
      where: { id: req.params.id as string },
      include: {
        student: {
          select: {
            id: true, PRO_ID: true, first_name: true, last_name: true,
            phone: true, email: true,
            class_enrollments: {
              where: { enrollment_status: 'active' },
              select: { class: { select: { class_name: true } } }
            }
          }
        },
        target_teacher: { select: { id: true, first_name: true, last_name: true } },
        created_by_user: { select: { id: true, email: true, role: true } },
        resolved_by_user: { select: { id: true, email: true, role: true } },
        attachments: true
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
    } else if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (!teacher) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
      const assignedClasses = await prisma.class.findMany({
        where: { primary_teacher_id: teacher.id },
        select: { id: true }
      });
      const assignedClassIds = assignedClasses.map(c => c.id);
      const isEnrolled = await prisma.studentClassEnrollment.count({
        where: { student_id: query.student_id, class_id: { in: assignedClassIds }, enrollment_status: 'active' }
      }) > 0;
      
      const isTargeted = query.target_teacher_id === teacher.id;
      if (!isEnrolled && !isTargeted) {
        res.status(403).json({ success: false, message: 'Not authorized to view this query' });
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
router.post('/', authenticateToken, authorize('admin', 'coordinator', 'teacher', 'student'), async (req: Request, res: Response): Promise<void> => {
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

    // Trigger WhatsApp query raised automation (non-blocking)
    const { onQueryRaised } = require('../../services/whatsapp/automation.service');
    onQueryRaised(query, student).catch((err: any) => console.error('WhatsApp Query Raised failed:', err));

    if (target_teacher_id) {
      const teacher = await prisma.teacher.findUnique({ where: { id: target_teacher_id }, select: { user_id: true } });
      if (teacher && teacher.user_id) {
        await sendNotification(
          [teacher.user_id],
          req.user!.id,
          'general',
          'New Student Query',
          `${query.student.first_name || ''} ${query.student.last_name || ''}`.trim() + ` raised a query: ${query_type}`,
          query.id
        );
      }
    }

    res.status(201).json({ success: true, data: query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/queries/:id — update query status (teacher/admin)
router.put('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, resolution_note } = req.body;
    const id = req.params.id as string;

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
        student: { select: { first_name: true, last_name: true, PRO_ID: true, user_id: true } },
        target_teacher: { select: { first_name: true, last_name: true } }
      }
    });

    if (query.student && query.student.user_id) {
      await sendNotification(
        [query.student.user_id],
        req.user!.id,
        'general',
        'Query Status Updated',
        `Your query ${query.query_number} status has been updated to: ${query.status}`,
        query.id
      );
    }

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
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.studentQuery.delete({ where: { id: req.params.id as string } });
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

// GET /api/queries/:id/details — CRM query detailed view
router.get('/:id/details', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const query = await prisma.studentQuery.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, PRO_ID: true, first_name: true, last_name: true,
            phone: true, email: true,
            class_enrollments: {
              where: { enrollment_status: 'active' },
              select: { class: { select: { class_name: true } } }
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

    // Role-based auth check
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student || query.student_id !== student.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
    } else if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (!teacher) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
      const assignedClasses = await prisma.class.findMany({
        where: { primary_teacher_id: teacher.id },
        select: { id: true }
      });
      const assignedClassIds = assignedClasses.map(c => c.id);
      const isEnrolled = await prisma.studentClassEnrollment.count({
        where: { student_id: query.student_id, class_id: { in: assignedClassIds }, enrollment_status: 'active' }
      }) > 0;
      const isTargeted = query.target_teacher_id === teacher.id;
      if (!isEnrolled && !isTargeted) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
    }

    // Fetch replies
    const replies = await prisma.queryReply.findMany({
      where: { query_id: id },
      orderBy: { created_at: 'asc' },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            role: true, 
            teacher: { select: { first_name: true, last_name: true } }, 
            student: { select: { first_name: true, last_name: true } } 
          } 
        }
      }
    });

    // Fetch attachments
    const attachments = await prisma.queryAttachment.findMany({
      where: { query_id: id },
      orderBy: { created_at: 'asc' }
    });

    // Fetch audit logs
    const auditLogs = await prisma.queryAuditLog.findMany({
      where: { query_id: id },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true } }
      }
    });

    // Fetch internal notes (only for admin and teacher)
    let internalNotes: any[] = [];
    if (req.user!.role === 'admin' || req.user!.role === 'teacher') {
      internalNotes = await prisma.queryInternalNote.findMany({
        where: { query_id: id },
        orderBy: { created_at: 'desc' },
        include: {
          user: { 
            select: { 
              id: true, 
              email: true, 
              role: true, 
              teacher: { select: { first_name: true, last_name: true } } 
            } 
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...query,
        replies,
        attachments,
        audit_logs: auditLogs,
        internal_notes: internalNotes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/queries/:id/replies — Add reply to ticket
router.post('/:id/replies', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const query = await prisma.studentQuery.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, user_id: true } }
      }
    });

    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    // Auth check
    if (req.user!.role === 'student') {
      const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
      if (!student || query.student_id !== student.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
    }

    const reply = await prisma.queryReply.create({
      data: {
        query_id: id,
        user_id: req.user!.id,
        message: message.trim()
      },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            role: true, 
            teacher: { select: { first_name: true, last_name: true } }, 
            student: { select: { first_name: true, last_name: true } } 
          } 
        }
      }
    });

    // Trigger WhatsApp query responded automation (non-blocking)
    const { onQueryResponded } = require('../../services/whatsapp/automation.service');
    onQueryResponded(query, message, req.user!.email).catch((err: any) => console.error('WhatsApp Query Responded failed:', err));

    // Create Audit Log
    await prisma.queryAuditLog.create({
      data: {
        query_id: id,
        user_id: req.user!.id,
        action: 'reply_added',
        details: `${req.user!.role.toUpperCase()} added a reply.`
      }
    });

    // Send notifications
    if (req.user!.role === 'student') {
      const notifyUserIds: string[] = [];
      if (query.target_teacher_id) {
        const teacher = await prisma.teacher.findUnique({ where: { id: query.target_teacher_id }, select: { user_id: true } });
        if (teacher && teacher.user_id) notifyUserIds.push(teacher.user_id);
      }
      const admins = await prisma.user.findMany({ where: { role: 'admin', is_active: true }, select: { id: true } });
      admins.forEach(a => notifyUserIds.push(a.id));

      if (notifyUserIds.length > 0) {
        await sendNotification(
          notifyUserIds,
          req.user!.id,
          'general',
          'New Reply from Student',
          `Student replied to query ${query.query_number}`,
          query.id
        );
      }
    } else {
      if (query.student && query.student.user_id) {
        await sendNotification(
          [query.student.user_id],
          req.user!.id,
          'general',
          'New Reply to your Query',
          `Support team replied to query ${query.query_number}`,
          query.id
        );
      }
    }

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/queries/:id/notes — Add internal note
router.post('/:id/notes', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Note content is required' });
      return;
    }

    const query = await prisma.studentQuery.findUnique({ where: { id } });
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    const internalNote = await prisma.queryInternalNote.create({
      data: {
        query_id: id,
        user_id: req.user!.id,
        note: note.trim()
      },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            role: true, 
            teacher: { select: { first_name: true, last_name: true } } 
          } 
        }
      }
    });

    // Create Audit Log
    await prisma.queryAuditLog.create({
      data: {
        query_id: id,
        user_id: req.user!.id,
        action: 'note_added',
        details: `Internal note added by ${req.user!.role.toUpperCase()}.`
      }
    });

    res.status(201).json({ success: true, data: internalNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/queries/:id/notes/:noteId — Edit internal note (admin only)
router.put('/:id/notes/:noteId', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = req.params.noteId as string;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Note content is required' });
      return;
    }

    const existingNote = await prisma.queryInternalNote.findUnique({ where: { id: noteId } });
    if (!existingNote) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const updatedNote = await prisma.queryInternalNote.update({
      where: { id: noteId },
      data: { note: note.trim() },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            role: true, 
            teacher: { select: { first_name: true, last_name: true } } 
          } 
        }
      }
    });

    // Create Audit Log
    await prisma.queryAuditLog.create({
      data: {
        query_id: existingNote.query_id,
        user_id: req.user!.id,
        action: 'note_edited',
        details: `Internal note edited.`
      }
    });

    res.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/queries/:id/notes/:noteId — Delete internal note (admin only)
router.delete('/:id/notes/:noteId', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = req.params.noteId as string;

    const existingNote = await prisma.queryInternalNote.findUnique({ where: { id: noteId } });
    if (!existingNote) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    await prisma.queryInternalNote.delete({ where: { id: noteId } });

    // Create Audit Log
    await prisma.queryAuditLog.create({
      data: {
        query_id: existingNote.query_id,
        user_id: req.user!.id,
        action: 'note_deleted',
        details: `Internal note deleted.`
      }
    });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/queries/:id/crm — CRM updates for admin/teachers (status, priority, teacher reassignment)
router.put('/:id/crm', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, priority, target_teacher_id, resolution_note } = req.body;

    const query = await prisma.studentQuery.findUnique({
      where: { id },
      include: {
        student: { select: { user_id: true } }
      }
    });
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    if (req.user!.role === 'teacher') {
      if (target_teacher_id && target_teacher_id !== query.target_teacher_id) {
        res.status(403).json({ success: false, message: 'Teachers cannot reassign queries' });
        return;
      }
    }

    const updateData: any = {};
    const auditLogsData: any[] = [];

    if (status && status !== query.status) {
      updateData.status = status;
      auditLogsData.push({
        action: 'status_changed',
        details: `Status updated from '${query.status}' to '${status}'.`
      });

      if (status === 'resolved' || status === 'unresolved') {
        updateData.resolved_by_user_id = req.user!.id;
        updateData.resolved_at = new Date();
        if (resolution_note) {
          updateData.resolution_note = resolution_note;
        }
      }
    }

    if (priority && priority !== query.priority) {
      updateData.priority = priority;
      auditLogsData.push({
        action: 'priority_changed',
        details: `Priority updated from '${query.priority}' to '${priority}'.`
      });
    }

    if (target_teacher_id !== undefined && target_teacher_id !== query.target_teacher_id) {
      updateData.target_teacher_id = target_teacher_id || null;
      let teacherName = 'Unassigned';
      if (target_teacher_id) {
        const teacher = await prisma.teacher.findUnique({ where: { id: target_teacher_id } });
        if (teacher) {
          teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
        }
      }
      auditLogsData.push({
        action: 'query_reassigned',
        details: `Query reassigned to: ${teacherName}`
      });
    }

    if (Object.keys(updateData).length === 0) {
      res.json({ success: true, data: query });
      return;
    }

    const updatedQuery = await prisma.studentQuery.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { first_name: true, last_name: true, PRO_ID: true } },
        target_teacher: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    for (const log of auditLogsData) {
      await prisma.queryAuditLog.create({
        data: {
          query_id: id,
          user_id: req.user!.id,
          action: log.action,
          details: log.details
        }
      });
    }

    if (status && query.student && query.student.user_id) {
      await sendNotification(
        [query.student.user_id],
        req.user!.id,
        'general',
        'Query Updated',
        `Your query ${query.query_number} has been updated: ${auditLogsData.map(l => l.details).join(', ')}`,
        id
      );
    }

    res.json({ success: true, data: updatedQuery });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/queries/:id/attachments — Add mock attachment details
router.post('/:id/attachments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { file_name, file_url, file_size } = req.body;

    if (!file_name || !file_url) {
      res.status(400).json({ success: false, message: 'file_name and file_url are required' });
      return;
    }

    const query = await prisma.studentQuery.findUnique({ where: { id } });
    if (!query) {
      res.status(404).json({ success: false, message: 'Query not found' });
      return;
    }

    const attachment = await prisma.queryAttachment.create({
      data: {
        query_id: id,
        file_name,
        file_url,
        file_size: file_size || null
      }
    });

    await prisma.queryAuditLog.create({
      data: {
        query_id: id,
        user_id: req.user!.id,
        action: 'attachment_added',
        details: `Attachment added: ${file_name}`
      }
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

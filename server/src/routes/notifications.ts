import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// Helper: send notification to multiple recipients
export const sendNotification = async (
  recipientIds: string[],
  senderId: string | null,
  type: string,
  title: string,
  message: string,
  referenceId?: string
) => {
  if (recipientIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: recipientIds.map(rid => ({
        recipient_id: rid,
        sender_id: senderId,
        type,
        title,
        message,
        reference_id: referenceId || null,
      })),
    });
  } catch (error) {
    console.error('Failed to send notifications:', error);
  }
};

// Helper: get student user IDs enrolled in a class
export const getStudentUserIdsForClass = async (classId: string): Promise<string[]> => {
  const enrollments = await prisma.studentClassEnrollment.findMany({
    where: { class_id: classId, enrollment_status: 'active' },
    include: { student: { select: { user_id: true } } },
  });
  return enrollments.map(e => e.student.user_id).filter(Boolean);
};

// Helper: get all teacher user IDs
export const getTeacherUserIds = async (): Promise<string[]> => {
  const teachers = await prisma.teacher.findMany({
    where: { employment_status: 'active' },
    select: { user_id: true },
  });
  return teachers.map(t => t.user_id);
};

// Helper: get all student user IDs
export const getAllStudentUserIds = async (): Promise<string[]> => {
  const students = await prisma.student.findMany({
    where: { academic_status: 'active' },
    select: { user_id: true },
  });
  return students.map(s => s.user_id);
};

// GET /api/notifications — get current user's notifications
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', unread_only } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let where: any = { recipient_id: req.user!.id };
    if (unread_only === 'true') where.is_read = false;

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          sender: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { recipient_id: req.user!.id, is_read: false },
    });

    res.json({
      success: true,
      data: notifications.map(n => ({
        ...n,
        sender_email: n.sender?.email,
        sender_role: n.sender?.role,
        sender: undefined,
      })),
      unread_count: unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.notification.count({
      where: { recipient_id: req.user!.id, is_read: false },
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read — mark single notification as read
router.put('/:id/read', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, recipient_id: req.user!.id },
      data: { is_read: true },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { recipient_id: req.user!.id, is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notifications/send — Admin/Teacher sends announcement
router.post('/send', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, target } = req.body;

    if (!title || !message || !target) {
      res.status(400).json({ success: false, message: 'title, message, and target are required' });
      return;
    }

    let recipientIds: string[] = [];

    if (target === 'all_students') {
      recipientIds = await getAllStudentUserIds();
    } else if (target === 'all_teachers') {
      recipientIds = await getTeacherUserIds();
    } else if (target === 'all') {
      const [students, teachers] = await Promise.all([
        getAllStudentUserIds(),
        getTeacherUserIds(),
      ]);
      recipientIds = [...students, ...teachers];
    } else if (target.startsWith('class:')) {
      const classId = target.replace('class:', '');
      recipientIds = await getStudentUserIdsForClass(classId);
    }

    // Filter out sender from recipients
    recipientIds = recipientIds.filter(id => id !== req.user!.id);

    if (recipientIds.length === 0) {
      res.status(400).json({ success: false, message: 'No recipients found for the target audience' });
      return;
    }

    await sendNotification(recipientIds, req.user!.id, 'announcement', title, message);

    res.json({ success: true, message: `Announcement sent to ${recipientIds.length} recipients` });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id as string, recipient_id: req.user!.id },
    });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

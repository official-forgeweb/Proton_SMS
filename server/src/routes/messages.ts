import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/messages/users - List allowed contacts based on user role
router.get('/users', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    let contacts: any[] = [];

    if (role === 'admin') {
      // Admin can chat with Teachers and Students
      const [teachers, students] = await Promise.all([
        prisma.teacher.findMany({
          where: { employment_status: 'active' },
          include: { user: { select: { id: true, email: true } } }
        }),
        prisma.student.findMany({
          where: { academic_status: 'active' },
          include: { user: { select: { id: true, email: true } } }
        })
      ]);

      contacts = [
        ...teachers.map(t => ({
          id: t.user.id,
          name: t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : t.user.email,
          role: 'teacher',
          info: t.employee_id || 'Teacher'
        })),
        ...students.map(s => ({
          id: s.user.id,
          name: s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.user.email,
          role: 'student',
          info: s.PRO_ID || 'Student'
        }))
      ];
    } else if (role === 'teacher') {
      // Teacher can chat with Admin and Students
      const [admins, students] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'admin', is_active: true },
          select: { id: true, email: true }
        }),
        prisma.student.findMany({
          where: { academic_status: 'active' },
          include: { user: { select: { id: true, email: true } } }
        })
      ]);

      contacts = [
        ...admins.map(a => ({
          id: a.id,
          name: a.email,
          role: 'admin',
          info: 'Admin'
        })),
        ...students.map(s => ({
          id: s.user.id,
          name: s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.user.email,
          role: 'student',
          info: s.PRO_ID || 'Student'
        }))
      ];
    } else if (role === 'student') {
      // Student can chat with Admin and Teachers
      const [admins, teachers] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'admin', is_active: true },
          select: { id: true, email: true }
        }),
        prisma.teacher.findMany({
          where: { employment_status: 'active' },
          include: { user: { select: { id: true, email: true } } }
        })
      ]);

      contacts = [
        ...admins.map(a => ({
          id: a.id,
          name: a.email,
          role: 'admin',
          info: 'Admin'
        })),
        ...teachers.map(t => ({
          id: t.user.id,
          name: t.first_name ? `${t.first_name} ${t.last_name || ''}`.trim() : t.user.email,
          role: 'teacher',
          info: t.employee_id || 'Teacher'
        }))
      ];
    }

    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Fetch users for chat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/messages/history/:contactId - Get chat history
router.get('/history/:contactId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const contactId = String(req.params.contactId);
    const userId = req.user!.id;

    // Retrieve conversation history
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId, recipient_id: contactId },
          { sender_id: contactId, recipient_id: userId }
        ]
      },
      orderBy: { created_at: 'asc' }
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        sender_id: contactId,
        recipient_id: userId,
        is_read: false
      },
      data: { is_read: true }
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Fetch message history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/messages/send - Send a message
router.post('/send', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient_id, content } = req.body;
    const userId = req.user!.id;

    if (!recipient_id || !content) {
      res.status(400).json({ success: false, message: 'recipient_id and content are required' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        sender_id: userId,
        recipient_id,
        content
      }
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

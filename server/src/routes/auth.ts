import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, generateAccessToken, generateRefreshToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, pro_id, username } = req.body;

    let loginIdentifier: string = username || email || pro_id;
    if (!loginIdentifier) {
      res.status(400).json({ success: false, message: 'Invalid credentials provided' });
      return;
    }
    loginIdentifier = loginIdentifier.trim();

    let user: any = null;

    if (loginIdentifier.toUpperCase().startsWith('PRO')) {
      const student = await prisma.student.findFirst({
        where: { PRO_ID: { equals: loginIdentifier, mode: 'insensitive' } },
      });
      if (student) {
        user = await prisma.user.findUnique({ where: { id: student.user_id } });
      }
    } else if (loginIdentifier.toUpperCase().startsWith('EMP')) {
      const teacher = await prisma.teacher.findFirst({
        where: { employee_id: { equals: loginIdentifier, mode: 'insensitive' } },
      });
      if (teacher) {
        user = await prisma.user.findUnique({ where: { id: teacher.user_id } });
      }
    } else {
      user = await prisma.user.findFirst({
        where: { email: { equals: loginIdentifier, mode: 'insensitive' } },
      });
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      res.status(423).json({ success: false, message: 'Account is locked.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: { increment: 1 },
          locked_until: user.failed_login_attempts >= 4 ? new Date(Date.now() + 30 * 60000) : null,
        },
      });
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failed_login_attempts: 0, locked_until: null, last_login: new Date() },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    let profile: any = {};
    if (user.role === 'student') {
      profile = await prisma.student.findUnique({ where: { user_id: user.id } }) || {};
    } else if (user.role === 'teacher') {
      const t = await prisma.teacher.findUnique({ where: { user_id: user.id } });
      profile = t ? { ...t, permissions: t.permissions || [] } : {};
    } else if (user.role === 'parent') {
      profile = await prisma.parent.findUnique({ where: { user_id: user.id } }) || {};
    } else if (user.role === 'admin') {
      profile = { first_name: 'Admin', last_name: 'User', email: user.email };
    }

    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, role: user.role, profile }, accessToken, refreshToken },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password_hash, role: role || 'student' },
    });
    res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let profile: any = {};
    if (user.role === 'student') {
      profile = await prisma.student.findUnique({ where: { user_id: user.id } }) || {};
    } else if (user.role === 'teacher') {
      const t = await prisma.teacher.findUnique({ where: { user_id: user.id } });
      profile = t ? { ...t, permissions: t.permissions || [] } : {};
    } else if (user.role === 'parent') {
      profile = await prisma.parent.findUnique({ where: { user_id: user.id } }) || {};
    } else if (user.role === 'admin') {
      profile = { first_name: 'Admin', last_name: 'User', email: user.email };
    }

    res.json({ success: true, data: { id: user.id, email: user.email, role: user.role, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

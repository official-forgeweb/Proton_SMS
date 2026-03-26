import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { AuthUser } from '../types';
import { UserRole } from '@prisma/client';

interface JwtPayload {
  userId: string;
  role?: UserRole;
}

// In-memory user cache to avoid DB lookup on every request
const userCache = new Map<string, { user: { id: string; email: string; role: UserRole; is_active: boolean }; timestamp: number }>();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedUser = async (userId: string) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.user;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, is_active: true },
  });
  if (user) {
    userCache.set(userId, { user, timestamp: Date.now() });
  }
  return user;
};

// Verify JWT Token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    const user = await getCachedUser(decoded.userId);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};

// Generate tokens
export const generateAccessToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '24h' });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

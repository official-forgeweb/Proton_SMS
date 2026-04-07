import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const dbHealthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Quick test to ensure active connection holds
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('DB Health Check Failed:', error);
    res.status(503).json({ success: false, message: 'Service Unavailable - Database connection lost' });
  }
};

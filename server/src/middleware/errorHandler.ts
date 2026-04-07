import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error route catch:', err.message || err);

  // Connection errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({ success: false, message: 'Database disconnected. Retrying...' });
    return;
  }

  // Not Found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
       res.status(404).json({ success: false, message: 'Record not found' });
       return;
    }
    if (err.code === 'P2002') {
       res.status(409).json({ success: false, message: 'Record already exists / Conflict' });
       return;
    }
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
};

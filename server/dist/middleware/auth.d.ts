import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const generateAccessToken: (userId: string, role: UserRole) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const JWT_ACCESS_SECRET: string;
export declare const JWT_REFRESH_SECRET: string;
//# sourceMappingURL=auth.d.ts.map
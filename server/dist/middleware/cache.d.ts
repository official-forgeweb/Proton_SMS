import { Request, Response, NextFunction } from 'express';
export declare const cacheMiddleware: (ttlSeconds?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const invalidateCache: (pattern: string) => void;
//# sourceMappingURL=cache.d.ts.map
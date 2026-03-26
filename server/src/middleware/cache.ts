import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache middleware with TTL
const cacheStore = new Map<string, { data: unknown; timestamp: number }>();

export const cacheMiddleware = (ttlSeconds: number = 30) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `${req.originalUrl}_${req.user?.id || 'anon'}_${req.user?.role || 'none'}`;
    const cached = cacheStore.get(key);

    if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
      res.json(cached.data);
      return;
    }

    // Override res.json to capture and cache the response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      if (res.statusCode === 200 && data?.success) {
        cacheStore.set(key, { data, timestamp: Date.now() });
      }
      return originalJson(data);
    };

    next();
  };
};

// Invalidate cache entries matching a pattern
export const invalidateCache = (pattern: string): void => {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (now - value.timestamp > 300000) {
      cacheStore.delete(key);
    }
  }
}, 300000);

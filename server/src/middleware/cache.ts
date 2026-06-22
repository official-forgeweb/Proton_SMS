import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache middleware with TTL
const cacheStore = new Map<string, { data: unknown; timestamp: number }>();

// Track pending requests for deduplication/collapsing
const pendingRequests = new Map<string, Response[]>();

export const cacheMiddleware = (ttlSeconds: number = 30) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `${req.originalUrl}_${req.user?.id || 'anon'}_${req.user?.role || 'none'}`;
    
    // 1. Check cache
    const cached = cacheStore.get(key);
    if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
      res.json(cached.data);
      return;
    }

    // 2. Check if a request for the same resource is already pending
    if (pendingRequests.has(key)) {
      // Queue this response object to receive the result when ready
      pendingRequests.get(key)!.push(res);
      return;
    }

    // Initialize the pending queue
    pendingRequests.set(key, []);

    // Override res.json to capture and cache the response, then resolve queued requests
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Save successful response to cache
      if (res.statusCode === 200 && data?.success) {
        cacheStore.set(key, { data, timestamp: Date.now() });
      }

      // Retrieve and remove queue
      const queuedResList = pendingRequests.get(key) || [];
      pendingRequests.delete(key);

      // Resolve all queued requests with the same response data
      queuedResList.forEach((queuedRes) => {
        try {
          queuedRes.status(res.statusCode).json(data);
        } catch (err: any) {
          console.warn(`⚠️ [Cache Middleware] Failed to send collapsed response to queued request:`, err.message);
        }
      });

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

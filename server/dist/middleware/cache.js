"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = exports.cacheMiddleware = void 0;
// Simple in-memory cache middleware with TTL
const cacheStore = new Map();
const cacheMiddleware = (ttlSeconds = 30) => {
    return (req, res, next) => {
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
        res.json = (data) => {
            if (res.statusCode === 200 && data?.success) {
                cacheStore.set(key, { data, timestamp: Date.now() });
            }
            return originalJson(data);
        };
        next();
    };
};
exports.cacheMiddleware = cacheMiddleware;
// Invalidate cache entries matching a pattern
const invalidateCache = (pattern) => {
    for (const key of cacheStore.keys()) {
        if (key.includes(pattern)) {
            cacheStore.delete(key);
        }
    }
};
exports.invalidateCache = invalidateCache;
// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cacheStore.entries()) {
        if (now - value.timestamp > 300000) {
            cacheStore.delete(key);
        }
    }
}, 300000);
//# sourceMappingURL=cache.js.map
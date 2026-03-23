// Simple in-memory cache middleware with TTL
const cacheStore = new Map();

const cacheMiddleware = (ttlSeconds = 30) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const key = `${req.originalUrl}_${req.user?.id || 'anon'}_${req.user?.role || 'none'}`;
        const cached = cacheStore.get(key);

        if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
            return res.json(cached.data);
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

// Invalidate cache entries matching a pattern
const invalidateCache = (pattern) => {
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
        if (now - value.timestamp > 300000) { // 5 min max
            cacheStore.delete(key);
        }
    }
}, 300000);

module.exports = { cacheMiddleware, invalidateCache };

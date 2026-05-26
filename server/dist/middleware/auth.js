"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_REFRESH_SECRET = exports.JWT_ACCESS_SECRET = exports.generateRefreshToken = exports.generateAccessToken = exports.authorize = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const env_1 = require("../config/env");
// In-memory user cache to avoid DB lookup on every request
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Prisma error codes that indicate connectivity / transient issues
const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);
const getCachedUser = async (userId) => {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
        return cached.user;
    }
    // Try up to 2 times with a small delay for transient DB errors
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            // Small timeout for the query to fail fast if internet is bad (using race)
            const user = await Promise.race([
                database_1.default.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, role: true, is_active: true },
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma Query Timeout')), 15000))
            ]);
            if (user) {
                userCache.set(userId, { user, timestamp: Date.now() });
            }
            return user;
        }
        catch (err) {
            const code = err?.code;
            const isTimeout = err?.message === 'Prisma Query Timeout';
            if ((TRANSIENT_PRISMA_CODES.has(code) || isTimeout) && attempt < 1) {
                // Wait 500ms and retry once
                await new Promise(r => setTimeout(r, 500));
                continue;
            }
            if (cached) {
                console.warn(`⚠️ DB unreachable or slow, serving stale auth cache for user ${userId}`);
                return cached.user; // Serve stale user on error to keep app snappy
            }
            throw err;
        }
    }
    return null;
};
// Verify JWT Token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Access token required' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
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
    }
    catch (error) {
        // Distinguish between auth errors and server/DB errors
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
            return;
        }
        // Database / connectivity error – NOT the user's fault
        const prismaCode = error?.code;
        if (TRANSIENT_PRISMA_CODES.has(prismaCode) || error?.message?.includes("Can't reach database")) {
            console.error('Auth Middleware – DB connectivity error (returning 503):', error.message);
            res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable. Please try again in a moment.',
                code: 'SERVER_UNAVAILABLE',
            });
            return;
        }
        // Unknown error – still a server problem, not auth
        console.error('Auth Middleware – unexpected error (returning 500):', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'SERVER_ERROR',
        });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
// Generate tokens
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: '24h' });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
exports.JWT_ACCESS_SECRET = env_1.env.JWT_ACCESS_SECRET;
exports.JWT_REFRESH_SECRET = env_1.env.JWT_REFRESH_SECRET;
//# sourceMappingURL=auth.js.map
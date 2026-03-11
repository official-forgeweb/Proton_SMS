const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'proton_access_secret_key_2024_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'proton_refresh_secret_key_2024_super_secure';

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.userId).lean();

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

// Generate tokens
const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, { expiresIn: '24h' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

module.exports = {
    authenticateToken,
    authorize,
    generateAccessToken,
    generateRefreshToken,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbHealthCheck = void 0;
const database_1 = __importDefault(require("../config/database"));
const dbHealthCheck = async (req, res, next) => {
    try {
        // Quick test to ensure active connection holds
        await database_1.default.$queryRaw `SELECT 1`;
        next();
    }
    catch (error) {
        console.error('DB Health Check Failed:', error);
        res.status(503).json({ success: false, message: 'Service Unavailable - Database connection lost' });
    }
};
exports.dbHealthCheck = dbHealthCheck;
//# sourceMappingURL=dbHealth.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
// Pooled SMTP configuration for enterprise stability and performance
const transporterConfig = {
    host: env_1.env.SMTP_HOST,
    port: env_1.env.SMTP_PORT,
    secure: env_1.env.SMTP_PORT === 465, // true for 465, false for other ports
    pool: true, // Use SMTP pooling for efficient connection reuse
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10, // Max 10 messages per second
    auth: {
        user: env_1.env.SMTP_USER,
        pass: env_1.env.SMTP_PASS,
    },
    // Ensure Gmail/other custom SMTP connection timeouts are handled safely
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 30000, // 30s
};
// Create the transporter
exports.transporter = nodemailer_1.default.createTransport(transporterConfig);
// Verify connection on startup (non-blocking)
exports.transporter.verify((error) => {
    if (error) {
        console.error('❌ Mail Service - SMTP connection verification failed:', error.message);
    }
    else {
        console.log('🚀 Mail Service - SMTP Transporter ready & connection pooled.');
    }
});
//# sourceMappingURL=transporter.js.map
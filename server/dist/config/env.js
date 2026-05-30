"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'proton_access_secret_key_2024_super_secure',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'proton_refresh_secret_key_2024_super_secure',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@protoncoaching.com',
    FROM_NAME: process.env.FROM_NAME || 'Proton Coaching Institute',
    SMTP_FROM: process.env.SMTP_FROM || process.env.FROM_EMAIL || 'noreply@protoncoaching.com',
    APP_NAME: process.env.APP_NAME || 'Proton SMS',
    APP_URL: process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:3000',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};
//# sourceMappingURL=env.js.map
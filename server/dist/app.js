"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const dbHealth_1 = require("./middleware/dbHealth");
// Import routes (triggered configuration refresh)
const auth_1 = __importDefault(require("./routes/auth"));
const students_1 = __importDefault(require("./routes/students"));
const teachers_1 = __importDefault(require("./routes/teachers"));
const classes_1 = __importDefault(require("./routes/classes"));
const enquiries_1 = __importDefault(require("./routes/enquiries"));
const tests_1 = __importDefault(require("./routes/tests"));
const homework_1 = __importDefault(require("./routes/homework"));
const fees_1 = __importDefault(require("./routes/fees"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const reports_1 = __importDefault(require("./routes/reports"));
const timetable_1 = __importDefault(require("./routes/timetable"));
const queries_1 = __importDefault(require("./routes/queries"));
const videoLectures_1 = __importDefault(require("./routes/videoLectures"));
const studyMaterials_1 = __importDefault(require("./routes/studyMaterials"));
const settings_1 = __importDefault(require("./routes/settings"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const messages_1 = __importDefault(require("./routes/messages"));
const search_1 = __importDefault(require("./routes/search"));
const coordinators_1 = __importDefault(require("./routes/coordinators"));
const subjects_1 = __importDefault(require("./routes/subjects"));
const app = (0, express_1.default)();
// Security & Middleware
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
// Slow API Request Instrumentation (>200ms)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 200) {
            console.warn(`⚠️  SLOW API [${duration}ms] ${req.method} ${req.originalUrl}`);
        }
    });
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/students', students_1.default);
app.use('/api/teachers', teachers_1.default);
app.use('/api/classes', classes_1.default);
app.use('/api/enquiries', enquiries_1.default);
app.use('/api/tests', tests_1.default);
app.use('/api/homework', homework_1.default);
app.use('/api/fees', fees_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/timetable', timetable_1.default);
app.use('/api/queries', queries_1.default);
app.use('/api/video-lectures', videoLectures_1.default);
app.use('/api/study-materials', studyMaterials_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/search', search_1.default);
app.use('/api/coordinators', coordinators_1.default);
app.use('/api/subjects', subjects_1.default);
// Root Welcome Route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Proton LMS Server API',
        status: 'operational',
        healthCheck: '/api/health'
    });
});
// Health check
app.get('/api/health', dbHealth_1.dbHealthCheck, (req, res) => {
    res.json({
        success: true,
        message: 'Proton LMS API is running',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
// Error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { dbHealthCheck } from './middleware/dbHealth';

// Import routes (triggered configuration refresh)
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import teacherRoutes from './routes/teachers';
import classRoutes from './routes/classes';
import enquiryRoutes from './routes/enquiries';
import testRoutes from './routes/tests';
import homeworkRoutes from './routes/homework';
import feeRoutes from './routes/fees';
import dashboardRoutes from './routes/dashboard';
import permissionsRoutes from './routes/permissions';
import reportsRoutes from './routes/reports';
import timetableRoutes from './routes/timetable';
import queryRoutes from './routes/queries';
import videoLectureRoutes from './routes/videoLectures';
import studyMaterialRoutes from './routes/studyMaterials';
import settingsRoutes from './routes/settings';
import backupRoutes from './routes/backups';
// import notificationRoutes from './routes/notifications';
import attendanceRoutes from './routes/attendance';
import messageRoutes from './routes/messages';
import searchRoutes from './routes/search';
import coordinatorRoutes from './routes/coordinators';
import subjectsRoutes from './routes/subjects';
import hetRoutes from './routes/hets';

// WhatsApp module sub-routers
import whatsappConfigRoutes from './routes/whatsapp/config';
import whatsappTemplateRoutes from './routes/whatsapp/template';
import whatsappMessageRoutes from './routes/whatsapp/message';
import whatsappLogRoutes from './routes/whatsapp/log';
import whatsappWebhookRoutes from './routes/whatsapp/webhook';
import whatsappAutomationRoutes from './routes/whatsapp/automation';
import whatsappDebugRoutes from './routes/whatsapp/debug';

const app = express();

// Security & Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  'https://proton-sms.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
}));

app.options('*', cors() as any);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

app.use(compression());
app.use(morgan('dev'));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/video-lectures', videoLectureRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings/backups', backupRoutes);
// app.use('/api/notifications', notificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/coordinators', coordinatorRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/hets', hetRoutes);

// WhatsApp Router mounts
app.use('/api/whatsapp/config', whatsappConfigRoutes);
app.use('/api/whatsapp/templates', whatsappTemplateRoutes);
app.use('/api/whatsapp/send', whatsappMessageRoutes);
app.use('/api/whatsapp/logs', whatsappLogRoutes);
app.use('/api/whatsapp/webhook', whatsappWebhookRoutes);
app.use('/api/whatsapp/automation', whatsappAutomationRoutes);
app.use('/api/whatsapp/debug', whatsappDebugRoutes);

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
app.get('/api/health', dbHealthCheck, (req, res) => {
  res.json({
    success: true,
    message: 'Proton LMS API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

export default app;

import nodemailer from 'nodemailer';
import { env } from '../../config/env';

// Pooled SMTP configuration for enterprise stability and performance
const transporterConfig: any = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  pool: true, // Use SMTP pooling for efficient connection reuse
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10, // Max 10 messages per second
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  // Ensure Gmail/other custom SMTP connection timeouts are handled safely
  connectionTimeout: 10000, // 10s
  greetingTimeout: 10000,
  socketTimeout: 30000, // 30s
};

// Create the transporter
export const transporter = nodemailer.createTransport(transporterConfig);

// Verify connection on startup (non-blocking)
transporter.verify((error) => {
  if (error) {
    console.error('❌ Mail Service - SMTP connection verification failed:', error.message);
  } else {
    console.log('🚀 Mail Service - SMTP Transporter ready & connection pooled.');
  }
});

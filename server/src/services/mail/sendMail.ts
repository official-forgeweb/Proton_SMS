import EventEmitter from 'events';
import { env } from '../../config/env';
import { transporter } from './transporter';
import { templates } from './templates';
import prisma from '../../config/database';

// Central Event Emitter for Mail notifications to keep routes loosely coupled
export const mailEventEmitter = new EventEmitter();

// In-memory deduplication cache to prevent duplicate operational emails
const deduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds window

/**
 * Checks if a specific mail operation to a recipient is a duplicate within the time window
 */
const isDuplicateMail = (recipient: string, type: string, uniqueId: string = ''): boolean => {
  const key = `${recipient}:${type}:${uniqueId}`;
  const now = Date.now();
  const lastSent = deduplicationCache.get(key);
  if (lastSent && now - lastSent < DEDUPLICATION_WINDOW_MS) {
    return true;
  }
  deduplicationCache.set(key, now);
  
  // Occasional garbage collection of old cache items
  if (deduplicationCache.size > 500) {
    for (const [k, v] of deduplicationCache.entries()) {
      if (now - v >= DEDUPLICATION_WINDOW_MS) {
        deduplicationCache.delete(k);
      }
    }
  }
  return false;
};

interface MailPayload {
  recipientEmail: string;
  type: keyof typeof templates;
  data: any;
  uniqueDeduplicationId?: string; // Optional unique ID for tracking duplicates (e.g. studentId)
}

/**
 * Core Operational Mail Sender.
 * Runs asynchronously and never blocks main ERP execution flows.
 */
export const sendOperationMail = async (payload: MailPayload): Promise<void> => {
  const { recipientEmail, type, data, uniqueDeduplicationId } = payload;

  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.warn(`[Mail Service] Invalid recipient email address skipped: "${recipientEmail}"`);
    return;
  }

  // Deduplication check
  if (isDuplicateMail(recipientEmail, type, uniqueDeduplicationId)) {
    console.log(`[Mail Service] Duplicate email of type "${type}" to "${recipientEmail}" suppressed.`);
    return;
  }

  // Run asynchronously without blocking API response
  setImmediate(async () => {
    let attempts = 0;
    const maxRetries = 2;
    let sent = false;
    let lastError = '';

    // Fetch template
    const templateBuilder = templates[type];
    if (!templateBuilder) {
      console.error(`[Mail Service] Template builder of type "${type}" not found.`);
      return;
    }

    const htmlContent = templateBuilder(data);
    const subjectMap: Record<string, string> = {
      studentWelcome: `Welcome to ${env.APP_NAME} - Your Login Credentials`,
      teacherOnboarding: `Welcome to ${env.APP_NAME} - Onboarding Invitation`,
      coordinatorOnboarding: `Welcome to ${env.APP_NAME} - Coordinator Invitation`,
      feeAssigned: `New Fee Statement Assigned - ${env.APP_NAME}`,
      paymentSuccess: `Payment Confirmation & Receipt Summary - ${env.APP_NAME}`,
      installmentUpdated: `Installment Schedule Adjusted - ${env.APP_NAME}`,
      enquiryResolved: `Enquiry Resolution Notice - ${env.APP_NAME}`,
      timetableUpdated: `Timetable Schedule Changed - ${env.APP_NAME}`,
      passwordReset: `Password Reset Requested - ${env.APP_NAME}`,
    };

    const subject = subjectMap[type] || `Notice from ${env.APP_NAME}`;

    while (attempts <= maxRetries && !sent) {
      try {
        attempts++;
        await transporter.sendMail({
          from: `"${env.FROM_NAME}" <${env.SMTP_FROM}>`,
          to: recipientEmail,
          subject,
          html: htmlContent,
        });
        
        sent = true;
        
        // Log to database asynchronously
        await (prisma as any).emailLog.create({
          data: {
            recipient: recipientEmail,
            mail_type: type,
            status: 'sent',
          }
        }).catch((err: any) => console.error('[Mail Service] Failed to write sent email log:', err.message));
        
        console.log(`✨ [Mail Service] Email of type "${type}" successfully sent to "${recipientEmail}" (Attempt #${attempts})`);
      } catch (err: any) {
        lastError = err.message || 'SMTP Server Error';
        console.error(`❌ [Mail Service] Send failed (Attempt #${attempts}/${maxRetries + 1}):`, lastError);
        
        if (attempts <= maxRetries) {
          // Linear backoff before retry (1s, 2s)
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
      }
    }

    if (!sent) {
      // Log failure to database
      await (prisma as any).emailLog.create({
        data: {
          recipient: recipientEmail,
          mail_type: type,
          status: 'failed',
          failure_reason: lastError,
        }
      }).catch((err: any) => console.error('[Mail Service] Failed to write failed email log:', err.message));
      
      console.error(`🚨 [Mail Service] Permanently failed to deliver "${type}" email to "${recipientEmail}". Error logged.`);
    }
  });
};

// ──────────────────────────────────────────────
// Centralized Event Listeners
// ──────────────────────────────────────────────

mailEventEmitter.on('student.created', (data: { name: string; email: string; proId: string; tempPass: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'studentWelcome',
    data,
    uniqueDeduplicationId: data.proId
  });
});

mailEventEmitter.on('teacher.created', (data: { name: string; email: string; employeeId: string; tempPass: string; role: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'teacherOnboarding',
    data,
    uniqueDeduplicationId: data.employeeId
  });
});

mailEventEmitter.on('coordinator.created', (data: { name: string; email: string; coordinatorId: string; tempPass: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'coordinatorOnboarding',
    data,
    uniqueDeduplicationId: data.coordinatorId
  });
});

mailEventEmitter.on('fee.assigned', (data: { name: string; email: string; amount: number; structureName: string; installments: any[]; studentId: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'feeAssigned',
    data,
    uniqueDeduplicationId: data.studentId
  });
});

mailEventEmitter.on('payment.recorded', (data: { name: string; email: string; amountPaid: number; remainingBalance: number; txRef: string; date: string; studentId: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'paymentSuccess',
    data,
    uniqueDeduplicationId: data.txRef
  });
});

mailEventEmitter.on('installment.updated', (data: { name: string; email: string; amount: number; dueDate: string; installmentId: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'installmentUpdated',
    data,
    uniqueDeduplicationId: data.installmentId
  });
});

mailEventEmitter.on('enquiry.resolved', (data: { name: string; email: string; subject: string; response: string; enquiryId: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'enquiryResolved',
    data,
    uniqueDeduplicationId: data.enquiryId
  });
});

mailEventEmitter.on('timetable.updated', (data: { name: string; email: string; details: string; date: string; scheduleId: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'timetableUpdated',
    data,
    uniqueDeduplicationId: data.scheduleId
  });
});

mailEventEmitter.on('password.reset', (data: { name: string; email: string; resetUrl: string }) => {
  sendOperationMail({
    recipientEmail: data.email,
    type: 'passwordReset',
    data
  });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOperationMail = exports.mailEventEmitter = void 0;
const events_1 = __importDefault(require("events"));
const env_1 = require("../../config/env");
const transporter_1 = require("./transporter");
const templates_1 = require("./templates");
const database_1 = __importDefault(require("../../config/database"));
// Central Event Emitter for Mail notifications to keep routes loosely coupled
exports.mailEventEmitter = new events_1.default();
// In-memory deduplication cache to prevent duplicate operational emails
const deduplicationCache = new Map();
const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds window
/**
 * Checks if a specific mail operation to a recipient is a duplicate within the time window
 */
const isDuplicateMail = (recipient, type, uniqueId = '') => {
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
/**
 * Core Operational Mail Sender.
 * Runs asynchronously and never blocks main ERP execution flows.
 */
const sendOperationMail = async (payload) => {
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
        const templateBuilder = templates_1.templates[type];
        if (!templateBuilder) {
            console.error(`[Mail Service] Template builder of type "${type}" not found.`);
            return;
        }
        const htmlContent = templateBuilder(data);
        const subjectMap = {
            studentWelcome: `Welcome to ${env_1.env.APP_NAME} - Your Login Credentials`,
            teacherOnboarding: `Welcome to ${env_1.env.APP_NAME} - Onboarding Invitation`,
            coordinatorOnboarding: `Welcome to ${env_1.env.APP_NAME} - Coordinator Invitation`,
            feeAssigned: `New Fee Statement Assigned - ${env_1.env.APP_NAME}`,
            paymentSuccess: `Payment Confirmation & Receipt Summary - ${env_1.env.APP_NAME}`,
            installmentUpdated: `Installment Schedule Adjusted - ${env_1.env.APP_NAME}`,
            enquiryResolved: `Enquiry Resolution Notice - ${env_1.env.APP_NAME}`,
            timetableUpdated: `Timetable Schedule Changed - ${env_1.env.APP_NAME}`,
            passwordReset: `Password Reset Requested - ${env_1.env.APP_NAME}`,
        };
        const subject = subjectMap[type] || `Notice from ${env_1.env.APP_NAME}`;
        while (attempts <= maxRetries && !sent) {
            try {
                attempts++;
                await transporter_1.transporter.sendMail({
                    from: `"${env_1.env.FROM_NAME}" <${env_1.env.SMTP_FROM}>`,
                    to: recipientEmail,
                    subject,
                    html: htmlContent,
                });
                sent = true;
                // Log to database asynchronously
                await database_1.default.emailLog.create({
                    data: {
                        recipient: recipientEmail,
                        mail_type: type,
                        status: 'sent',
                    }
                }).catch((err) => console.error('[Mail Service] Failed to write sent email log:', err.message));
                console.log(`✨ [Mail Service] Email of type "${type}" successfully sent to "${recipientEmail}" (Attempt #${attempts})`);
            }
            catch (err) {
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
            await database_1.default.emailLog.create({
                data: {
                    recipient: recipientEmail,
                    mail_type: type,
                    status: 'failed',
                    failure_reason: lastError,
                }
            }).catch((err) => console.error('[Mail Service] Failed to write failed email log:', err.message));
            console.error(`🚨 [Mail Service] Permanently failed to deliver "${type}" email to "${recipientEmail}". Error logged.`);
        }
    });
};
exports.sendOperationMail = sendOperationMail;
// ──────────────────────────────────────────────
// Centralized Event Listeners
// ──────────────────────────────────────────────
exports.mailEventEmitter.on('student.created', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'studentWelcome',
        data,
        uniqueDeduplicationId: data.proId
    });
});
exports.mailEventEmitter.on('teacher.created', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'teacherOnboarding',
        data,
        uniqueDeduplicationId: data.employeeId
    });
});
exports.mailEventEmitter.on('coordinator.created', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'coordinatorOnboarding',
        data,
        uniqueDeduplicationId: data.coordinatorId
    });
});
exports.mailEventEmitter.on('fee.assigned', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'feeAssigned',
        data,
        uniqueDeduplicationId: data.studentId
    });
});
exports.mailEventEmitter.on('payment.recorded', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'paymentSuccess',
        data,
        uniqueDeduplicationId: data.txRef
    });
});
exports.mailEventEmitter.on('installment.updated', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'installmentUpdated',
        data,
        uniqueDeduplicationId: data.installmentId
    });
});
exports.mailEventEmitter.on('enquiry.resolved', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'enquiryResolved',
        data,
        uniqueDeduplicationId: data.enquiryId
    });
});
exports.mailEventEmitter.on('timetable.updated', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'timetableUpdated',
        data,
        uniqueDeduplicationId: data.scheduleId
    });
});
exports.mailEventEmitter.on('password.reset', (data) => {
    (0, exports.sendOperationMail)({
        recipientEmail: data.email,
        type: 'passwordReset',
        data
    });
});
//# sourceMappingURL=sendMail.js.map
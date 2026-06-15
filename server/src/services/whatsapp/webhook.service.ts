import prisma from '../../config/database';
import { mapMetaError } from '../../utils/whatsapp/errorMapper';

/**
 * Main Webhook Entrypoint: parses and dispatches payload.
 * 
 * @param payload Full webhook body from Meta
 */
export async function processWebhookPayload(payload: any) {
  // Create a log entry first for auditing
  const webhookLog = await prisma.whatsAppWebhookLog.create({
    data: {
      event_type: payload.object || 'unknown',
      payload: payload,
      processed: false,
    },
  });

  try {
    if (payload.object !== 'whatsapp_business_account') {
      throw new Error(`Unsupported webhook object type: ${payload.object}`);
    }

    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const value = change.value || {};
        
        // 1. Process Status Updates (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            await processStatusUpdate(status);
          }
        }

        // 2. Process Incoming Messages
        if (value.messages && Array.isArray(value.messages)) {
          const contacts = value.contacts || [];
          for (const message of value.messages) {
            const contact = contacts.find((c: any) => c.wa_id === message.from);
            await processIncomingMessage(message, contact);
          }
        }
      }
    }

    // Mark as processed
    await prisma.whatsAppWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        processed: true,
        processed_at: new Date(),
      },
    });
  } catch (err: any) {
    console.error('[Webhook Service] Failed to process webhook:', err.message);
    await prisma.whatsAppWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        error: err.message || 'Processing failed',
        processed_at: new Date(),
      },
    });
  }
}

/**
 * Dispatches a status notification payload from Meta to the correct handler.
 */
export async function processStatusUpdate(status: any) {
  const statusType = status.status; // sent, delivered, read, failed

  switch (statusType) {
    case 'read':
      await handleMessageRead(status);
      break;
    case 'delivered':
      await handleMessageDelivered(status);
      break;
    case 'failed':
      await handleMessageFailed(status);
      break;
    case 'sent':
      await handleMessageSent(status);
      break;
    default:
      console.warn(`[Webhook Service] Unhandled message status: ${statusType}`);
  }
}

/**
 * Handles incoming messages initiated by users.
 */
export async function processIncomingMessage(message: any, contact: any) {
  const phone = contact?.wa_id || message.from;
  const name = contact?.profile?.name || null;
  const text = message.text?.body || '';
  const messageId = message.id;
  
  const timestampSeconds = parseInt(message.timestamp, 10);
  const sentAt = isNaN(timestampSeconds) ? new Date() : new Date(timestampSeconds * 1000);

  // Identify recipient if they exist in the DB
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { student: { phone } },
        { teacher: { phone } },
        { coordinator: { phone } },
      ],
    },
    select: { id: true, role: true },
  });

  let recipientType = 'CUSTOM';
  let recipientUserId: string | null = null;

  if (user) {
    recipientUserId = user.id;
    recipientType = user.role.toUpperCase();
  }

  await prisma.whatsAppLog.create({
    data: {
      phone,
      recipient_name: name,
      recipient_type: recipientType,
      recipient_user_id: recipientUserId,
      variables: { text },
      meta_message_id: messageId,
      status: 'READ', // Incoming messages are marked as read immediately by default
      direction: 'INCOMING',
      sent_at: sentAt,
      triggered_by: 'WEBHOOK',
    },
  });
}

/**
 * Updates log record to SENT status.
 */
async function handleMessageSent(status: any) {
  const messageId = status.id;
  const timestamp = parseInt(status.timestamp, 10);
  const sentAt = isNaN(timestamp) ? new Date() : new Date(timestamp * 1000);

  // Only update if current status is PENDING to avoid overwriting higher statuses (delivered/read)
  const log = await prisma.whatsAppLog.findUnique({
    where: { meta_message_id: messageId },
  });

  if (log && log.status === 'PENDING') {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        sent_at: sentAt,
      },
    });
  }
}

/**
 * Updates log record to DELIVERED status.
 */
export async function handleMessageDelivered(status: any) {
  const messageId = status.id;
  const timestamp = parseInt(status.timestamp, 10);
  const deliveredAt = isNaN(timestamp) ? new Date() : new Date(timestamp * 1000);

  const log = await prisma.whatsAppLog.findUnique({
    where: { meta_message_id: messageId },
  });

  if (log && log.status !== 'READ') {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'DELIVERED',
        delivered_at: deliveredAt,
      },
    });
  }
}

/**
 * Updates log record to READ status.
 */
export async function handleMessageRead(status: any) {
  const messageId = status.id;
  const timestamp = parseInt(status.timestamp, 10);
  const readAt = isNaN(timestamp) ? new Date() : new Date(timestamp * 1000);

  const log = await prisma.whatsAppLog.findUnique({
    where: { meta_message_id: messageId },
  });

  if (log) {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'READ',
        read_at: readAt,
      },
    });
  }
}

/**
 * Updates log record to FAILED status and logs details.
 */
export async function handleMessageFailed(status: any) {
  const messageId = status.id;
  const timestamp = parseInt(status.timestamp, 10);
  const failedAt = isNaN(timestamp) ? new Date() : new Date(timestamp * 1000);
  
  const errorObj = status.errors?.[0] || {};
  const errorCode = errorObj.code ? String(errorObj.code) : 'UNKNOWN';
  
  const localErr = mapMetaError(errorCode, errorObj.message);

  const log = await prisma.whatsAppLog.findUnique({
    where: { meta_message_id: messageId },
  });

  if (log) {
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        failed_at: failedAt,
        error_code: errorCode,
        error_message: localErr.message,
      },
    });
  }
}

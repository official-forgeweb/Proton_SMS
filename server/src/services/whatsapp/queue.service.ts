import { sendTemplateMessage, MessageMeta } from './whatsapp.service';

export interface QueuedMessage {
  phone: string;
  templateName: string;
  variables: string[];
  meta?: MessageMeta;
  retryCount: number;
}

const queue: QueuedMessage[] = [];
const MAX_QUEUE_SIZE = 1000;
let isPaused = false;
let isProcessing = false;

/**
 * Adds an array of messages to the bulk sending queue.
 * Starts queue processing immediately (non-blocking).
 * 
 * @param messages Array of message objects
 */
export function addToQueue(
  messages: Array<{
    phone: string;
    templateName: string;
    variables: string[];
    meta?: MessageMeta;
  }>
) {
  if (queue.length + messages.length > MAX_QUEUE_SIZE) {
    throw new Error(`Queue capacity exceeded. Max queue size is ${MAX_QUEUE_SIZE}.`);
  }

  messages.forEach((msg) => {
    queue.push({
      phone: msg.phone,
      templateName: msg.templateName,
      variables: msg.variables,
      meta: msg.meta,
      retryCount: 0, // Track retries
    });
  });

  // Trigger queue processing asynchronously (non-blocking)
  processQueue().catch((err) => console.error('Queue processing error:', err));

  return {
    success: true,
    added: messages.length,
    currentQueueSize: queue.length,
  };
}

/**
 * Processes the queue sequentially with a 1-second delay between messages.
 */
export async function processQueue() {
  if (isPaused || isProcessing || queue.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    while (queue.length > 0 && !isPaused) {
      const msg = queue.shift();
      if (!msg) continue;

      try {
        const result = await sendTemplateMessage(msg.phone, msg.templateName, msg.variables, msg.meta);
        
        if (!result.success) {
          // Auto-retry failed messages once
          if (msg.retryCount === 0) {
            msg.retryCount = 1;
            // Push to the back of the queue
            queue.push(msg);
            console.log(`[Queue] Message to ${msg.phone} failed, scheduling retry.`);
          } else {
            console.error(`[Queue] Message to ${msg.phone} failed twice, discarding.`);
          }
        }
      } catch (error) {
        console.error(`[Queue] Failed to process message to ${msg.phone}:`, error);
      }

      // Respect the 1-second delay requirement between messages
      if (queue.length > 0 && !isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Returns current status of the queue.
 */
export function getQueueStatus() {
  return {
    pendingCount: queue.length,
    isPaused,
    isProcessing,
    maxSize: MAX_QUEUE_SIZE,
  };
}

/**
 * Pauses the queue. Ongoing sends are completed, but no new ones are processed.
 */
export function pauseQueue() {
  isPaused = true;
  return { success: true, status: getQueueStatus() };
}

/**
 * Resumes queue processing.
 */
export function resumeQueue() {
  isPaused = false;
  processQueue().catch((err) => console.error('Error resuming queue:', err));
  return { success: true, status: getQueueStatus() };
}

/**
 * Clears all messages from the queue.
 */
export function clearQueue() {
  queue.length = 0;
  return { success: true, status: getQueueStatus() };
}

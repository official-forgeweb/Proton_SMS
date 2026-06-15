import cron from 'node-cron';
import prisma from '../config/database';
import {
  scheduledClassReminder,
  scheduledFeeReminder,
} from '../services/whatsapp/automation.service';
import { processQueue } from '../services/whatsapp/queue.service';
import { syncAllFromMeta } from '../services/whatsapp/template.service';

/**
 * Sends the next week's schedule summary to students.
 * Scheduled for Sunday at 6:00 PM.
 */
async function sendWeeklyTimetableCron() {
  console.log('⏰ [Cron] Executing Sunday 6:00 PM next week timetable reminders...');
  try {
    const rule = await prisma.whatsAppAutomationRule.findFirst({
      where: { trigger_event: 'TIMETABLE_CREATED', is_active: true },
      include: { template: true },
    });

    if (!rule || !rule.template) {
      console.log('⏰ [Cron] Weekly timetable rule is inactive or missing template. Skipping.');
      return;
    }

    const now = new Date();
    
    // Calculate dates for next week (Monday to Sunday)
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const mondayStr = nextMonday.toISOString().split('T')[0];
    const sundayStr = nextSunday.toISOString().split('T')[0];
    const weekDatesStr = `${mondayStr} to ${sundayStr}`;

    const classes = await prisma.class.findMany({
      where: { status: 'ongoing' },
      include: {
        student_enrollments: {
          where: { enrollment_status: 'active' },
          include: { student: true },
        },
      },
    });

    for (const cls of classes) {
      const sessions = await prisma.timetable.findMany({
        where: {
          class_id: cls.id,
          date: { gte: mondayStr, lte: sundayStr },
          status: 'scheduled',
        },
        include: { subject: true },
        orderBy: { date: 'asc' },
      });

      if (sessions.length === 0) continue;

      const scheduleSummary = sessions
        .map((s) => `${s.date} at ${s.start_time} (${s.subject?.canonical_name || 'Class'})`)
        .join(', ');

      const queueMessages = cls.student_enrollments
        .filter((e) => e.student && (e.student.phone || e.student.father_phone))
        .map((e) => {
          const name = `${e.student.first_name || ''} ${e.student.last_name || ''}`.trim() || 'Student';
          return {
            phone: e.student.phone || e.student.father_phone || '',
            templateName: rule.template.name,
            variables: [name, weekDatesStr, scheduleSummary],
            meta: {
              recipientName: name,
              recipientType: 'STUDENT' as const,
              recipientUserId: e.student.user_id,
              triggeredBy: 'AUTOMATION' as const,
              automationType: 'WEEKLY_TIMETABLE',
            },
          };
        });

      if (queueMessages.length > 0) {
        const { addToQueue } = require('../services/whatsapp/queue.service');
        addToQueue(queueMessages);
      }
    }
  } catch (error) {
    console.error('⏰ [Cron] Weekly timetable reminder failed:', error);
  }
}

/**
 * Initializes and schedules all background WhatsApp tasks.
 */
export function initWhatsAppCrons() {
  console.log('🔌 [WhatsApp Cron] Initializing scheduled tasks...');

  // 1. Daily 8:00 AM -> Class reminders for today
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Cron] Starting daily 8:00 AM class reminders...');
    try {
      await scheduledClassReminder();
    } catch (err) {
      console.error('⏰ [Cron] Daily class reminder failed:', err);
    }
  });

  // 2. Monday 9:00 AM -> Fee reminders to pending/overdue students
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ [Cron] Starting Monday 9:00 AM fee reminders...');
    try {
      await scheduledFeeReminder();
    } catch (err) {
      console.error('⏰ [Cron] Fee reminder cron failed:', err);
    }
  });

  // 3. Sunday 6:00 PM -> Send next week's timetable
  cron.schedule('0 18 * * 0', async () => {
    try {
      await sendWeeklyTimetableCron();
    } catch (err) {
      console.error('⏰ [Cron] Next week timetable cron failed:', err);
    }
  });

  // 4. Daily 12:00 AM -> Reset daily message counter
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Cron] Executing daily 12:00 AM message counter reset...');
    try {
      await prisma.whatsAppConfig.update({
        where: { id: 'global' },
        data: {
          daily_counter: 0,
          last_reset_date: new Date(),
        },
      });
      console.log('⏰ [Cron] Message limit reset successfully.');
    } catch (err) {
      console.error('⏰ [Cron] Counter reset failed:', err);
    }
  });

  // 5. Every 10 minutes -> Process pending queue (failsafe)
  cron.schedule('*/10 * * * *', async () => {
    try {
      await processQueue();
    } catch (err) {
      console.error('⏰ [Cron] Failsafe queue processor failed:', err);
    }
  });

  // 6. Daily 2:00 AM -> Sync template statuses with Meta
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [Cron] Starting daily 2:00 AM Meta template sync...');
    try {
      await syncAllFromMeta();
    } catch (err) {
      console.error('⏰ [Cron] Meta templates sync failed:', err);
    }
  });

  console.log('✅ [WhatsApp Cron] All scheduled jobs active.');
}

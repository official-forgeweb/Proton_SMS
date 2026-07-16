import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import * as whatsappService from '../services/whatsapp.service';

const prisma = new PrismaClient();

/**
 * Initializes all CRON jobs for WhatsApp automated messaging
 */
export function initWhatsAppCronJobs() {
  console.log('⏰ Initializing WhatsApp Cron Jobs...');

  // FEATURE 2: Fee Reminder to Parents (Runs daily at 9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ [CRON RUN] Triggering Daily WhatsApp Fee Reminders (9:00 AM)...');
    try {
      const now = new Date();
      const SevenDaysLater = new Date();
      SevenDaysLater.setDate(now.getDate() + 7);

      const targetDueDateStr = SevenDaysLater.toISOString().split('T')[0];

      const pendingInstallments = await prisma.feeInstallment.findMany({
        where: {
          status: { in: ['upcoming', 'due', 'partially_paid'] },
          due_date: { lte: targetDueDateStr },
          is_deleted: false
        },
        include: {
          assignment: {
            include: {
              student: true
            }
          }
        }
      });

      console.log(`📋 Found ${pendingInstallments.length} pending fee installments due within 7 days.`);

      for (const item of pendingInstallments) {
        const student = item.assignment?.student;
        if (!student) continue;

        const recipientPhone = student.father_phone || student.mother_phone || student.phone || process.env.TEST_PHONE_NUMBER;
        const parentName = student.father_name || student.mother_name || 'Parent / Guardian';

        await whatsappService.sendFeeReminder({
          to: recipientPhone || undefined,
          parentName: parentName,
          studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student',
          courseName: 'Academic Program',
          feeType: `Installment #${item.installment_number}`,
          amountDue: item.amount - item.paid_amount,
          dueDate: item.due_date,
          paymentLink: `${process.env.VERCEL_APP_URL || 'https://your-app.vercel.app'}/fees`
        });
      }
    } catch (err: any) {
      console.error('❌ Daily Fee Reminder Cron Error:', err.message);
    }
  });

  // FEATURE 5: Weekly Timetable Notification (Runs every Monday at 7:00 AM)
  cron.schedule('0 7 * * 1', async () => {
    console.log('⏰ [CRON RUN] Triggering Weekly WhatsApp Timetable (Monday 7:00 AM)...');
    try {
      const activeStudents = await prisma.student.findMany({
        where: { academic_status: 'active' },
        take: 50
      });

      const today = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(today.getDate() + 6);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endOfWeek.toISOString().split('T')[0];

      console.log(`📋 Dispatching timetable to ${activeStudents.length} active students.`);

      for (const student of activeStudents) {
        const targetPhone = student.phone || student.father_phone || process.env.TEST_PHONE_NUMBER;

        await whatsappService.sendWeeklyTimetable({
          to: targetPhone || undefined,
          studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student',
          batchName: 'Standard Science / Commerce Batch',
          weekNumber: 'CurrWeek',
          startDate: startDateStr,
          endDate: endDateStr,
          pdfUrl: `${process.env.VERCEL_APP_URL || 'https://your-app.vercel.app'}/sample-timetable.pdf`
        });
      }
    } catch (err: any) {
      console.error('❌ Weekly Timetable Cron Error:', err.message);
    }
  });

  console.log('✅ WhatsApp Cron Jobs successfully scheduled (Daily 9 AM Fee Reminder & Monday 7 AM Timetable).');
}

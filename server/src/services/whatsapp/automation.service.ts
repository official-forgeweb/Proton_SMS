import prisma from '../../config/database';
import { sendTemplateMessage } from './whatsapp.service';
import { addToQueue } from './queue.service';

const CLIENT_PORTAL_URL = process.env.CLIENT_URL || 'http://localhost:3000';

interface RuleCheckResult {
  isActive: boolean;
  templateName?: string;
}

/**
 * Helper to check if an automation rule is active and get its linked template name.
 */
async function getActiveRuleTemplate(triggerEvent: string): Promise<RuleCheckResult> {
  try {
    const rule = await prisma.whatsAppAutomationRule.findFirst({
      where: { trigger_event: triggerEvent, is_active: true },
      include: { template: true },
    });

    if (!rule || !rule.template || rule.template.status !== 'APPROVED') {
      // In mock mode, we allow drafts/pending templates to run for testing purposes
      const mockCheck = await prisma.whatsAppConfig.findUnique({ where: { id: 'global' } });
      const allowTesting = mockCheck?.is_mock_mode || !mockCheck?.is_active;
      
      if (rule && rule.template && allowTesting) {
        return { isActive: true, templateName: rule.template.name };
      }
      
      return { isActive: false };
    }

    return { isActive: true, templateName: rule.template.name };
  } catch (error) {
    console.error(`Error checking rule for event ${triggerEvent}:`, error);
    return { isActive: false };
  }
}

/**
 * Formats a student's full name.
 */
function getStudentName(student: any): string {
  return `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
}

/**
 * Triggered when a new student is created.
 */
export async function onStudentCreated(student: any, tempPassword?: string) {
  try {
    const rule = await getActiveRuleTemplate('STUDENT_CREATED');
    if (!rule.isActive || !rule.templateName) return;

    const phone = student.phone || student.father_phone || student.mother_phone;
    if (!phone) return;

    const name = getStudentName(student);
    const email = student.email || '';
    const password = tempPassword || 'Proton@123';
    const portalUrl = `${CLIENT_PORTAL_URL}/login`;

    await sendTemplateMessage(
      phone,
      rule.templateName,
      [name, email, password, portalUrl],
      {
        recipientName: name,
        recipientType: 'STUDENT',
        recipientUserId: student.user_id,
        triggeredBy: 'AUTOMATION',
        automationType: 'WELCOME_STUDENT',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending welcome student WhatsApp:', error);
  }
}

/**
 * Triggered when a new teacher is created.
 */
export async function onTeacherCreated(teacher: any, tempPassword?: string) {
  try {
    const rule = await getActiveRuleTemplate('TEACHER_CREATED');
    if (!rule.isActive || !rule.templateName) return;

    if (!teacher.phone) return;

    const name = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
    const email = teacher.email || '';
    const password = tempPassword || 'Proton@123';
    const portalUrl = `${CLIENT_PORTAL_URL}/login`;

    await sendTemplateMessage(
      teacher.phone,
      rule.templateName,
      [name, email, password, portalUrl],
      {
        recipientName: name,
        recipientType: 'TEACHER',
        recipientUserId: teacher.user_id,
        triggeredBy: 'AUTOMATION',
        automationType: 'WELCOME_TEACHER',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending welcome teacher WhatsApp:', error);
  }
}

/**
 * Triggered when a new coordinator is created.
 */
export async function onCoordinatorCreated(coordinator: any, tempPassword?: string) {
  try {
    const rule = await getActiveRuleTemplate('COORDINATOR_CREATED');
    if (!rule.isActive || !rule.templateName) return;

    if (!coordinator.phone) return;

    const name = coordinator.full_name || 'Coordinator';
    const email = coordinator.email || '';
    const password = tempPassword || 'Proton@123';
    const portalUrl = `${CLIENT_PORTAL_URL}/login`;

    await sendTemplateMessage(
      coordinator.phone,
      rule.templateName,
      [name, email, password, portalUrl],
      {
        recipientName: name,
        recipientType: 'COORDINATOR',
        recipientUserId: coordinator.user_id,
        triggeredBy: 'AUTOMATION',
        automationType: 'WELCOME_COORDINATOR',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending welcome coordinator WhatsApp:', error);
  }
}

/**
 * Triggered when a class schedule/timetable entry is created.
 * Sends weekly timetable updates to all students in the batch.
 */
export async function onTimetableCreated(timetable: any) {
  try {
    const rule = await getActiveRuleTemplate('TIMETABLE_CREATED');
    if (!rule.isActive || !rule.templateName) return;

    // Fetch enrolled students
    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: timetable.class_id, enrollment_status: 'active' },
      include: { student: true },
    });

    const subject = await prisma.subject.findUnique({ where: { id: timetable.subject_id } });
    const classRecord = await prisma.class.findUnique({ where: { id: timetable.class_id } });

    const scheduleSummary = `${subject?.canonical_name || 'Class'} scheduled on ${timetable.date} at ${timetable.start_time} in Room ${timetable.room || 'N/A'}`;
    const weekDates = timetable.date;

    const queueMessages = enrollments
      .filter((e) => e.student && (e.student.phone || e.student.father_phone))
      .map((e) => {
        const student = e.student;
        const name = getStudentName(student);
        const destPhone = student.phone || student.father_phone || '';
        return {
          phone: destPhone,
          templateName: rule.templateName!,
          variables: [name, weekDates, scheduleSummary],
          meta: {
            recipientName: name,
            recipientType: 'STUDENT' as const,
            recipientUserId: student.user_id,
            triggeredBy: 'AUTOMATION' as const,
            automationType: 'WEEKLY_TIMETABLE',
          },
        };
      });

    if (queueMessages.length > 0) {
      addToQueue(queueMessages);
    }
  } catch (error) {
    console.error('[Automation] Error scheduling timetable updates:', error);
  }
}

/**
 * Sends timetable schedule updates directly to the teacher.
 */
export async function onTeacherScheduleCreated(schedule: any, teacher: any) {
  try {
    const rule = await getActiveRuleTemplate('TEACHER_SCHEDULE_CREATED');
    if (!rule.isActive || !rule.templateName) return;

    const phone = teacher.phone;
    if (!phone) return;

    const name = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
    const date = schedule.date || 'Multiple Dates';
    const subject = schedule.subject || 'Class Session';
    const timing = `${schedule.start_time || ''} - ${schedule.end_time || ''}`;

    await sendTemplateMessage(
      phone,
      rule.templateName,
      [name, date, subject, timing],
      {
        recipientName: name,
        recipientType: 'TEACHER',
        recipientUserId: teacher.user_id,
        triggeredBy: 'AUTOMATION',
        automationType: 'TEACHER_SCHEDULE',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending teacher schedule WhatsApp:', error);
  }
}

/**
 * Triggered when a new test/exam is scheduled.
 * Alerts all enrolled students.
 */
export async function onTestScheduled(test: any) {
  try {
    const rule = await getActiveRuleTemplate('TEST_SCHEDULED');
    if (!rule.isActive || !rule.templateName) return;

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: test.class_id, enrollment_status: 'active' },
      include: { student: true },
    });

    const subject = test.subject_id
      ? await prisma.subject.findUnique({ where: { id: test.subject_id } })
      : null;

    const subjectName = subject?.canonical_name || 'General';
    const testName = test.test_name || 'Upcoming Exam';
    const date = test.test_date || 'N/A';
    const time = test.start_time || 'N/A';
    const room = 'Examination Hall';

    const queueMessages = enrollments
      .filter((e) => e.student && (e.student.phone || e.student.father_phone))
      .map((e) => {
        const student = e.student;
        const name = getStudentName(student);
        const destPhone = student.phone || student.father_phone || '';
        return {
          phone: destPhone,
          templateName: rule.templateName!,
          variables: [name, `${testName} (${subjectName})`, date, time, room],
          meta: {
            recipientName: name,
            recipientType: 'STUDENT' as const,
            recipientUserId: student.user_id,
            triggeredBy: 'AUTOMATION' as const,
            automationType: 'TEST_SCHEDULE',
          },
        };
      });

    if (queueMessages.length > 0) {
      addToQueue(queueMessages);
    }
  } catch (error) {
    console.error('[Automation] Error enqueuing test alert WhatsApp messages:', error);
  }
}

/**
 * Triggered when a query/ticket is raised.
 * Sends alert to assigned coordinator or administrator.
 */
export async function onQueryRaised(query: any, student: any) {
  try {
    const rule = await getActiveRuleTemplate('QUERY_RAISED');
    if (!rule.isActive || !rule.templateName) return;

    let adminPhone = '';
    let adminName = 'Administrator';
    let adminUserId = '';

    if (query.assigned_to) {
      const coord = await prisma.coordinator.findUnique({
        where: { user_id: query.assigned_to },
      });
      if (coord && coord.phone) {
        adminPhone = coord.phone;
        adminName = coord.full_name || 'Coordinator';
        adminUserId = query.assigned_to;
      }
    }

    if (!adminPhone) {
      // Fallback to global settings phone number if no admin/coord is assigned
      const settings = await prisma.systemSetting.findUnique({ where: { id: 'global' } });
      if (settings && settings.phone_number) {
        adminPhone = settings.phone_number;
      }
    }

    if (!adminPhone) return;

    const studentName = getStudentName(student);
    const subject = query.query_type || 'Support Query';
    const priority = query.priority || 'medium';
    const queryText = (query.description || '').substring(0, 100);

    await sendTemplateMessage(
      adminPhone,
      rule.templateName,
      [studentName, subject, priority.toUpperCase(), queryText],
      {
        recipientName: adminName,
        recipientType: 'COORDINATOR',
        recipientUserId: adminUserId || undefined,
        triggeredBy: 'AUTOMATION',
        automationType: 'QUERY_RAISED_ALERT',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending query alert WhatsApp:', error);
  }
}

/**
 * Triggered when a response is posted on a student query.
 */
export async function onQueryResponded(query: any, responseText: string, responderName: string) {
  try {
    const rule = await getActiveRuleTemplate('QUERY_RESPONDED');
    if (!rule.isActive || !rule.templateName) return;

    const student = await prisma.student.findUnique({ where: { id: query.student_id } });
    if (!student || !student.phone) return;

    const name = getStudentName(student);
    const querySubject = query.query_type || 'Support Query';
    const truncatedResponse = responseText.substring(0, 100);

    await sendTemplateMessage(
      student.phone,
      rule.templateName,
      [name, querySubject, truncatedResponse, responderName],
      {
        recipientName: name,
        recipientType: 'STUDENT',
        recipientUserId: student.user_id,
        triggeredBy: 'AUTOMATION',
        automationType: 'QUERY_RESPONSE',
      }
    );
  } catch (error) {
    console.error('[Automation] Error sending query response WhatsApp:', error);
  }
}

/**
 * Cron trigger: sends fee reminders to students with outstanding balances.
 * Scheduled to run on Mondays at 9:00 AM.
 */
export async function scheduledFeeReminder() {
  try {
    const rule = await getActiveRuleTemplate('FEE_REMINDER_CRON');
    if (!rule.isActive || !rule.templateName) return;

    const outstandingPayments = await prisma.studentFeeAssignment.findMany({
      where: {
        payment_status: { in: ['pending', 'overdue', 'partial'] },
      },
      include: {
        student: true,
      },
    });

    const queueMessages = outstandingPayments
      .filter((fa) => fa.student && (fa.student.phone || fa.student.father_phone))
      .map((fa) => {
        const student = fa.student;
        const name = getStudentName(student);
        const phone = student.phone || student.father_phone || '';
        
        const totalPending = fa.total_pending || 0;
        const amountStr = `INR ${totalPending}`;
        const dueDate = fa.start_date || 'N/A'; // Or install dates
        const paymentLink = `${CLIENT_PORTAL_URL}/student/fees`;

        return {
          phone,
          templateName: rule.templateName!,
          variables: [name, amountStr, dueDate, paymentLink],
          meta: {
            recipientName: name,
            recipientType: 'STUDENT' as const,
            recipientUserId: student.user_id,
            triggeredBy: 'AUTOMATION' as const,
            automationType: 'FEE_REMINDER',
          },
        };
      });

    if (queueMessages.length > 0) {
      addToQueue(queueMessages);
      console.log(`[Automation] Enqueued ${queueMessages.length} fee reminders.`);
    }
  } catch (error) {
    console.error('[Automation] Fee reminder automated cron job failed:', error);
  }
}

/**
 * Cron trigger: sends class reminders for today.
 * Scheduled to run daily at 8:00 AM.
 */
export async function scheduledClassReminder() {
  try {
    const rule = await getActiveRuleTemplate('CLASS_REMINDER_CRON');
    if (!rule.isActive || !rule.templateName) return;

    const today = new Date();
    // YYYY-MM-DD format local
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const todaySessions = await prisma.timetable.findMany({
      where: { date: todayStr, status: 'scheduled' },
      include: {
        class_ref: {
          include: {
            student_enrollments: {
              where: { enrollment_status: 'active' },
              include: { student: true },
            },
          },
        },
        subject: true,
        teacher: true,
      },
    });

    const queueMessages: any[] = [];

    todaySessions.forEach((session) => {
      const subjectName = session.subject?.canonical_name || 'Class';
      const time = session.start_time;
      const room = session.room || 'N/A';
      const teacherName = session.teacher 
        ? `${session.teacher.first_name || ''} ${session.teacher.last_name || ''}`.trim()
        : 'Instructor';

      const enrollments = session.class_ref?.student_enrollments || [];
      enrollments.forEach((enrollment) => {
        const student = enrollment.student;
        if (student && (student.phone || student.father_phone)) {
          const name = getStudentName(student);
          const phone = student.phone || student.father_phone || '';
          queueMessages.push({
            phone,
            templateName: rule.templateName!,
            variables: [name, subjectName, time, teacherName, room],
            meta: {
              recipientName: name,
              recipientType: 'STUDENT',
              recipientUserId: student.user_id,
              triggeredBy: 'AUTOMATION',
              automationType: 'CLASS_REMINDER',
            },
          });
        }
      });
    });

    if (queueMessages.length > 0) {
      addToQueue(queueMessages);
      console.log(`[Automation] Enqueued ${queueMessages.length} daily class reminders.`);
    }
  } catch (error) {
    console.error('[Automation] Daily class reminder automated cron job failed:', error);
  }
}

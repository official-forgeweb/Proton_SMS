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
      .filter((e) => e.student && (e.student.phone || (e.student as any).father_phone))
      .map((e) => {
        const student = e.student as any;
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
 * Triggered when batch timetable auto-generation completes for classes.
 * Sends weekly timetable notification to students and teachers of each target class.
 */
export async function onWeeklyTimetableGenerated(classIds: string[], startDate: string, endDate: string) {
  try {
    const studentRule = await getActiveRuleTemplate('TIMETABLE_CREATED');
    const teacherRule = await getActiveRuleTemplate('TEACHER_SCHEDULE_CREATED');

    for (const classId of classIds) {
      const classRecord = await prisma.class.findUnique({ where: { id: classId } });
      const className = classRecord?.class_name || 'Class';

      // 1. Queue messages for Enrolled Students
      if (studentRule.isActive && studentRule.templateName) {
        const enrollments = await prisma.studentClassEnrollment.findMany({
          where: { class_id: classId, enrollment_status: 'active' },
          include: { student: true },
        });

        const studentMessages = enrollments
          .filter((e) => e.student && (e.student.phone || (e.student as any).father_phone))
          .map((e) => {
            const student = e.student as any;
            const name = getStudentName(student);
            const phone = student.phone || student.father_phone || '';
            return {
              phone,
              templateName: studentRule.templateName!,
              variables: [name, `${startDate} to ${endDate}`, `Batch: ${className}`],
              meta: {
                recipientName: name,
                recipientType: 'STUDENT' as const,
                recipientUserId: student.user_id,
                triggeredBy: 'AUTOMATION' as const,
                automationType: 'WEEKLY_TIMETABLE',
              },
            };
          });

        if (studentMessages.length > 0) {
          addToQueue(studentMessages);
        }
      }

      // 2. Queue messages for Assigned Teachers
      if (teacherRule.isActive && teacherRule.templateName) {
        const entries = await prisma.timetable.findMany({
          where: { class_id: classId, date: { gte: startDate, lte: endDate }, teacher_id: { not: null } },
          include: { teacher: true, subject: true },
        });

        const teacherMap = new Map<string, any>();
        entries.forEach((entry) => {
          if (entry.teacher && entry.teacher.phone) {
            teacherMap.set(entry.teacher.id, entry.teacher);
          }
        });

        const teacherMessages: Array<any> = [];
        teacherMap.forEach((teacher) => {
          const tName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
          teacherMessages.push({
            phone: teacher.phone,
            templateName: teacherRule.templateName!,
            variables: [tName, `${startDate} to ${endDate}`, `Class: ${className}`, `See portal for period details`],
            meta: {
              recipientName: tName,
              recipientType: 'TEACHER' as const,
              recipientUserId: teacher.user_id,
              triggeredBy: 'AUTOMATION' as const,
              automationType: 'TEACHER_SCHEDULE',
            },
          });
        });

        if (teacherMessages.length > 0) {
          addToQueue(teacherMessages);
        }
      }
    }
  } catch (error) {
    console.error('[Automation] Error triggering batch timetable WhatsApp notifications:', error);
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
      .filter((e) => e.student && (e.student.phone || (e.student as any).father_phone))
      .map((e) => {
        const student = e.student as any;
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
      .filter((fa) => fa.student && (fa.student.phone || (fa.student as any).father_phone))
      .map((fa) => {
        const student = fa.student as any;
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
        const student = enrollment.student as any;
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

/**
 * Triggered when new study material is uploaded.
 * Sends WhatsApp notification to all enrolled students in the class.
 */
export async function onStudyMaterialCreated(material: any) {
  try {
    if (!material.class_id) return;

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: material.class_id, enrollment_status: 'active' },
      include: { student: true },
    });

    const subject = material.subject_id
      ? await prisma.subject.findUnique({ where: { id: material.subject_id } })
      : null;

    const subjectName = subject?.canonical_name || 'General';
    const topicName = material.title || 'Study Material';
    const materialUrl = material.pdf_url || '';

    let uploaderName = 'Teacher';
    if (material.uploaded_by) {
      const uploaderUser = await prisma.user.findUnique({
        where: { id: material.uploaded_by },
        include: { teacher: true, coordinator: true }
      });
      if (uploaderUser?.teacher) {
        uploaderName = `${uploaderUser.teacher.first_name || ''} ${uploaderUser.teacher.last_name || ''}`.trim();
      } else if (uploaderUser?.coordinator) {
        uploaderName = uploaderUser.coordinator.full_name || 'Coordinator';
      }
    }

    const { sendStudyMaterialNotification } = require('../whatsapp.service');

    for (const enrollment of enrollments) {
      const student = enrollment.student as any;
      if (student && (student.phone || student.father_phone)) {
        const destPhone = student.phone || student.father_phone;
        const studentName = getStudentName(student);
        await sendStudyMaterialNotification({
          to: destPhone,
          studentName,
          subjectName,
          topicName,
          materialUrl,
          uploadedBy: uploaderName
        }).catch((err: any) => console.error('Error sending study material WhatsApp:', err));
      }
    }
  } catch (error) {
    console.error('[Automation] Error sending study material WhatsApp:', error);
  }
}

/**
 * Triggered when a new video lecture is created.
 * Sends WhatsApp notification to all enrolled students in the class.
 */
export async function onVideoLectureCreated(lecture: any) {
  try {
    if (!lecture.class_id) return;

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: lecture.class_id, enrollment_status: 'active' },
      include: { student: true },
    });

    const subject = lecture.subject_id
      ? await prisma.subject.findUnique({ where: { id: lecture.subject_id } })
      : null;

    const subjectName = subject?.canonical_name || 'General';
    const lectureTitle = lecture.title || 'Video Lecture';
    const videoUrl = lecture.video_url || '';

    let instructorName = 'Instructor';
    if (lecture.uploaded_by) {
      const uploaderUser = await prisma.user.findUnique({
        where: { id: lecture.uploaded_by },
        include: { teacher: true, coordinator: true }
      });
      if (uploaderUser?.teacher) {
        instructorName = `${uploaderUser.teacher.first_name || ''} ${uploaderUser.teacher.last_name || ''}`.trim();
      } else if (uploaderUser?.coordinator) {
        instructorName = uploaderUser.coordinator.full_name || 'Coordinator';
      }
    }

    const { sendVideoLectureNotification } = require('../whatsapp.service');

    for (const enrollment of enrollments) {
      const student = enrollment.student as any;
      if (student && (student.phone || student.father_phone)) {
        const destPhone = student.phone || student.father_phone;
        const studentName = getStudentName(student);
        await sendVideoLectureNotification({
          to: destPhone,
          studentName,
          subjectName,
          lectureTitle,
          videoUrl,
          instructorName
        }).catch((err: any) => console.error('Error sending video lecture WhatsApp:', err));
      }
    }
  } catch (error) {
    console.error('[Automation] Error sending video lecture WhatsApp:', error);
  }
}

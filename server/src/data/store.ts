import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export const seedData = async (): Promise<void> => {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@protoncoaching.com' },
    });

    if (!adminExists) {
      console.log('🌱 Seeding initial demo data to PostgreSQL...');
      const salt = await bcrypt.genSalt(10);

      // 1. Create Default Admin
      await prisma.user.create({
        data: {
          email: 'admin@protoncoaching.com',
          password_hash: await bcrypt.hash('Admin@123', salt),
          role: 'admin',
          is_active: true,
          is_verified: true,
        },
      });

      console.log('✅ Admin account seeded successfully!');
    } else {
      console.log('✅ Database already contains an Admin. Skipping core seeding.');
    }

    // Seed default WhatsApp templates and automation rules if not already present
    const templatesCount = await prisma.whatsAppTemplate.count();
    if (templatesCount === 0) {
      console.log('🌱 Seeding 10 default WhatsApp templates and automation rules...');

      const defaultTemplates = [
        {
          name: 'welcome_student',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, welcome to Proton! Your portal username is {{2}} and password is {{3}}. Access your account at {{4}}.',
          variables_description: ['Student Name', 'Username/Email', 'Temporary Password', 'Portal URL'],
          sample_values: ['John Doe', 'john.doe@proton.com', 'Proton@1234', 'https://protoncoaching.com/login']
        },
        {
          name: 'welcome_teacher',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, welcome to the Proton faculty! Your portal username is {{2}} and password is {{3}}. Access your dashboard at {{4}}.',
          variables_description: ['Teacher Name', 'Username/Email', 'Temporary Password', 'Portal URL'],
          sample_values: ['Jane Smith', 'jane.smith@proton.com', 'Proton@1234', 'https://protoncoaching.com/login']
        },
        {
          name: 'welcome_coordinator',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, welcome to the Proton coordinator team! Your portal username is {{2}} and password is {{3}}. Access your dashboard at {{4}}.',
          variables_description: ['Coordinator Name', 'Username/Email', 'Temporary Password', 'Portal URL'],
          sample_values: ['Jack Sparrow', 'jack@proton.com', 'Proton@1234', 'https://protoncoaching.com/login']
        },
        {
          name: 'weekly_timetable',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, here is your schedule summary for the week of {{2}}:\n{{3}}\nPlease check the portal for complete timetable details.',
          variables_description: ['Student Name', 'Week Date Range', 'Schedule Summary List'],
          sample_values: ['John Doe', '2026-06-08 to 2026-06-14', 'Physics on Monday at 09:00, Chemistry on Wednesday at 10:00']
        },
        {
          name: 'test_schedule',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, a new exam/test \'{{2}}\' has been scheduled for {{3}} at {{4}} in Room {{5}}. Please prepare well!',
          variables_description: ['Student Name', 'Test/Exam Name', 'Date', 'Time', 'Room/Hall'],
          sample_values: ['John Doe', 'Unit Test 1 (Physics)', '2026-06-15', '09:00 AM', 'Room 101']
        },
        {
          name: 'teacher_schedule',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, a new schedule has been assigned to you for {{2}}:\nSubject: {{3}}\nTiming: {{4}}\nCheck portal for details.',
          variables_description: ['Teacher Name', 'Date/Day', 'Subject Name', 'Timings'],
          sample_values: ['Jane Smith', '2026-06-10', 'Physics (Grade 12)', '09:00 - 10:00']
        },
        {
          name: 'query_raised_alert',
          category: 'UTILITY',
          body_text: '⚠️ Query Alert: Student {{1}} has raised a new support query.\nSubject: {{2}}\nPriority: {{3}}\nDetails: {{4}}',
          variables_description: ['Student Name', 'Query Type/Subject', 'Priority Level', 'Truncated Description'],
          sample_values: ['John Doe', 'Leave Application', 'HIGH', 'Requesting leave for medical checkup.']
        },
        {
          name: 'query_response',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, our support team has responded to your query about \'{{2}}\':\n"{{3}}"\nResponder: {{4}}',
          variables_description: ['Student Name', 'Query Subject', 'Response Text', 'Responder Name'],
          sample_values: ['John Doe', 'Leave Application', 'Your leave has been approved. Take care.', 'Admin Staff']
        },
        {
          name: 'fee_reminder',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, this is a friendly reminder that an outstanding fee of {{2}} is due on {{3}}. You can pay online here: {{4}}.',
          variables_description: ['Student Name', 'Due Amount', 'Due Date', 'Payment Link'],
          sample_values: ['John Doe', 'INR 15,000', '2026-06-15', 'https://protoncoaching.com/pay']
        },
        {
          name: 'class_reminder',
          category: 'UTILITY',
          body_text: 'Hello {{1}}, this is a reminder for your upcoming class \'{{2}}\' today at {{3}} with {{4}} in Room {{5}}.',
          variables_description: ['Student Name', 'Subject/Class Name', 'Class Time', 'Teacher Name', 'Room Number'],
          sample_values: ['John Doe', 'Physics (Grade 12)', '09:00 AM', 'Jane Smith', 'Room 102']
        }
      ];

      const defaultRules = [
        { name: 'Welcome Student', trigger_event: 'STUDENT_CREATED', target_group: 'STUDENT', template_name: 'welcome_student' },
        { name: 'Welcome Teacher', trigger_event: 'TEACHER_CREATED', target_group: 'TEACHER', template_name: 'welcome_teacher' },
        { name: 'Welcome Coordinator', trigger_event: 'COORDINATOR_CREATED', target_group: 'COORDINATOR', template_name: 'welcome_coordinator' },
        { name: 'Weekly Timetable', trigger_event: 'TIMETABLE_CREATED', target_group: 'STUDENT', template_name: 'weekly_timetable' },
        { name: 'Test Schedule Alert', trigger_event: 'TEST_SCHEDULED', target_group: 'STUDENT', template_name: 'test_schedule' },
        { name: 'Teacher Schedule', trigger_event: 'TEACHER_SCHEDULE_CREATED', target_group: 'TEACHER', template_name: 'teacher_schedule' },
        { name: 'Query Raised -> Admin Alert', trigger_event: 'QUERY_RAISED', target_group: 'ALL', template_name: 'query_raised_alert' },
        { name: 'Query Response -> Student', trigger_event: 'QUERY_RESPONDED', target_group: 'STUDENT', template_name: 'query_response' },
        { name: 'Fee Reminder', trigger_event: 'FEE_REMINDER_CRON', target_group: 'STUDENT', template_name: 'fee_reminder', cron_schedule: '0 9 * * 1' },
        { name: 'Class Reminder', trigger_event: 'CLASS_REMINDER_CRON', target_group: 'STUDENT', template_name: 'class_reminder', cron_schedule: '0 8 * * *' }
      ];

      for (const t of defaultTemplates) {
        await prisma.whatsAppTemplate.create({
          data: {
            name: t.name,
            category: t.category,
            body_text: t.body_text,
            variables_description: t.variables_description,
            sample_values: t.sample_values,
            status: 'DRAFT',
            sync_status: 'LOCAL_ONLY'
          }
        });
      }

      for (const r of defaultRules) {
        const template = await prisma.whatsAppTemplate.findUnique({ where: { name: r.template_name } });
        if (template) {
          await prisma.whatsAppAutomationRule.create({
            data: {
              name: r.name,
              trigger_event: r.trigger_event,
              template_id: template.id,
              target_group: r.target_group,
              is_active: true,
              cron_schedule: r.cron_schedule || null
            }
          });
        }
      }

      console.log('✅ WhatsApp templates and rules seeded successfully!');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during database seeding:', message);
  }
};

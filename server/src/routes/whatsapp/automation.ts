import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { authenticateToken, authorize } from '../../middleware/auth';
import {
  onStudentCreated,
  onTeacherCreated,
  onCoordinatorCreated,
  onTimetableCreated,
  onTeacherScheduleCreated,
  onTestScheduled,
  onQueryRaised,
  onQueryResponded,
  scheduledFeeReminder,
  scheduledClassReminder,
} from '../../services/whatsapp/automation.service';

const router = Router();

// Require auth and admin/coordinator roles
router.use(authenticateToken, authorize('admin', 'coordinator'));

// GET /api/whatsapp/automation/rules -> List all rules
router.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await prisma.whatsAppAutomationRule.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        template: { select: { name: true, status: true } },
      },
    });
    res.json({ success: true, data: rules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/automation/rules -> Create new rule
router.post('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, trigger_event, template_id, target_group, conditions, cron_schedule } = req.body;

    if (!name || !trigger_event || !template_id) {
      res.status(400).json({ success: false, message: 'Name, trigger event, and template ID are required' });
      return;
    }

    const newRule = await prisma.whatsAppAutomationRule.create({
      data: {
        name,
        trigger_event,
        template_id,
        target_group: target_group || 'ALL',
        conditions: conditions || null,
        cron_schedule: cron_schedule || null,
        is_active: true,
        created_by_id: req.user!.id,
      },
    });

    res.status(201).json({ success: true, message: 'Automation rule created successfully', data: newRule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PUT /api/whatsapp/automation/rules/:id -> Update rule
router.put('/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, trigger_event, template_id, target_group, conditions, cron_schedule, is_active } = req.body;

    const updated = await prisma.whatsAppAutomationRule.update({
      where: { id },
      data: {
        name,
        trigger_event,
        template_id,
        target_group,
        conditions,
        cron_schedule,
        is_active,
      },
    });

    res.json({ success: true, message: 'Automation rule updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/whatsapp/automation/rules/:id -> Delete rule
router.delete('/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.whatsAppAutomationRule.delete({ where: { id } });
    res.json({ success: true, message: 'Automation rule deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/automation/rules/:id/toggle -> Enable/disable rule
router.post('/rules/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      res.status(400).json({ success: false, message: 'is_active parameter is required' });
      return;
    }

    const updated = await prisma.whatsAppAutomationRule.update({
      where: { id },
      data: { is_active },
    });

    res.json({
      success: true,
      message: `Automation rule ${is_active ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/automation/rules/:id/test -> Test rule with sample data
router.post('/rules/:id/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rule = await prisma.whatsAppAutomationRule.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!rule) {
      res.status(404).json({ success: false, message: 'Automation rule not found' });
      return;
    }

    // Run test based on the rule type
    const testPhone = '+919999999999'; // Test number
    const mockStudent = {
      first_name: 'Test',
      last_name: 'Student',
      email: 'test.student@proton.com',
      phone: testPhone,
      user_id: req.user!.id,
    };

    const mockTeacher = {
      first_name: 'Test',
      last_name: 'Teacher',
      email: 'test.teacher@proton.com',
      phone: testPhone,
      user_id: req.user!.id,
    };

    const mockCoordinator = {
      full_name: 'Test Coordinator',
      email: 'test.coord@proton.com',
      phone: testPhone,
      user_id: req.user!.id,
    };

    console.log(`[Automation Test] Testing rule: ${rule.name} (Trigger: ${rule.trigger_event})`);

    // We directly invoke the trigger handler using test data
    switch (rule.trigger_event) {
      case 'STUDENT_CREATED':
        await onStudentCreated(mockStudent, 'ProtonTestPass1');
        break;
      case 'TEACHER_CREATED':
        await onTeacherCreated(mockTeacher, 'ProtonTestPass2');
        break;
      case 'COORDINATOR_CREATED':
        await onCoordinatorCreated(mockCoordinator, 'ProtonTestPass3');
        break;
      case 'TIMETABLE_CREATED':
        await onTimetableCreated({
          class_id: 'dummy-class-id',
          subject_id: 'dummy-sub-id',
          date: '2026-06-10',
          start_time: '10:00',
          room: '101',
        });
        break;
      case 'TEACHER_SCHEDULE_CREATED':
        await onTeacherScheduleCreated(
          { date: '2026-06-10', subject: 'Physics Class', start_time: '10:00', end_time: '11:00' },
          mockTeacher
        );
        break;
      case 'TEST_SCHEDULED':
        await onTestScheduled({
          class_id: 'dummy-class-id',
          subject_id: 'dummy-sub-id',
          test_name: 'Unit Test I',
          test_date: '2026-06-15',
          start_time: '09:00',
        });
        break;
      case 'QUERY_RAISED':
        await onQueryRaised(
          { query_type: 'leave_application', priority: 'high', description: 'Requesting sick leave.', assigned_to: req.user!.id },
          mockStudent
        );
        break;
      case 'QUERY_RESPONDED':
        await onQueryResponded(
          { student_id: 'dummy-student-id', query_type: 'leave_application' },
          'Your leave application has been approved.',
          'Admin Tester'
        );
        break;
      case 'FEE_REMINDER_CRON':
        await scheduledFeeReminder();
        break;
      case 'CLASS_REMINDER_CRON':
        await scheduledClassReminder();
        break;
      default:
        res.status(400).json({ success: false, message: `No test logic configured for trigger ${rule.trigger_event}` });
        return;
    }

    res.json({
      success: true,
      message: `Test run for rule "${rule.name}" triggered. Check Message Logs to verify execution status.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/automation/trigger -> Manually trigger background scripts (Cron overrides)
router.post('/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const { triggerEvent } = req.body;

    if (!triggerEvent) {
      res.status(400).json({ success: false, message: 'triggerEvent is required' });
      return;
    }

    if (triggerEvent === 'FEE_REMINDER_CRON') {
      scheduledFeeReminder().catch(err => console.error(err));
      res.json({ success: true, message: 'Fee reminder batch automated run initiated.' });
    } else if (triggerEvent === 'CLASS_REMINDER_CRON') {
      scheduledClassReminder().catch(err => console.error(err));
      res.json({ success: true, message: 'Class reminder batch automated run initiated.' });
    } else {
      res.status(400).json({ success: false, message: `Unsupported cron trigger event: ${triggerEvent}` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

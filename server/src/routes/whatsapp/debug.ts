import { Router, Request, Response } from 'express';
import { authenticateToken, authorize } from '../../middleware/auth';
import {
  getWhatsAppConfig,
  getPhoneNumberInfo,
  validatePhoneNumber,
  verifyConnection,
} from '../../services/whatsapp/whatsapp.service';
import {
  getQueueStatus,
  clearQueue,
  pauseQueue,
  resumeQueue,
} from '../../services/whatsapp/queue.service';
import prisma from '../../config/database';
import { randomUUID } from 'crypto';

const router = Router();

// Require auth and admin/coordinator roles
router.use(authenticateToken, authorize('admin', 'coordinator'));

// GET /api/whatsapp/debug/health -> Full system health check
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getWhatsAppConfig();
    const dbTest = await prisma.$queryRaw`SELECT 1`.catch(() => null);
    const metaTest = await verifyConnection();
    const queue = getQueueStatus();

    res.json({
      success: true,
      data: {
        database: dbTest ? 'healthy' : 'unhealthy',
        metaApi: metaTest.status,
        mockMode: config.is_mock_mode,
        tokenValid: metaTest.success,
        webhookUrl: config.webhook_url,
        webhookVerified: config.webhook_verified,
        queue,
        dailyLimits: {
          counter: config.daily_counter,
          limit: config.daily_limit,
          remaining: Math.max(0, config.daily_limit - config.daily_counter),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Health check failed' });
  }
});

// GET /api/whatsapp/debug/meta-status -> Check Meta Graph API availability
router.get('/meta-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getWhatsAppConfig();
    if (!config.hasCredentials) {
      res.json({ success: false, status: 'DISCONNECTED', message: 'Meta credentials are not configured.' });
      return;
    }

    const testUrl = `${config.apiBaseUrl}/${config.apiVersion}/${config.phoneNumberId}`;
    const start = Date.now();
    const resMeta = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });
    const latency = Date.now() - start;

    if (resMeta.ok) {
      res.json({ success: true, status: 'OPERATIONAL', latency: `${latency}ms` });
    } else {
      const errorJson = (await resMeta.json().catch(() => ({}))) as any;
      res.status(resMeta.status).json({
        success: false,
        status: 'DEGRADED',
        error: errorJson?.error?.message || 'Meta API responded with error status',
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, status: 'OFFLINE', error: error.message });
  }
});

// POST /api/whatsapp/debug/simulate -> Simulate sending message without actual API call
router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, templateName, variables = [] } = req.body;

    if (!phone || !templateName) {
      res.status(400).json({ success: false, message: 'Phone and templateName are required' });
      return;
    }

    const mockMsgId = `simulated-wamid-${randomUUID()}`;

    // Log it as MOCK in database
    await prisma.whatsAppLog.create({
      data: {
        phone,
        recipient_name: 'Simulated Recipient',
        recipient_type: 'CUSTOM',
        variables,
        meta_message_id: mockMsgId,
        status: 'MOCK',
        direction: 'OUTGOING',
        triggered_by: 'MANUAL',
        automation_type: 'SIMULATION',
        raw_request: { simulation: true, phone, templateName, variables },
        raw_response: { success: true, message: 'Simulation run completed' },
        sent_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Simulated send completed and logged successfully.',
      data: {
        messageId: mockMsgId,
        recipient: phone,
        template: templateName,
        variables,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Simulation failed' });
  }
});

// GET /api/whatsapp/debug/rate-limit -> Get current rate limit stats
router.get('/rate-limit', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getWhatsAppConfig();

    const now = new Date();
    const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msToReset = tomorrowMidnight.getTime() - now.getTime();
    
    // Convert ms to hours and minutes
    const hours = Math.floor(msToReset / (1000 * 60 * 60));
    const minutes = Math.floor((msToReset % (1000 * 60 * 60)) / (1000 * 60));

    res.json({
      success: true,
      data: {
        currentTier: 'Tier 1 (250 messages/day)',
        qualityRating: 'HIGH',
        limit: config.daily_limit,
        counter: config.daily_counter,
        remaining: Math.max(0, config.daily_limit - config.daily_counter),
        resetsIn: `${hours}h ${minutes}m`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch rate limit status' });
  }
});

// GET /api/whatsapp/debug/phone-info -> Get business phone details from Meta
router.get('/phone-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const info = await getPhoneNumberInfo();
    res.json({ success: true, data: info });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get phone info' });
  }
});

// POST /api/whatsapp/debug/validate-number -> Validate if number is on WhatsApp
router.post('/validate-number', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    const check = await validatePhoneNumber(phone);
    res.json({
      success: check.success,
      data: {
        isValid: check.valid,
        phone: check.phone,
        status: check.status || 'unknown',
      },
      message: check.valid ? 'Number is registered on WhatsApp' : 'Number is not registered on WhatsApp',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Number validation failed' });
  }
});

// GET /api/whatsapp/debug/queue -> View current bulk queue status
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = getQueueStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to query queue' });
  }
});

// POST /api/whatsapp/debug/queue/clear -> Clear bulk queue
router.post('/queue/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = clearQueue();
    res.json({ success: true, message: 'Bulk queue cleared successfully', data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to clear queue' });
  }
});

// POST /api/whatsapp/debug/queue/pause -> Pause bulk queue
router.post('/queue/pause', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = pauseQueue();
    res.json({ success: true, message: 'Bulk queue processing paused', data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to pause queue' });
  }
});

// POST /api/whatsapp/debug/queue/resume -> Resume bulk queue
router.post('/queue/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = resumeQueue();
    res.json({ success: true, message: 'Bulk queue processing resumed', data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to resume queue' });
  }
});

// POST /api/whatsapp/debug/reset-counter -> Reset daily counter
router.post('/reset-counter', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.whatsAppConfig.update({
      where: { id: 'global' },
      data: { daily_counter: 0, last_reset_date: new Date() },
    });
    res.json({ success: true, message: 'Daily message counter has been reset to 0.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reset daily counter' });
  }
});

// POST /api/whatsapp/debug/disconnect -> Disconnect WhatsApp (clear credentials)
router.post('/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.whatsAppConfig.update({
      where: { id: 'global' },
      data: {
        access_token: null,
        phone_number_id: null,
        business_account_id: null,
        verify_token: null,
        is_active: false,
        is_mock_mode: true,
        daily_counter: 0,
      },
    });
    res.json({ success: true, message: 'WhatsApp Integration disconnected and credentials cleared.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to disconnect WhatsApp' });
  }
});

// POST /api/whatsapp/debug/reset-rules -> Reset all automation rules to defaults
router.post('/reset-rules', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Delete all rules
    await prisma.whatsAppAutomationRule.deleteMany({});
    // 2. Delete all templates
    await prisma.whatsAppTemplate.deleteMany({});
    
    // 3. Re-seed default data
    const { seedData } = require('../../data/store');
    await seedData();

    res.json({ success: true, message: 'WhatsApp templates and automation rules reset to defaults.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reset rules' });
  }
});

export default router;


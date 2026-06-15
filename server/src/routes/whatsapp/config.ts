import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { authenticateToken, authorize } from '../../middleware/auth';
import { encrypt } from '../../utils/whatsapp/encrypt';
import { verifyConnection } from '../../services/whatsapp/whatsapp.service';

const router = Router();

// Require auth and admin/coordinator roles for all config routes
router.use(authenticateToken, authorize('admin', 'coordinator'));

// GET /api/whatsapp/config -> Get current config (masked)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let config = await prisma.whatsAppConfig.findUnique({ where: { id: 'global' } });
    if (!config) {
      config = await prisma.whatsAppConfig.create({
        data: {
          id: 'global',
          is_active: false,
          is_mock_mode: true,
          daily_limit: 250,
        },
      });
    }

    // Mask sensitive access token
    const maskedToken = config.access_token
      ? `••••••••••••${config.access_token.substring(config.access_token.length - 6)}`
      : '';

    res.json({
      success: true,
      data: {
        ...config,
        access_token: maskedToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/config -> Save/update credentials
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      access_token,
      phone_number_id,
      business_account_id,
      verify_token,
      api_version,
      api_base_url,
      is_active,
      is_mock_mode,
      daily_limit,
      webhook_url,
    } = req.body;

    // Load existing config
    const existing = await prisma.whatsAppConfig.findUnique({ where: { id: 'global' } });

    const updateData: any = {};

    if (access_token !== undefined) {
      // If it's the masked token, don't update it. Update only if it's a new token.
      if (access_token && !access_token.startsWith('••••')) {
        updateData.access_token = encrypt(access_token);
      } else if (access_token === '') {
        updateData.access_token = null;
      }
    }

    if (phone_number_id !== undefined) updateData.phone_number_id = phone_number_id;
    if (business_account_id !== undefined) updateData.business_account_id = business_account_id;
    if (verify_token !== undefined) updateData.verify_token = verify_token;
    if (api_version !== undefined) updateData.api_version = api_version;
    if (api_base_url !== undefined) updateData.api_base_url = api_base_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_mock_mode !== undefined) updateData.is_mock_mode = is_mock_mode;
    if (daily_limit !== undefined) updateData.daily_limit = daily_limit;
    if (webhook_url !== undefined) updateData.webhook_url = webhook_url;

    const updated = await prisma.whatsAppConfig.upsert({
      where: { id: 'global' },
      update: updateData,
      create: {
        id: 'global',
        ...updateData,
      },
    });

    res.json({
      success: true,
      message: 'WhatsApp Configuration saved successfully',
      data: {
        ...updated,
        access_token: updated.access_token ? '••••••••' : null,
      },
    });
  } catch (error: any) {
    console.error('Update config failed:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/config/test -> Test Meta API Connection
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await verifyConnection();
    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Meta API connection verified successfully!' : 'Meta API connection failed.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during connection test' });
  }
});

// GET /api/whatsapp/config/status -> Get connection status flags
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.whatsAppConfig.findUnique({ where: { id: 'global' } });
    if (!config) {
      res.json({
        success: true,
        data: {
          is_active: false,
          is_mock_mode: true,
          webhook_verified: false,
          status: 'MOCK',
        },
      });
      return;
    }

    const test = await verifyConnection();

    res.json({
      success: true,
      data: {
        is_active: config.is_active,
        is_mock_mode: config.is_mock_mode,
        webhook_verified: config.webhook_verified,
        status: test.status, // CONNECTED | MOCK | DISCONNECTED
        daily_counter: config.daily_counter,
        daily_limit: config.daily_limit,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/config/verify-webhook -> Manual verify status update
router.post('/verify-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await prisma.whatsAppConfig.update({
      where: { id: 'global' },
      data: { webhook_verified: true },
    });
    res.json({
      success: true,
      message: 'Webhook verification status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;

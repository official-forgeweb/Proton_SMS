import { Router, Request, Response } from 'express';
import { authenticateToken, authorize } from '../../middleware/auth';
import {
  sendTemplateMessage,
  sendTextMessage,
  sendMediaMessage,
} from '../../services/whatsapp/whatsapp.service';
import { addToQueue } from '../../services/whatsapp/queue.service';
import { generatePreview } from '../../services/whatsapp/template.service';
import prisma from '../../config/database';

const router = Router();

// Require auth and admin/coordinator roles
router.use(authenticateToken, authorize('admin', 'coordinator'));

// POST /api/whatsapp/send/template -> Send template to single number
router.post('/template', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, templateName, variables = [], recipientName, recipientType, recipientUserId, automationType } = req.body;

    if (!phone || !templateName) {
      res.status(400).json({ success: false, message: 'Phone number and template name are required' });
      return;
    }

    const result = await sendTemplateMessage(phone, templateName, variables, {
      recipientName,
      recipientType,
      recipientUserId,
      triggeredBy: 'MANUAL',
      automationType,
    });

    if (result.success) {
      res.json({ success: true, message: 'Template message sent successfully', data: result });
    } else {
      res.status(400).json({ success: false, message: result.error, data: result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/send/bulk -> Send template to multiple numbers (queue based)
router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, message: 'An array of messages is required' });
      return;
    }

    // Call queue service addToQueue
    const result = addToQueue(messages.map(m => ({
      phone: m.phone,
      templateName: m.templateName,
      variables: m.variables || [],
      meta: {
        recipientName: m.recipientName,
        recipientType: m.recipientType,
        recipientUserId: m.recipientUserId,
        triggeredBy: 'MANUAL',
        automationType: m.automationType || 'BULK_SEND',
      }
    })));

    res.json({
      success: true,
      message: `${result.added} messages added to bulk sending queue.`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to queue bulk messages' });
  }
});

// POST /api/whatsapp/send/text -> Send free text (within 24hr window)
router.post('/text', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, text, recipientName, recipientType, recipientUserId } = req.body;

    if (!phone || !text) {
      res.status(400).json({ success: false, message: 'Phone number and text are required' });
      return;
    }

    const result = await sendTextMessage(phone, text, {
      recipientName,
      recipientType,
      recipientUserId,
      triggeredBy: 'MANUAL',
    });

    if (result.success) {
      res.json({ success: true, message: 'Text message sent successfully', data: result });
    } else {
      res.status(400).json({ success: false, message: result.error, data: result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/send/media -> Send media (image/document/video/audio)
router.post('/media', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, type, url, caption, filename, recipientName, recipientType, recipientUserId } = req.body;

    if (!phone || !type || !url) {
      res.status(400).json({ success: false, message: 'Phone, type, and url are required' });
      return;
    }

    const result = await sendMediaMessage(phone, type, url, caption, filename, {
      recipientName,
      recipientType,
      recipientUserId,
      triggeredBy: 'MANUAL',
    });

    if (result.success) {
      res.json({ success: true, message: 'Media message sent successfully', data: result });
    } else {
      res.status(400).json({ success: false, message: result.error, data: result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/send/test -> Send a quick test welcome message to admin
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Recipient phone number is required' });
      return;
    }

    const testResult = await sendTemplateMessage(
      phone,
      'welcome_student',
      ['Test User', 'test@proton.com', 'ProtonTestPass1', CLIENT_PORTAL_URL],
      {
        recipientName: 'Test Admin User',
        recipientType: 'CUSTOM',
        triggeredBy: 'MANUAL',
        automationType: 'TEST_SEND',
      }
    );

    if (testResult.success) {
      res.json({ success: true, message: 'Test WhatsApp message sent successfully!', data: testResult });
    } else {
      res.status(400).json({ success: false, message: testResult.error, data: testResult });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/whatsapp/send/preview -> Get message HTML preview
router.get('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId, variables } = req.query;

    if (!templateId) {
      res.status(400).json({ success: false, message: 'templateId is required' });
      return;
    }

    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id: String(templateId) },
    });

    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }

    // Parse variables from query (e.g. ?variables=["John", "Doe"])
    let parsedVars: string[] = [];
    if (variables) {
      try {
        parsedVars = JSON.parse(String(variables));
      } catch (err) {
        parsedVars = String(variables).split(',');
      }
    }

    const previewHtml = generatePreview(template, parsedVars);

    res.json({ success: true, data: previewHtml });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate preview' });
  }
});

export default router;

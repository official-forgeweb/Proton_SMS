import { Router, Request, Response } from 'express';
import { getWhatsAppConfig } from '../../services/whatsapp/whatsapp.service';
import { processWebhookPayload } from '../../services/whatsapp/webhook.service';
import prisma from '../../config/database';

const router = Router();

// GET /api/whatsapp/webhook -> Meta Verification (Challenge Response)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getWhatsAppConfig();
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === config.verifyToken) {
        console.log('📬 [WhatsApp Webhook] Verification successful.');
        
        // Mark webhook as verified in database
        await prisma.whatsAppConfig.update({
          where: { id: 'global' },
          data: { webhook_verified: true }
        });

        res.status(200).send(challenge);
        return;
      }
    }
    
    console.warn('⚠️ [WhatsApp Webhook] Verification failed. Invalid verify token.');
    res.status(403).send('Forbidden');
  } catch (error: any) {
    console.error('Webhook Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/whatsapp/webhook -> Receive Incoming Messages & Status Updates
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;

    // Process the payload asynchronously (non-blocking) to respond to Meta immediately
    processWebhookPayload(payload).catch(err => {
      console.error('[WhatsApp Webhook] Processing failed:', err);
    });

    // Meta requires a quick 200 response to confirm delivery
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Receive Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/whatsapp/webhook/logs -> Fetch last 50 webhook logs for debugging
router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { event_type } = req.query;
    
    let where: any = {};
    if (event_type) {
      where.event_type = String(event_type);
    }

    const logs = await prisma.whatsAppWebhookLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch webhook logs' });
  }
});

// DELETE /api/whatsapp/webhook/logs -> Clear webhook logs
router.delete('/logs/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.whatsAppWebhookLog.deleteMany({});
    res.json({ success: true, message: 'Webhook logs cleared successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to clear webhook logs' });
  }
});

export default router;

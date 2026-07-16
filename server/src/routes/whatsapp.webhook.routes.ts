import { Router } from 'express';
import * as whatsappController from '../controllers/whatsapp.controller';

const router = Router();

/**
 * WhatsApp Webhook Routes for Twilio Configuration
 */

// POST /api/whatsapp/webhook/incoming
router.post('/incoming', whatsappController.handleIncomingMessage);

// POST /api/whatsapp/webhook/status
router.post('/status', whatsappController.handleDeliveryStatus);

export default router;

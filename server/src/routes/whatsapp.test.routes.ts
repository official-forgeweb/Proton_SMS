import { Router } from 'express';
import * as whatsappController from '../controllers/whatsapp.controller';

const router = Router();

/**
 * WhatsApp Test Routes for Postman
 * All routes are POST and accept JSON body
 */

// POST /api/whatsapp/test/inquiry
router.post('/inquiry', whatsappController.testInquiry);

// POST /api/whatsapp/test/fee-reminder
router.post('/fee-reminder', whatsappController.testFeeReminder);

// POST /api/whatsapp/test/study-material
router.post('/study-material', whatsappController.testStudyMaterial);

// POST /api/whatsapp/test/video-lecture
router.post('/video-lecture', whatsappController.testVideoLecture);

// POST /api/whatsapp/test/timetable
router.post('/timetable', whatsappController.testTimetable);

// POST /api/whatsapp/test/attendance
router.post('/attendance', whatsappController.testAttendance);

// POST /api/whatsapp/test/marketing
router.post('/marketing', whatsappController.testMarketing);

// POST /api/whatsapp/test/all
router.post('/all', whatsappController.testAll);

export default router;

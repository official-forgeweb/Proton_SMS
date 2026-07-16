import { Request, Response } from 'express';
import * as whatsappService from '../services/whatsapp.service';

// POST /api/whatsapp/test/inquiry
export async function testInquiry(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendInquiryConfirmation(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Inquiry Confirmation Message',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/fee-reminder
export async function testFeeReminder(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendFeeReminder(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Fee Reminder to Parents',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/study-material
export async function testStudyMaterial(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendStudyMaterialNotification(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Study Material Notification',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/video-lecture
export async function testVideoLecture(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendVideoLectureNotification(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Video Lecture Notification',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/timetable
export async function testTimetable(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendWeeklyTimetable(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Weekly Timetable with PDF',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/attendance
export async function testAttendance(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendAttendanceNotification(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Attendance Notification to Parents',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/marketing
export async function testMarketing(req: Request, res: Response) {
  try {
    const data = req.body || {};
    const result = await whatsappService.sendMarketingMessage(data);
    return res.status(200).json({
      success: (result as any).success !== false,
      feature: 'Marketing Message',
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/test/all
export async function testAll(req: Request, res: Response) {
  try {
    const commonData = req.body || {};
    const recipient = commonData.to || process.env.TEST_PHONE_NUMBER;

    console.log(`🚀 Executing Bulk Test for All 7 Features to: ${recipient}`);

    const inquiryRes = await whatsappService.sendInquiryConfirmation({ to: recipient, ...commonData });
    const feeRes = await whatsappService.sendFeeReminder({ to: recipient, ...commonData });
    const studyRes = await whatsappService.sendStudyMaterialNotification({ to: recipient, ...commonData });
    const videoRes = await whatsappService.sendVideoLectureNotification({ to: recipient, ...commonData });
    const timetableRes = await whatsappService.sendWeeklyTimetable({ to: recipient, ...commonData });
    const attendanceRes = await whatsappService.sendAttendanceNotification({ to: recipient, ...commonData });
    const marketingRes = await whatsappService.sendMarketingMessage({ to: recipient, ...commonData });

    const results = [
      { feature: 'Feature 1: Inquiry Confirmation', result: inquiryRes },
      { feature: 'Feature 2: Fee Reminder', result: feeRes },
      { feature: 'Feature 3: Study Material', result: studyRes },
      { feature: 'Feature 4: Video Lecture', result: videoRes },
      { feature: 'Feature 5: Weekly Timetable PDF', result: timetableRes },
      { feature: 'Feature 6: Attendance Notification', result: attendanceRes },
      { feature: 'Feature 7: Marketing Message', result: marketingRes }
    ];

    const allSuccessful = results.every(r => r.result && (r.result as any).success !== false);

    return res.status(200).json({
      success: allSuccessful,
      message: 'All 7 Twilio WhatsApp features executed successfully!',
      recipient: recipient,
      totalFeaturesTested: results.length,
      results: results
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/webhook/incoming
export async function handleIncomingMessage(req: Request, res: Response) {
  try {
    const from = req.body.From || req.body.from;
    const body = req.body.Body || req.body.body || '';

    console.log(`\n📥 [Incoming WhatsApp Webhook] From: ${from} | Body: "${body}"`);

    const replyMessage = whatsappService.processIncomingKeyword(body);

    if (from) {
      await whatsappService.sendWhatsAppMessage({ to: from, body: replyMessage });
    }

    if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyMessage}</Message></Response>`);
    }

    return res.status(200).json({
      success: true,
      message: 'Auto-reply processed successfully',
      incomingMessage: body,
      sender: from,
      replyMessage: replyMessage
    });
  } catch (error: any) {
    console.error('❌ Incoming Webhook Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/whatsapp/webhook/status
export async function handleDeliveryStatus(req: Request, res: Response) {
  try {
    const messageSid = req.body.MessageSid || req.body.SmsSid;
    const messageStatus = req.body.MessageStatus || req.body.SmsStatus;
    const to = req.body.To || req.body.to;
    const errorCode = req.body.ErrorCode || req.body.errorCode;
    const errorMessage = req.body.ErrorMessage || req.body.errorMessage;

    console.log(`\n📊 [WhatsApp Delivery Status Update]`);
    console.log(`   Message SID: ${messageSid}`);
    console.log(`   To:          ${to}`);
    console.log(`   Status:      ${messageStatus}`);
    if (errorCode) {
      console.log(`   Error Code:  ${errorCode} - ${errorMessage}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery status logged successfully',
      data: {
        messageSid,
        to,
        messageStatus,
        errorCode: errorCode || null,
        errorMessage: errorMessage || null
      }
    });
  } catch (error: any) {
    console.error('❌ Status Webhook Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

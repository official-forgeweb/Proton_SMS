import twilio from 'twilio';

// Environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sandboxNumber = process.env.TWILIO_SANDBOX_NUMBER || 'whatsapp:+14155238886';
const testPhoneNumber = process.env.TEST_PHONE_NUMBER || '+919999999999';
const vercelAppUrl = process.env.VERCEL_APP_URL || 'https://your-app.vercel.app';
const institutionName = process.env.INSTITUTION_NAME || 'ABC Institute';

// Initialize Twilio client if credentials exist
let client: any = null;
if (accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err: any) {
    console.error('⚠️ Twilio Initialization Error:', err.message);
  }
}

export function formatWhatsAppNumber(phone?: string): string {
  const target = phone || testPhoneNumber;
  if (!target) return 'whatsapp:+919999999999';
  if (target.startsWith('whatsapp:')) return target;
  if (target.startsWith('+')) return `whatsapp:${target}`;
  return `whatsapp:+${target}`;
}

export interface SendWhatsAppParams {
  to?: string;
  body: string;
  mediaUrl?: string;
}

export async function sendWhatsAppMessage({ to, body, mediaUrl }: SendWhatsAppParams) {
  const formattedTo = formatWhatsAppNumber(to);
  const formattedFrom = formatWhatsAppNumber(sandboxNumber);

  console.log(`\n========================================`);
  console.log(`📲 [WhatsApp Send Request]`);
  console.log(`   To:       ${formattedTo}`);
  console.log(`   From:     ${formattedFrom}`);
  console.log(`   MediaUrl: ${mediaUrl || 'None'}`);
  console.log(`   Body:\n${body}`);
  console.log(`========================================\n`);

  if (!client) {
    console.warn('⚠️ Twilio Client not active (using mock mode or invalid credentials).');
    return {
      success: true,
      mock: true,
      messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'queued',
      to: formattedTo,
      from: formattedFrom,
      body,
      mediaUrl: mediaUrl || null,
      note: 'Message simulated in log mode since real Twilio credentials were not active.'
    };
  }

  try {
    const payload: any = {
      from: formattedFrom,
      to: formattedTo,
      body: body
    };

    if (mediaUrl) {
      payload.mediaUrl = [mediaUrl];
    }

    const message = await client.messages.create(payload);

    console.log(`✅ WhatsApp Message Sent via Twilio SID: ${message.sid} [Status: ${message.status}]`);

    return {
      success: true,
      mock: false,
      messageId: message.sid,
      status: message.status,
      to: formattedTo,
      from: formattedFrom,
      body,
      mediaUrl: mediaUrl || null
    };
  } catch (error: any) {
    console.error('❌ Twilio WhatsApp Error:', error.message);
    return {
      success: false,
      mock: false,
      error: error.message,
      errorCode: error.code || 500,
      to: formattedTo,
      from: formattedFrom
    };
  }
}

// ─────────────────────────────────────────────────────────────
// FEATURE 1: Inquiry Confirmation Message
// ─────────────────────────────────────────────────────────────
export async function sendInquiryConfirmation(data: {
  to?: string;
  studentName?: string;
  inquiryId?: string;
  courseName?: string;
  date?: string;
  counselorPhone?: string;
}) {
  const name = data.studentName || 'Student';
  const id = data.inquiryId || `INQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const course = data.courseName || 'General Coaching';
  const inquiryDate = data.date || new Date().toISOString().split('T')[0];
  const counselor = data.counselorPhone || '+91 98765 43210';
  const instName = process.env.INSTITUTION_NAME || institutionName;

  const body = `🎓 *Inquiry Received - ${instName}*\n\n` +
    `Dear *${name}*,\n` +
    `Thank you for inquiring with us! We have received your request.\n\n` +
    `📋 *Inquiry Details:*\n` +
    `• *Inquiry ID:* ${id}\n` +
    `• *Course:* ${course}\n` +
    `• *Date:* ${inquiryDate}\n` +
    `• *Counselor Contact:* ${counselor}\n\n` +
    `Our team will reach out to you shortly. Feel free to reply to this message if you have any questions.\n\n` +
    `Best regards,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 2: Fee Reminder to Parents
// ─────────────────────────────────────────────────────────────
export async function sendFeeReminder(data: {
  to?: string;
  parentName?: string;
  studentName?: string;
  courseName?: string;
  feeType?: string;
  amountDue?: string | number;
  dueDate?: string;
  paymentLink?: string;
}) {
  const pName = data.parentName || 'Parent / Guardian';
  const sName = data.studentName || 'Student';
  const course = data.courseName || 'Standard Batch';
  const type = data.feeType || 'Tuition Fee';
  const amount = data.amountDue || '5,000';
  const due = data.dueDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const link = data.paymentLink || `${process.env.VERCEL_APP_URL || vercelAppUrl}/fees`;
  const instName = process.env.INSTITUTION_NAME || institutionName;

  const body = `🔔 *Fee Due Reminder - ${instName}*\n\n` +
    `Dear *${pName}*,\n\n` +
    `This is a gentle reminder regarding the pending fee payment for your child *${sName}*.\n\n` +
    `💳 *Fee Summary:*\n` +
    `• *Student Name:* ${sName}\n` +
    `• *Course:* ${course}\n` +
    `• *Fee Type:* ${type}\n` +
    `• *Amount Due:* ₹${amount}\n` +
    `• *Due Date:* ${due}\n\n` +
    `🔗 *Online Payment Portal:*\n` +
    `${link}\n\n` +
    `Please complete the payment on or before the due date to avoid late penalty.\n\n` +
    `Thank you,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 3: Study Material Notification
// ─────────────────────────────────────────────────────────────
export async function sendStudyMaterialNotification(data: {
  to?: string;
  studentName?: string;
  subjectName?: string;
  topicName?: string;
  uploadDate?: string;
  materialUrl?: string;
  uploadedBy?: string;
}) {
  const sName = data.studentName || 'Student';
  const subject = data.subjectName || 'Physics';
  const topic = data.topicName || 'Thermodynamics & Heat Laws';
  const date = data.uploadDate || new Date().toISOString().split('T')[0];
  const teacher = data.uploadedBy || 'Dr. H.C. Verma';
  const link = data.materialUrl || `${process.env.VERCEL_APP_URL || vercelAppUrl}/study-material/physics-notes.pdf`;
  const instName = process.env.INSTITUTION_NAME || institutionName;

  const body = `📚 *New Study Material Uploaded - ${instName}*\n\n` +
    `Hello *${sName}*,\n` +
    `New study resources have just been added to your portal!\n\n` +
    `📑 *Material Information:*\n` +
    `• *Subject:* ${subject}\n` +
    `• *Topic:* ${topic}\n` +
    `• *Uploaded Date:* ${date}\n` +
    `• *Teacher:* ${teacher}\n\n` +
    `📥 *Access Direct Document:*\n` +
    `${link}\n\n` +
    `Happy Learning!\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 4: Video Lecture Notification
// ─────────────────────────────────────────────────────────────
export async function sendVideoLectureNotification(data: {
  to?: string;
  studentName?: string;
  subjectName?: string;
  chapterNumber?: string | number;
  lectureTitle?: string;
  duration?: string | number;
  instructorName?: string;
  videoUrl?: string;
}) {
  const sName = data.studentName || 'Student';
  const subject = data.subjectName || 'Mathematics';
  const chapter = data.chapterNumber || 'Chapter 4';
  const title = data.lectureTitle || 'Integration by Parts Masterclass';
  const mins = data.duration || '45';
  const instructor = data.instructorName || 'Prof. R.D. Sharma';
  const link = data.videoUrl || `${process.env.VERCEL_APP_URL || vercelAppUrl}/lectures/math-ch4`;
  const instName = process.env.INSTITUTION_NAME || institutionName;

  const body = `🎥 *New Video Lecture Published - ${instName}*\n\n` +
    `Hello *${sName}*,\n` +
    `A new video lecture is now available for streaming.\n\n` +
    `🎬 *Lecture Details:*\n` +
    `• *Subject:* ${subject}\n` +
    `• *Chapter:* ${chapter}\n` +
    `• *Title:* ${title}\n` +
    `• *Duration:* ${mins} minutes\n` +
    `• *Instructor:* ${instructor}\n\n` +
    `▶️ *Watch Recording:*\n` +
    `${link}\n\n` +
    `Best regards,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 5: Weekly Timetable with PDF Attachment
// ─────────────────────────────────────────────────────────────
export async function sendWeeklyTimetable(data: {
  to?: string;
  studentName?: string;
  batchName?: string;
  weekNumber?: string | number;
  startDate?: string;
  endDate?: string;
  pdfUrl?: string;
}) {
  const sName = data.studentName || 'Student';
  const batch = data.batchName || 'Class 12 - Science Batch A';
  const week = data.weekNumber || '28';
  const sDate = data.startDate || '2026-07-20';
  const eDate = data.endDate || '2026-07-26';
  const documentUrl = data.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const instName = process.env.INSTITUTION_NAME || institutionName;

  const body = `📅 *Weekly Timetable - ${instName}*\n\n` +
    `Hello *${sName}*,\n\n` +
    `Please find attached your updated timetable for *Week ${week}* (${sDate} to ${eDate}).\n\n` +
    `🏫 *Batch:* ${batch}\n` +
    `📎 *Attachment:* Weekly Schedule PDF\n\n` +
    `Kindly adhere to the period timings specified in the document.\n\n` +
    `Regards,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body, mediaUrl: documentUrl });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 6: Attendance Notification to Parents
// ─────────────────────────────────────────────────────────────
export async function sendAttendanceNotification(data: {
  to?: string;
  parentName?: string;
  studentName?: string;
  reportDate?: string;
  totalClasses?: string | number;
  attendedClasses?: string | number;
  percentage?: number;
}) {
  const pName = data.parentName || 'Parent';
  const sName = data.studentName || 'Student';
  const rDate = data.reportDate || new Date().toISOString().split('T')[0];
  const total = parseInt(String(data.totalClasses || 40), 10);
  const attended = parseInt(String(data.attendedClasses || 34), 10);
  const pct = typeof data.percentage === 'number' ? data.percentage : Math.round((attended / total) * 100);
  const instName = process.env.INSTITUTION_NAME || institutionName;

  let statusText = '';
  let statusEmoji = '';

  if (pct >= 75) {
    statusText = 'Good (above 75%)';
    statusEmoji = '🟢 ✅';
  } else if (pct >= 60) {
    statusText = 'Warning (60-75%)';
    statusEmoji = '⚠️ 🟡';
  } else {
    statusText = 'Critical (below 60%)';
    statusEmoji = '🚨 🔴';
  }

  const body = `📊 *Attendance Update - ${instName}*\n\n` +
    `Dear *${pName}*,\n\n` +
    `Here is the latest attendance summary for your child *${sName}*:\n\n` +
    `📅 *Report Date:* ${rDate}\n` +
    `• *Total Classes Conducted:* ${total}\n` +
    `• *Classes Attended:* ${attended}\n` +
    `• *Attendance Percentage:* ${pct}%\n` +
    `• *Academic Status:* ${statusEmoji} *${statusText}*\n\n` +
    `${pct < 75 ? '⚠️ *Attention Required:* We advise ensuring regular attendance for optimal exam preparation.' : '🌟 Keep up the excellent commitment!'}\n\n` +
    `Regards,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 7: Marketing Message
// ─────────────────────────────────────────────────────────────
export async function sendMarketingMessage(data: {
  to?: string;
  recipientName?: string;
  messageType?: string;
  title?: string;
  description?: string;
  eventOrOfferDate?: string;
  infoLink?: string;
  offerEndDate?: string;
}) {
  const rName = data.recipientName || 'Valued Candidate';
  const type = (data.messageType || 'new_course').toUpperCase();
  const mTitle = data.title || '🚀 New Crash Course Admissions Open for JEE / NEET!';
  const mDesc = data.description || 'Join our expert-led revision series with comprehensive test analysis and 1-on-1 mentorship sessions.';
  const link = data.infoLink || `${process.env.VERCEL_APP_URL || vercelAppUrl}/admissions`;
  const instName = process.env.INSTITUTION_NAME || institutionName;

  let dateLine = '';
  if (data.eventOrOfferDate) {
    dateLine += `🗓️ *Event Date:* ${data.eventOrOfferDate}\n`;
  }
  if (data.offerEndDate) {
    dateLine += `⏳ *Valid Until:* ${data.offerEndDate}\n`;
  }

  const body = `📢 *[${type}] Announcement - ${instName}*\n\n` +
    `Dear *${rName}*,\n\n` +
    `*${mTitle}*\n\n` +
    `${mDesc}\n\n` +
    `${dateLine}` +
    `🔗 *Register & Know More:*\n${link}\n\n` +
    `Warm regards,\n` +
    `*${instName}*`;

  return await sendWhatsAppMessage({ to: data.to, body });
}

// ─────────────────────────────────────────────────────────────
// FEATURE 8: Incoming Message Auto-Reply
// ─────────────────────────────────────────────────────────────
export function processIncomingKeyword(incomingBody: string): string {
  const text = (incomingBody || '').toLowerCase().trim();
  const appUrl = process.env.VERCEL_APP_URL || vercelAppUrl;
  const instName = process.env.INSTITUTION_NAME || institutionName;

  if (text.includes('fee') || text.includes('payment') || text.includes('pay')) {
    return `💳 *${instName} Fee Portal*\n\n` +
      `You can view outstanding dues, payment receipts, and make online fee payments here:\n` +
      `${appUrl}/fees`;
  }

  if (text.includes('timetable') || text.includes('schedule') || text.includes('routine')) {
    return `📅 *${instName} Timetable Portal*\n\n` +
      `Check your batch schedule, upcoming lecture timings, and weekly PDF here:\n` +
      `${appUrl}/timetable`;
  }

  if (text.includes('material') || text.includes('notes') || text.includes('study')) {
    return `📚 *${instName} Study Material Hub*\n\n` +
      `Download subject notes, assignment worksheets, and reference guides here:\n` +
      `${appUrl}/study-material`;
  }

  if (text.includes('attendance') || text.includes('present') || text.includes('absent')) {
    return `📊 *${instName} Attendance Portal*\n\n` +
      `Check your overall attendance record and session logs here:\n` +
      `${appUrl}/attendance`;
  }

  if (text.includes('hi') || text.includes('hello') || text.includes('start') || text.includes('menu') || text.includes('help')) {
    return `👋 *Welcome to ${instName} Automated Assistant!*\n\n` +
      `Reply with any keyword to quick-access student services:\n\n` +
      `• *fee* - Pay fees & view due dates\n` +
      `• *timetable* - Access batch schedule\n` +
      `• *material* - Download notes & sheets\n` +
      `• *attendance* - Check attendance logs\n\n` +
      `Or contact support at support@proton.com`;
  }

  return `🤖 *${instName} Auto Help*\n\n` +
    `We received your message: "${incomingBody}".\n\n` +
    `To quick-navigate, reply with one of these keywords:\n` +
    `👉 *fee*, *timetable*, *material*, *attendance*, or *hi*\n\n` +
    `For personal assistance, please call our desk during office hours.`;
}

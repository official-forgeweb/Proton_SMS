import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import multer from 'multer';
import * as xlsx from 'xlsx';
import express from 'express';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const paramId = (req: Request): string => String(req.params.id);

// Ensure valid YouTube URL
const encodeYouTubeUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return url.trim();
  }
  return '';
};

// 1. Upload Excel
router.post('/upload', authenticateToken, authorize('admin', 'coordinator', 'teacher'), upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON with raw: false to format dates/times automatically if possible
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' }) as any[];

    if (!rawData || rawData.length === 0) {
      res.status(400).json({ success: false, message: 'Excel file is empty' });
      return;
    }

    // Prefetch all classes to map class_name to class_id
    const classes = await prisma.class.findMany({ select: { id: true, class_name: true } });
    const classMap: Record<string, string> = {};
    classes.forEach(c => {
      if (c.class_name) {
        classMap[c.class_name.toLowerCase().trim()] = c.id;
      }
    });

    let inserted = 0;
    let skipped = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    // Map column names flexibly
    const getCol = (row: any, ...possibleNames: string[]) => {
      for (const name of possibleNames) {
        const val = row[name] || row[name.toLowerCase()] || row[name.toUpperCase()];
        if (val) return String(val).trim();
      }
      return '';
    };

    const recordsToInsert = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // +1 for 0-index, +1 for header

      const date = getCol(row, 'Date', 'date');
      const time = getCol(row, 'Time', 'time');
      const className = getCol(row, 'Class', 'class', 'Batch', 'batch');
      const subject = getCol(row, 'Subject', 'subject');
      const videoLink = getCol(row, 'YouTube Video Link', 'Youtube Link', 'Video Link', 'YouTube', 'Link');

      // Validation
      if (!date || !time || !className || !subject || !videoLink) {
        errors.push({ row: rowNum, reason: `Missing required fields (Date, Time, Class, Subject, YouTube Video Link)` });
        skipped++;
        continue;
      }

      const validUrl = encodeYouTubeUrl(videoLink);
      if (!validUrl) {
        errors.push({ row: rowNum, reason: `Invalid YouTube URL format: ${videoLink}` });
        skipped++;
        continue;
      }

      const class_id = classMap[className.toLowerCase()];
      if (!class_id) {
        errors.push({ row: rowNum, reason: `Class not found in system: ${className}` });
        skipped++;
        continue;
      }

      recordsToInsert.push({
        date,
        time,
        class_id,
        subject,
        video_url: validUrl,
        title: `${subject} - ${date}`,
        uploaded_by: req.user!.id,
        status: 'active'
      });
    }

    // Insert records and handle duplicates safely
    if (req.body.preview === 'true') {
      res.json({
        success: true,
        message: 'Preview generated',
        data: {
          total: rawData.length,
          valid: recordsToInsert.length,
          skipped,
          errors,
          previewRecords: recordsToInsert
        }
      });
      return;
    }

    for (let i = 0; i < recordsToInsert.length; i++) {
      const record = recordsToInsert[i];
      try {
        await prisma.videoLecture.create({
            data: record
        });
        inserted++;
      } catch (err: any) {
        skipped++;
        if (err.code === 'P2002') {
          errors.push({ row: i + 2, reason: `Duplicate entry for Date/Time/Class/Subject` });
        } else {
          errors.push({ row: i + 2, reason: `Database error: ${err.message}` });
        }
      }
    }

    res.json({
      success: true,
      message: 'Upload processed',
      data: {
        total: rawData.length,
        inserted,
        skipped,
        errors
      }
    });
  } catch (error: any) {
    console.error('Excel upload error:', error);
    res.status(500).json({ success: false, message: 'Server error processing file' });
  }
});

// 1.5 Confirm Upload (Bulk Insert)
router.post('/confirm-upload', authenticateToken, authorize('admin', 'coordinator', 'teacher'), express.json(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'No records provided' });
      return;
    }

    let inserted = 0;
    let skipped = 0;
    const errors: Array<{ reason: string }> = [];

    for (let i = 0; i < records.length; i++) {
        try {
            await prisma.videoLecture.create({ data: records[i] });
            inserted++;
        } catch (err: any) {
            skipped++;
            if (err.code === 'P2002') {
                errors.push({ reason: `Duplicate entry for ${records[i].subject} - ${records[i].date}` });
            } else {
                errors.push({ reason: `Database error: ${err.message}` });
            }
        }
    }

    res.json({
        success: true,
        data: { inserted, skipped, errors }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 2. Get All
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject, date } = req.query;
    let where: any = {};

    if (class_id) where.class_id = String(class_id);
    if (subject) where.subject = { contains: String(subject), mode: 'insensitive' };
    if (date) where.date = String(date);

    // If student, restrict to their enrolled classes and OPTED SUBJECTS
    if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ 
            where: { user_id: req.user!.id },
            select: {
                class_enrollments: { 
                    where: { enrollment_status: 'active' },
                    select: { class_id: true }
                },
                subject_enrollments: { 
                    where: { status: 'active' },
                    select: { class_id: true, subject: true }
                }
            }
        });
        
        if (student) {
            const classIds = student.class_enrollments.map(e => e.class_id);
            const subjectEnrolls = student.subject_enrollments;

            if (classIds.length === 0) {
                res.json({ success: true, data: [] });
                return;
            }

            const subjectsByClass: Record<string, string[]> = {};
            subjectEnrolls.forEach(e => {
                if (!subjectsByClass[e.class_id]) subjectsByClass[e.class_id] = [];
                subjectsByClass[e.class_id].push(e.subject);
            });

            const orConditions = classIds.map(cid => {
                const subjects = subjectsByClass[cid];
                if (subjects && subjects.length > 0) {
                    return { 
                        class_id: cid, 
                        OR: subjects.map(s => ({
                            subject: { contains: s.trim(), mode: 'insensitive' }
                        }))
                    };
                }
                return { class_id: cid };
            });

            if (where.OR) {
                where.AND = [ { OR: where.OR }, { OR: orConditions } ];
                delete where.OR;
            } else {
                where.OR = orConditions;
            }
            
            // If they supplied a manual class filter that they aren't part of, block it
            if (where.class_id && !classIds.includes(where.class_id)) {
                res.json({ success: true, data: [] });
                return;
            }
        }
    }

    // If teacher, restrict to their primary classes or assigned subjects from schedule, or their own uploads
    if (req.user!.role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
      if (teacher) {
        // 1. Classes where teacher is primary instructor
        const primaryClasses = await prisma.class.findMany({
          where: { primary_teacher_id: teacher.id },
          select: { id: true },
        });
        const primaryClassIds = primaryClasses.map(c => c.id);

        // 2. Class-Subject combinations from schedules
        const schedules = await prisma.classSchedule.findMany({
          where: { teacher_id: teacher.id },
          select: { class_id: true, subject: true }
        });

        const teacherOrConditions: any[] = [];
        
        if (primaryClassIds.length > 0) {
          teacherOrConditions.push({ class_id: { in: primaryClassIds } });
        }

        schedules.forEach(sched => {
          if (sched.class_id && sched.subject) {
            teacherOrConditions.push({
              class_id: sched.class_id,
              subject: { equals: sched.subject, mode: 'insensitive' }
            });
          }
        });

        // 3. Fallback: video lectures personally uploaded by this teacher
        teacherOrConditions.push({ uploaded_by: req.user!.id });

        const currentClassId = where.class_id;
        const currentSubject = where.subject;
        delete where.class_id;
        delete where.subject;

        const andConditions: any[] = [{ OR: teacherOrConditions }];
        if (currentClassId) {
          andConditions.push({ class_id: currentClassId });
        }
        if (currentSubject) {
          andConditions.push({ subject: currentSubject });
        }

        where.AND = andConditions;
      }
    }

    const lectures = await prisma.videoLecture.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },
        { subject: 'asc' }
      ],
      include: {
        class_ref: { select: { class_name: true } }
      }
    });

    const formatted = lectures.map(l => ({
        ...l,
        class_name: l.class_ref?.class_name
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Get Single
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = paramId(req);
        const lecture = await prisma.videoLecture.findUnique({ where: { id }, include: { class_ref: { select: { class_name: true }} } });
        if (!lecture) {
            res.status(404).json({ success: false, message: 'Video lecture not found' });
            return;
        }
        res.json({ success: true, data: { ...lecture, class_name: lecture.class_ref?.class_name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4. Update
router.put('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = paramId(req);
        const { date, time, subject, video_url, class_id } = req.body;
        
        await prisma.videoLecture.update({
            where: { id },
            data: {
                date, time, subject, video_url: encodeYouTubeUrl(video_url), class_id
            }
        });

        res.json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 5. Delete bulk
router.delete('/bulk', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, message: 'No IDs provided' });
            return;
        }

        await prisma.videoLecture.deleteMany({
            where: { id: { in: ids } }
        });

        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 6. Delete
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator', 'teacher'), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = paramId(req);
        await prisma.videoLecture.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 7. Test connection
router.post('/test-connection', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { spreadsheetId } = req.body;
    let resolvedId = spreadsheetId;
    if (!resolvedId) {
      const settings = await prisma.systemSetting.findUnique({ where: { id: 'global' } });
      resolvedId = settings?.google_spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;
    }
    if (!resolvedId) {
      res.status(400).json({ success: false, message: 'Spreadsheet ID not provided' });
      return;
    }
    const { GoogleSheetsService } = await import('../services/googleSheetsService');
    await GoogleSheetsService.testConnection(resolvedId);
    res.json({ success: true, message: 'Connection to Google Sheet successful! Credentials verified.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Connection failed: ${error.message}` });
  }
});

// 8. Manual Sync trigger from UI
router.post('/sync', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { GoogleSheetSyncJob } = await import('../jobs/googleSheetSyncJob');
    const result = await GoogleSheetSyncJob.sync(true); // force = true
    res.json({ success: true, message: 'Google Sheets synchronization completed successfully.', ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Synchronization failed: ${error.message}` });
  }
});

// 9. Cron/Webhook Sync trigger
router.post('/sync/cron', async (req: Request, res: Response): Promise<void> => {
  try {
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ success: false, message: 'Unauthorized cron trigger' });
      return;
    }

    const { GoogleSheetSyncJob } = await import('../jobs/googleSheetSyncJob');
    const result = await GoogleSheetSyncJob.sync(false); // force = false (respects settings toggles)
    res.json({ success: true, message: 'Automated sync job executed successfully.', ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Automated sync job failed: ${error.message}` });
  }
});

// 10. Sync Logs endpoint
router.get('/sync-logs', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.googleSheetSyncLog.findMany({
      where: { sync_type: 'video_lectures' },
      orderBy: { start_time: 'desc' },
      take: 50
    });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Failed to retrieve sync logs: ${error.message}` });
  }
});

export default router;

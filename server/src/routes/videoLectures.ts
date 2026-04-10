import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import multer from 'multer';
import * as xlsx from 'xlsx';

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
router.post('/upload', authenticateToken, authorize('admin', 'teacher'), upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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

// 2. Get All
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { class_id, subject, date } = req.query;
    let where: any = {};

    if (class_id) where.class_id = String(class_id);
    if (subject) where.subject = { contains: String(subject), mode: 'insensitive' };
    if (date) where.date = String(date);

    // If student, restrict to their enrolled classes
    if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
        if (student) {
            const enrollments = await prisma.studentClassEnrollment.findMany({
                where: { student_id: student.id, enrollment_status: 'active' },
                select: { class_id: true }
            });
            const myClassIds = enrollments.map(e => e.class_id);
            if (where.class_id && !myClassIds.includes(where.class_id)) {
                res.json({ success: true, data: [] });
                return;
            }
            if (!where.class_id) {
                where.class_id = { in: myClassIds };
            }
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
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
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
router.delete('/bulk', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
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
router.delete('/:id', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
    try {
        const id = paramId(req);
        await prisma.videoLecture.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;

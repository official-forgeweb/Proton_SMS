"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const xlsx = __importStar(require("xlsx"));
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const paramId = (req) => String(req.params.id);
// Ensure valid YouTube URL
const encodeYouTubeUrl = (url) => {
    if (!url)
        return '';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return url.trim();
    }
    return '';
};
// 1. Upload Excel
router.post('/upload', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to JSON with raw: false to format dates/times automatically if possible
        const rawData = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        if (!rawData || rawData.length === 0) {
            res.status(400).json({ success: false, message: 'Excel file is empty' });
            return;
        }
        // Prefetch all classes to map class_name to class_id
        const classes = await database_1.default.class.findMany({ select: { id: true, class_name: true } });
        const classMap = {};
        classes.forEach(c => {
            if (c.class_name) {
                classMap[c.class_name.toLowerCase().trim()] = c.id;
            }
        });
        let inserted = 0;
        let skipped = 0;
        const errors = [];
        // Map column names flexibly
        const getCol = (row, ...possibleNames) => {
            for (const name of possibleNames) {
                const val = row[name] || row[name.toLowerCase()] || row[name.toUpperCase()];
                if (val)
                    return String(val).trim();
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
                uploaded_by: req.user.id,
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
                await database_1.default.videoLecture.create({
                    data: record
                });
                inserted++;
            }
            catch (err) {
                skipped++;
                if (err.code === 'P2002') {
                    errors.push({ row: i + 2, reason: `Duplicate entry for Date/Time/Class/Subject` });
                }
                else {
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
    }
    catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ success: false, message: 'Server error processing file' });
    }
});
// 1.5 Confirm Upload (Bulk Insert)
router.post('/confirm-upload', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), express_2.default.json(), async (req, res) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            res.status(400).json({ success: false, message: 'No records provided' });
            return;
        }
        let inserted = 0;
        let skipped = 0;
        const errors = [];
        for (let i = 0; i < records.length; i++) {
            try {
                await database_1.default.videoLecture.create({ data: records[i] });
                inserted++;
            }
            catch (err) {
                skipped++;
                if (err.code === 'P2002') {
                    errors.push({ reason: `Duplicate entry for ${records[i].subject} - ${records[i].date}` });
                }
                else {
                    errors.push({ reason: `Database error: ${err.message}` });
                }
            }
        }
        res.json({
            success: true,
            data: { inserted, skipped, errors }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 2. Get All
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { class_id, subject, date } = req.query;
        let where = {};
        if (class_id)
            where.class_id = String(class_id);
        if (subject)
            where.subject = { contains: String(subject), mode: 'insensitive' };
        if (date)
            where.date = String(date);
        // If student, restrict to their enrolled classes and OPTED SUBJECTS
        if (req.user.role === 'student') {
            const student = await database_1.default.student.findUnique({
                where: { user_id: req.user.id },
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
                const subjectsByClass = {};
                subjectEnrolls.forEach(e => {
                    if (!subjectsByClass[e.class_id])
                        subjectsByClass[e.class_id] = [];
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
                    where.AND = [{ OR: where.OR }, { OR: orConditions }];
                    delete where.OR;
                }
                else {
                    where.OR = orConditions;
                }
                // If they supplied a manual class filter that they aren't part of, block it
                if (where.class_id && !classIds.includes(where.class_id)) {
                    res.json({ success: true, data: [] });
                    return;
                }
            }
        }
        const lectures = await database_1.default.videoLecture.findMany({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 3. Get Single
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const lecture = await database_1.default.videoLecture.findUnique({ where: { id }, include: { class_ref: { select: { class_name: true } } } });
        if (!lecture) {
            res.status(404).json({ success: false, message: 'Video lecture not found' });
            return;
        }
        res.json({ success: true, data: { ...lecture, class_name: lecture.class_ref?.class_name } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 4. Update
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const { date, time, subject, video_url, class_id } = req.body;
        await database_1.default.videoLecture.update({
            where: { id },
            data: {
                date, time, subject, video_url: encodeYouTubeUrl(video_url), class_id
            }
        });
        res.json({ success: true, message: 'Updated successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 5. Delete bulk
router.delete('/bulk', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, message: 'No IDs provided' });
            return;
        }
        await database_1.default.videoLecture.deleteMany({
            where: { id: { in: ids } }
        });
        res.json({ success: true, message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// 6. Delete
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        await database_1.default.videoLecture.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=videoLectures.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetSyncJob = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../config/database"));
const googleSheetsService_1 = require("../services/googleSheetsService");
const normalization_1 = require("../utils/normalization");
/**
 * Normalizes YouTube url
 */
function encodeYouTubeUrl(url) {
    if (!url)
        return '';
    const trimmed = url.trim();
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
        return trimmed;
    }
    return '';
}
/**
 * Adjusts a time string by adding a specified number of minutes
 */
function adjustTimeMinutes(timeStr, minutesToAdd) {
    try {
        const cleanTime = timeStr.trim().toLowerCase();
        const isPm = cleanTime.includes('pm');
        const isAm = cleanTime.includes('am');
        let timePart = cleanTime.replace(/(am|pm)/g, '').trim();
        const parts = timePart.split(':');
        if (parts.length < 2)
            return timeStr;
        let hour = parseInt(parts[0], 10);
        let minute = parseInt(parts[1], 10);
        if (isNaN(hour) || isNaN(minute))
            return timeStr;
        if (isPm && hour < 12)
            hour += 12;
        if (isAm && hour === 12)
            hour = 0;
        minute += minutesToAdd;
        if (minute >= 60) {
            hour += Math.floor(minute / 60);
            minute = minute % 60;
        }
        if (hour >= 24) {
            hour = hour % 24;
        }
        const finalAmPm = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour % 12;
        if (displayHour === 0)
            displayHour = 12;
        const displayMinute = String(minute).padStart(2, '0');
        return `${displayHour}:${displayMinute} ${finalAmPm}`;
    }
    catch (err) {
        return timeStr;
    }
}
/**
 * Resolves a raw class string to an active database Class record.
 */
function resolveClass(rawClass, allClasses) {
    const clean = rawClass.trim().toLowerCase();
    if (!clean)
        return null;
    // 1. Direct match on name, code, or grade level (case-insensitive exact)
    let cls = allClasses.find(c => c.class_name?.toLowerCase() === clean ||
        c.class_code?.toLowerCase() === clean ||
        c.grade_level?.toLowerCase() === clean);
    if (cls)
        return cls;
    // 2. Secondary matching: extract number from input
    const numbersOnly = clean.replace(/[^0-9]/g, '');
    if (!numbersOnly)
        return null;
    // Find all classes that match this exact grade number
    const candidateClasses = allClasses.filter(c => {
        const nameNum = c.class_name?.replace(/[^0-9]/g, '');
        const gradeNum = c.grade_level?.replace(/[^0-9]/g, '');
        return nameNum === numbersOnly || gradeNum === numbersOnly;
    });
    if (candidateClasses.length === 0)
        return null;
    if (candidateClasses.length === 1)
        return candidateClasses[0];
    // Resolve preference if multiple candidates:
    const isAdvancedInput = clean.includes('adv') || clean.includes('comp') || clean.includes('competition');
    if (isAdvancedInput) {
        const advCls = candidateClasses.find(c => c.class_name?.toLowerCase().includes('adv') ||
            c.class_name?.toLowerCase().includes('comp'));
        if (advCls)
            return advCls;
    }
    // Prefer base class without advanced/competition flags
    const baseCls = candidateClasses.find(c => !c.class_name?.toLowerCase().includes('adv') &&
        !c.class_name?.toLowerCase().includes('comp') &&
        !c.class_name?.toLowerCase().includes('+'));
    if (baseCls)
        return baseCls;
    return candidateClasses[0];
}
/**
 * Resolves a raw subject name/alias string to a database Subject record.
 */
function resolveSubject(rawSubject, allSubjects, allAliases) {
    const clean = rawSubject.trim().toLowerCase();
    if (!clean)
        return null;
    const key = (0, normalization_1.getNormalizedKey)(clean);
    // 1. Match canonical subjects by key or name
    let subj = allSubjects.find(s => s.normalized_key === key || s.canonical_name.toLowerCase() === clean);
    if (subj)
        return subj;
    // 2. Match aliases
    const alias = allAliases.find(a => a.normalized_key === key || a.alias.toLowerCase() === clean);
    if (alias) {
        const parentSubj = allSubjects.find(s => s.id === alias.subject_id);
        if (parentSubj)
            return parentSubj;
    }
    return null;
}
/**
 * Dynamic column resolver using mapping configuration.
 */
function getMappedCol(row, mapping, fieldKey, fallbacks) {
    const mappedName = mapping?.[fieldKey];
    if (mappedName) {
        const val = row[mappedName];
        if (val !== undefined)
            return String(val).trim();
    }
    for (const name of fallbacks) {
        const val = row[name];
        if (val !== undefined)
            return String(val).trim();
        const matchedKey = Object.keys(row).find(k => k.toLowerCase().trim() === name.toLowerCase().trim());
        if (matchedKey) {
            const v = row[matchedKey];
            if (v !== undefined)
                return String(v).trim();
        }
    }
    return '';
}
class GoogleSheetSyncJob {
    /**
     * Triggers the dynamic synchronization engine against a source or all active sources.
     */
    static async sync(sourceId, triggeredByUserId) {
        const results = [];
        // Fetch target sources
        let sources = [];
        if (sourceId) {
            const src = await database_1.default.googleSheetSource.findUnique({ where: { id: sourceId } });
            if (src)
                sources.push(src);
        }
        else {
            sources = await database_1.default.googleSheetSource.findMany({ where: { is_enabled: true } });
        }
        if (sources.length === 0) {
            return { success: false, message: 'No enabled Google Sheet sync sources found.' };
        }
        // Load caching tables globally once to optimize performance
        const allClasses = await database_1.default.class.findMany();
        const allSubjects = await database_1.default.subject.findMany();
        const allAliases = await database_1.default.subjectAlias.findMany();
        const allClassSubjects = await database_1.default.classSubject.findMany();
        // Cache set of active class_id + subject_id links
        const classSubjectSet = new Set();
        allClassSubjects.forEach(cs => {
            classSubjectSet.add(`${cs.class_id}_${cs.subject_id}`);
        });
        for (const source of sources) {
            console.log(`ℹ️ [Sync Engine] Creating sync log for source ${source.id}...`);
            const syncLog = await database_1.default.googleSheetSyncLog.create({
                data: {
                    sync_type: 'video_lectures',
                    source_id: source.id,
                    user_id: triggeredByUserId || null,
                    status: 'pending',
                    start_time: new Date(),
                },
            });
            console.log(`ℹ️ [Sync Engine] Created sync log with ID: ${syncLog.id}`);
            const errors = [];
            let rowsProcessed = 0;
            let rowsCreated = 0;
            let rowsUpdated = 0;
            let rowsDeleted = 0;
            let rowsFailed = 0;
            try {
                console.log(`🔄 [Sync Engine] Syncing source "${source.name}" (${source.spreadsheet_id})...`);
                const tabs = await googleSheetsService_1.GoogleSheetsService.getSpreadsheetTabs(source.spreadsheet_id);
                const sheetNameStr = source.sheet_name ? source.sheet_name.trim() : '';
                let targetTabs = [];
                if (!sheetNameStr || sheetNameStr === '*' || sheetNameStr.toLowerCase() === 'all') {
                    targetTabs = tabs;
                }
                else {
                    targetTabs = sheetNameStr.split(',').map((t) => t.trim()).filter(Boolean);
                }
                const rawRows = [];
                for (const tab of targetTabs) {
                    try {
                        const rows = await googleSheetsService_1.GoogleSheetsService.readSpreadsheet(source.spreadsheet_id, tab, tabs);
                        rows.forEach((r) => {
                            r.__tab_name = tab;
                        });
                        rawRows.push(...rows);
                    }
                    catch (tabErr) {
                        console.error(`❌ [Sync Engine] Error reading tab "${tab}":`, tabErr.message);
                        errors.push(`Failed to read tab "${tab}": ${tabErr.message}`);
                    }
                }
                rowsProcessed = rawRows.length;
                // Fetch all video lectures to build compound unique key map
                const allVideoLectures = await database_1.default.videoLecture.findMany();
                const dbUniqueKeyMap = new Map();
                allVideoLectures.forEach(lec => {
                    const uniqueKey = `${lec.date}_${lec.time}_${lec.class_id}_${lec.subject_id}`;
                    dbUniqueKeyMap.set(uniqueKey, lec);
                });
                // Filter those belonging to this source for diff checks
                const existingLectures = allVideoLectures.filter(l => l.sync_source_id === source.id);
                const existingMap = new Map();
                existingLectures.forEach(lec => {
                    if (lec.sheet_row_id) {
                        existingMap.set(lec.sheet_row_id, lec);
                    }
                });
                const matchedSheetIds = new Set();
                const processedUniqueKeys = new Set();
                const slotCounters = new Map();
                const mapping = source.column_mapping;
                const lecturesToCreate = [];
                const lecturesToUpdate = [];
                const lecturesToMigrate = [];
                for (const row of rawRows) {
                    const rowNum = row.__sheet_row_num;
                    const tabName = row.__tab_name || 'Videos';
                    // Resolve values dynamically
                    const date = getMappedCol(row, mapping, 'date', ['Date', 'date', 'DATE']);
                    const rawTime = getMappedCol(row, mapping, 'time', ['Time', 'time', 'TIME', 'Entry', 'entry']);
                    const className = getMappedCol(row, mapping, 'class', ['Class', 'class', 'CLASS', 'Batch', 'batch']);
                    const subjectName = getMappedCol(row, mapping, 'subject', ['Subject', 'subject', 'SUBJECT']);
                    const videoLink = getMappedCol(row, mapping, 'video_url', ['Link', 'link', 'LINK', 'YouTube Link', 'video_url']);
                    const title = getMappedCol(row, mapping, 'title', ['Title', 'title', 'Topic', 'topic', 'CHAPTER', 'chapter']);
                    const teacherName = getMappedCol(row, mapping, 'teacher_name', ['Teacher', 'teacher', 'instructor', 'Teacher Name']);
                    const description = getMappedCol(row, mapping, 'description', ['Description', 'description', 'Details', 'details']);
                    const topic = getMappedCol(row, mapping, 'topic', ['Topic', 'topic', 'Subtopic', 'subtopic']);
                    const chapter = getMappedCol(row, mapping, 'chapter', ['Chapter', 'chapter', 'Chapter Name']);
                    const notes = getMappedCol(row, mapping, 'notes', ['Notes', 'notes', 'Resources', 'resources']);
                    const explicitId = getMappedCol(row, mapping, 'id', ['ID', 'id', 'Row ID', 'Video ID', 'Sr No.', 'Sr No']);
                    // Required Validation
                    if (!date || !className || !subjectName || !videoLink) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} skipped: Missing required columns (Date, Class, Subject, Link)`);
                        rowsFailed++;
                        continue;
                    }
                    const validUrl = encodeYouTubeUrl(videoLink);
                    if (!validUrl) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} skipped: Invalid YouTube URL ("${videoLink}")`);
                        rowsFailed++;
                        continue;
                    }
                    // Phase 2: Class Matching
                    const matchedClass = resolveClass(className, allClasses);
                    if (!matchedClass) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} failed: Class Not Found ("${className}")`);
                        rowsFailed++;
                        continue;
                    }
                    const class_id = matchedClass.id;
                    // Phase 3: Subject Matching
                    const matchedSubject = resolveSubject(subjectName, allSubjects, allAliases);
                    if (!matchedSubject) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} failed: Subject Not Found ("${subjectName}")`);
                        rowsFailed++;
                        continue;
                    }
                    const subject_id = matchedSubject.id;
                    // Verify Class-Subject link in database
                    if (!classSubjectSet.has(`${class_id}_${subject_id}`)) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} failed: Subject "${matchedSubject.canonical_name}" not mapped to Class "${matchedClass.class_name}"`);
                        rowsFailed++;
                        continue;
                    }
                    // Determine time (blank or duplicate resolution)
                    const slotKey = `${date}_${class_id}_${subject_id}`;
                    let currentCount = slotCounters.get(slotKey) || 0;
                    currentCount++;
                    slotCounters.set(slotKey, currentCount);
                    let time = rawTime;
                    if (!time) {
                        const displayMinute = String(currentCount).padStart(2, '0');
                        time = `12:${displayMinute} PM`;
                    }
                    // Prevent compound key unique constraint violation within the current run
                    let uniqueKey = `${date}_${time}_${class_id}_${subject_id}`;
                    if (processedUniqueKeys.has(uniqueKey)) {
                        if (rawTime) {
                            time = adjustTimeMinutes(rawTime, currentCount);
                        }
                        else {
                            time = adjustTimeMinutes(time, currentCount);
                        }
                        uniqueKey = `${date}_${time}_${class_id}_${subject_id}`;
                    }
                    if (processedUniqueKeys.has(uniqueKey)) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} skipped: Duplicate lecture scheduled for same class, subject, date, and time (${matchedClass.class_name}, ${matchedSubject.canonical_name}, ${date}, ${time})`);
                        rowsFailed++;
                        continue;
                    }
                    processedUniqueKeys.add(uniqueKey);
                    // Generate dynamic unique row ID including tab prefix
                    let sheet_row_id = '';
                    const tabPrefix = tabName.trim().toLowerCase().replace(/\s+/g, '_');
                    if (explicitId) {
                        sheet_row_id = `${source.id}_${tabPrefix}_${explicitId}`;
                    }
                    else {
                        const hashInput = `${source.id}_${tabPrefix}_${validUrl}_${class_id}_${subject_id}_${date}_${time}`;
                        sheet_row_id = crypto_1.default.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);
                    }
                    if (matchedSheetIds.has(sheet_row_id)) {
                        errors.push(`Tab "${tabName}", Row ${rowNum} skipped: Duplicate sheet row ID (${sheet_row_id})`);
                        rowsFailed++;
                        continue;
                    }
                    matchedSheetIds.add(sheet_row_id);
                    // Phase 11-12: Duplicate Check against existing database records
                    let existingRecord = existingMap.get(sheet_row_id);
                    if (!existingRecord) {
                        existingRecord = dbUniqueKeyMap.get(uniqueKey);
                        if (existingRecord) {
                            // Automatically migrate/update the sheet_row_id in the database to prevent crashes
                            lecturesToMigrate.push({ id: existingRecord.id, sheet_row_id });
                            existingRecord.sheet_row_id = sheet_row_id;
                            existingMap.set(sheet_row_id, existingRecord);
                        }
                    }
                    const finalTitle = title || `${matchedSubject.canonical_name} - ${date}`;
                    const payload = {
                        date,
                        time,
                        class_id,
                        subject_id,
                        video_url: validUrl,
                        title: finalTitle,
                        teacher_name: teacherName || null,
                        description: description || null,
                        topic: topic || null,
                        chapter: chapter || null,
                        notes: notes || null,
                        sync_source_id: source.id,
                        status: 'active',
                    };
                    if (!existingRecord) {
                        lecturesToCreate.push({
                            ...payload,
                            sheet_row_id,
                        });
                        existingMap.set(sheet_row_id, true);
                    }
                    else {
                        const hasChanged = existingRecord.date !== date ||
                            existingRecord.time !== time ||
                            existingRecord.class_id !== class_id ||
                            existingRecord.subject_id !== subject_id ||
                            existingRecord.video_url !== validUrl ||
                            existingRecord.title !== finalTitle ||
                            existingRecord.teacher_name !== (teacherName || null) ||
                            existingRecord.description !== (description || null) ||
                            existingRecord.topic !== (topic || null) ||
                            existingRecord.chapter !== (chapter || null) ||
                            existingRecord.notes !== (notes || null);
                        if (hasChanged) {
                            lecturesToUpdate.push({ id: existingRecord.id, data: payload });
                            existingMap.set(sheet_row_id, { ...existingRecord, ...payload });
                        }
                    }
                }
                // Run migrations in parallel
                if (lecturesToMigrate.length > 0) {
                    console.log(`ℹ️ [Sync Engine] Migrating ${lecturesToMigrate.length} sheet_row_id values...`);
                    await Promise.all(lecturesToMigrate.map(m => database_1.default.videoLecture.update({
                        where: { id: m.id },
                        data: { sheet_row_id: m.sheet_row_id }
                    })));
                }
                // Run updates in parallel
                if (lecturesToUpdate.length > 0) {
                    console.log(`ℹ️ [Sync Engine] Updating ${lecturesToUpdate.length} existing lectures...`);
                    await Promise.all(lecturesToUpdate.map(u => database_1.default.videoLecture.update({
                        where: { id: u.id },
                        data: u.data
                    })));
                    rowsUpdated = lecturesToUpdate.length;
                }
                // Run creations in bulk
                if (lecturesToCreate.length > 0) {
                    console.log(`ℹ️ [Sync Engine] Bulk creating ${lecturesToCreate.length} new lectures...`);
                    await database_1.default.videoLecture.createMany({
                        data: lecturesToCreate
                    });
                    rowsCreated = lecturesToCreate.length;
                }
                // Phase 6: Handle Deletions (removed rows)
                const idsToDelete = [];
                existingLectures.forEach(l => {
                    if (l.sheet_row_id && !matchedSheetIds.has(l.sheet_row_id)) {
                        idsToDelete.push(l.id);
                    }
                });
                if (idsToDelete.length > 0) {
                    await database_1.default.videoLecture.deleteMany({
                        where: { id: { in: idsToDelete } },
                    });
                    rowsDeleted = idsToDelete.length;
                }
                // Check if log still exists in DB
                const checkLog = await database_1.default.googleSheetSyncLog.findUnique({ where: { id: syncLog.id } });
                console.log(`ℹ️ [Sync Engine] Log check before update: ${checkLog ? 'FOUND' : 'NOT FOUND'}`);
                // Update Log (Success)
                await database_1.default.googleSheetSyncLog.update({
                    where: { id: syncLog.id },
                    data: {
                        end_time: new Date(),
                        rows_processed: rowsProcessed,
                        rows_created: rowsCreated,
                        rows_updated: rowsUpdated,
                        rows_deleted: rowsDeleted,
                        rows_failed: rowsFailed,
                        status: 'success',
                        error_message: errors.length > 0 ? errors.join('\n') : null,
                    },
                });
                // Update Source Last Sync Status
                await database_1.default.googleSheetSource.update({
                    where: { id: source.id },
                    data: {
                        last_sync: new Date(),
                        last_sync_status: 'success',
                    },
                });
                results.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    success: true,
                    processed: rowsProcessed,
                    created: rowsCreated,
                    updated: rowsUpdated,
                    deleted: rowsDeleted,
                    failed: rowsFailed,
                    warnings: errors,
                });
            }
            catch (err) {
                console.error(`❌ [Sync Engine] Source "${source.name}" sync crashed:`, err);
                await database_1.default.googleSheetSyncLog.update({
                    where: { id: syncLog.id },
                    data: {
                        end_time: new Date(),
                        status: 'failed',
                        rows_processed: rowsProcessed,
                        rows_created: rowsCreated,
                        rows_updated: rowsUpdated,
                        rows_deleted: rowsDeleted,
                        rows_failed: rowsFailed,
                        error_message: `Fatal Error: ${err.message}\n${err.stack || ''}`,
                    },
                });
                await database_1.default.googleSheetSource.update({
                    where: { id: source.id },
                    data: {
                        last_sync: new Date(),
                        last_sync_status: 'failed',
                    },
                });
                results.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    success: false,
                    error: err.message,
                });
            }
        }
        return { success: true, results };
    }
}
exports.GoogleSheetSyncJob = GoogleSheetSyncJob;
//# sourceMappingURL=googleSheetSyncJob.js.map
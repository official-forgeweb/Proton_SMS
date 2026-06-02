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
 * In-memory Class resolver to map raw class/grade strings to ERP Class IDs instantly.
 */
function resolveClassCached(rawClass, allClasses) {
    const clean = rawClass.trim();
    if (!clean)
        return null;
    // 1. Direct case-insensitive match on name, code, or grade level
    const cleanLower = clean.toLowerCase();
    let cls = allClasses.find((c) => c.class_name?.toLowerCase() === cleanLower ||
        c.class_code?.toLowerCase() === cleanLower ||
        c.grade_level?.toLowerCase() === cleanLower);
    if (cls)
        return cls.id;
    // 2. Secondary matching: Strip non-numeric to map numbers (e.g. "Class 10th" -> "10")
    const numbersOnly = clean.replace(/[^0-9]/g, '');
    if (numbersOnly) {
        cls = allClasses.find((c) => c.class_name?.includes(numbersOnly) ||
            c.class_code?.includes(numbersOnly) ||
            c.grade_level?.includes(numbersOnly));
        if (cls)
            return cls.id;
    }
    return null;
}
/**
 * Cached Subject normalizer. Performs in-memory lookups first.
 * Auto-creates new subjects master record only if it doesn't exist.
 */
/**
 * Synchronous in-memory Canonical Subject resolver.
 * Eliminates up to 6,000+ database hits in large sheets loops.
 */
function resolveCanonicalSubjectCached(rawName, subjectCache) {
    if (!rawName)
        return '';
    const clean = rawName.trim();
    const key = (0, normalization_1.getNormalizedKey)(clean);
    // 1. Direct normalized key match in memory cache
    if (subjectCache.has(key)) {
        return subjectCache.get(key);
    }
    // 2. Direct case-insensitive raw string match
    const cleanLower = clean.toLowerCase();
    if (subjectCache.has(cleanLower)) {
        return subjectCache.get(cleanLower);
    }
    // 3. Fallback Manual mappings
    const manualMappings = {
        'mathematics': 'Mathematics',
        'maths': 'Maths',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'biology': 'Biology',
        'sst': 'SST',
        'english': 'English',
        'hindi': 'Hindi',
        'computer': 'Computer',
        'science': 'Science'
    };
    const resolved = manualMappings[cleanLower];
    if (resolved)
        return resolved;
    // 4. Fallback Title Case formatting
    return clean
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
/**
 * Cached Subject normalizer. Performs in-memory lookups first.
 * Auto-creates new subjects master record only if it doesn't exist.
 */
async function ensureSubjectExistsCached(name, subjectCache, existingSubjectKeys) {
    if (!name || name.trim() === '')
        return '';
    // Resolve canonical name completely in-memory!
    const canonical = resolveCanonicalSubjectCached(name, subjectCache);
    const key = (0, normalization_1.getNormalizedKey)(canonical);
    if (!existingSubjectKeys.has(key)) {
        try {
            await database_1.default.subject.create({
                data: {
                    canonical_name: canonical,
                    normalized_key: key,
                    is_active: true,
                },
            });
            existingSubjectKeys.add(key);
            subjectCache.set(key, canonical);
            console.log(`✨ [Normalization Engine] Cache inline auto-created new subject: "${canonical}"`);
        }
        catch (err) {
            // Gracefully ignore race conditions
        }
    }
    return canonical;
}
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
 * Helper to fetch a value from parsed sheet row flexibly and case-insensitively.
 */
function getCol(row, ...possibleNames) {
    // 1. Try exact match first
    for (const name of possibleNames) {
        const val = row[name];
        if (val !== undefined)
            return String(val).trim();
    }
    // 2. Try case-insensitive matching against all keys of the row
    const rowKeys = Object.keys(row);
    for (const name of possibleNames) {
        const searchName = name.toLowerCase().trim();
        const matchedKey = rowKeys.find((k) => k.toLowerCase().trim() === searchName);
        if (matchedKey) {
            const val = row[matchedKey];
            if (val !== undefined)
                return String(val).trim();
        }
    }
    return '';
}
/**
 * Highly Optimized, Production-grade Google Sheet Synchronizer
 */
class GoogleSheetSyncJob {
    /**
     * Triggers the full database synchronization against the Google Sheet configuration.
     * Supports a `force` parameter to override the "google_sheets_enabled" toggle (for Manual Sync).
     */
    static async sync(force = false) {
        const syncLog = await database_1.default.googleSheetSyncLog.create({
            data: {
                sync_type: 'video_lectures',
                status: 'pending',
                start_time: new Date(),
            },
        });
        const errors = [];
        let rowsProcessed = 0;
        let rowsCreated = 0;
        let rowsUpdated = 0;
        let rowsDeleted = 0;
        try {
            // 1. Fetch Dynamic Settings from the database
            let settings = await database_1.default.systemSetting.findUnique({
                where: { id: 'global' },
            });
            if (!settings) {
                settings = await database_1.default.systemSetting.create({
                    data: { id: 'global' },
                });
            }
            // Check if integration is globally disabled
            if (!settings.google_sheets_enabled && !force) {
                await database_1.default.googleSheetSyncLog.update({
                    where: { id: syncLog.id },
                    data: {
                        end_time: new Date(),
                        status: 'failed',
                        error_message: 'Google Sheets synchronization is disabled in System Settings.',
                    },
                });
                return { success: false, message: 'Sync disabled' };
            }
            // Resolve spreadsheet ID and sheet name
            const spreadsheetId = settings.google_spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;
            const defaultSheetName = settings.google_sheet_name || process.env.GOOGLE_SHEET_NAME || 'Videos';
            if (!spreadsheetId) {
                throw new Error('Google Spreadsheet ID not configured (neither in Admin Settings nor in server .env)');
            }
            // --- HIGH PERFORMANCE PRE-FETCHING & CACHING ---
            console.log('⚡ [Sheets Sync] Loading database cache tables...');
            const allClasses = await database_1.default.class.findMany();
            // Load all subjects and aliases to resolve canonical subjects completely in memory
            const allSubjects = await database_1.default.subject.findMany();
            const allAliases = await database_1.default.subjectAlias.findMany({ include: { subject: true } });
            const existingSubjectKeys = new Set(allSubjects.map((s) => s.normalized_key));
            const subjectCache = new Map();
            allSubjects.forEach(s => {
                subjectCache.set(s.normalized_key, s.canonical_name);
                subjectCache.set(s.canonical_name.toLowerCase().trim(), s.canonical_name);
            });
            allAliases.forEach(a => {
                if (a.subject) {
                    subjectCache.set(a.normalized_key, a.subject.canonical_name);
                    subjectCache.set(a.alias.toLowerCase().trim(), a.subject.canonical_name);
                }
            });
            console.log(`🔄 [Sheets Sync] Fetching sheet tabs for Spreadsheet "${spreadsheetId}"...`);
            const tabs = await googleSheetsService_1.GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
            const targetTabs = tabs.length > 0 ? tabs : [defaultSheetName];
            console.log(`🔄 [Sheets Sync] Target tabs to sync: ${targetTabs.join(', ')}`);
            // 2. Fetch rows from all available tabs in Google Sheets API
            let combinedParsedRows = [];
            for (const tab of targetTabs) {
                try {
                    console.log(`🔄 [Sheets Sync] Reading tab "${tab}"...`);
                    const rows = await googleSheetsService_1.GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
                    const tagged = rows.map((r) => ({ ...r, __tab_source: tab }));
                    combinedParsedRows = combinedParsedRows.concat(tagged);
                }
                catch (tabErr) {
                    console.error(`❌ [Sheets Sync] Failed to read tab "${tab}":`, tabErr.message);
                    errors.push(`Tab "${tab}" sync failed: ${tabErr.message}`);
                }
            }
            const parsedRows = combinedParsedRows;
            rowsProcessed = parsedRows.length;
            console.log(`📊 [Sheets Sync] Retrieved ${rowsProcessed} rows in total. Starting parsing...`);
            // 3. Get existing database records with a non-null sheet_row_id to compare
            const existingLectures = await database_1.default.videoLecture.findMany({
                where: { NOT: { sheet_row_id: null } },
            });
            const existingMap = new Map();
            existingLectures.forEach((lec) => {
                if (lec.sheet_row_id) {
                    existingMap.set(lec.sheet_row_id, lec);
                }
            });
            const matchedSheetIds = new Set();
            const recordsToCreate = [];
            // 4. Parse & Process Sheet Rows in-memory
            for (const row of parsedRows) {
                const rowNum = row.__sheet_row_num;
                const tabSource = row.__tab_source;
                // Flexible Header Mapping
                const date = getCol(row, 'Date', 'date', 'DATE');
                // Dynamic time resolution: fallback to 12:00 PM if time/entry is missing
                let time = getCol(row, 'Time', 'time', 'TIME', 'ENTRY', 'entry');
                if (!time) {
                    time = '12:00 PM';
                }
                const className = getCol(row, 'Class', 'class', 'CLASS', 'grade', 'Grade', 'batch', 'Batch');
                const subjectName = getCol(row, 'Subject', 'subject', 'SUBJECT');
                const videoLink = getCol(row, 'Link', 'link', 'LINK', 'YouTube Link', 'video_url', 'YouTube');
                // Flexible title matching
                const customTitle = getCol(row, 'TOPIC & VIDEO TITLE', 'NAME OF CHAPTER', 'Title', 'title', 'Topic', 'topic');
                // Explicit ID check
                const explicitId = getCol(row, 'ID', 'id', 'Video ID', 'video_id', 'Row ID', 'SR NO.', 'Sr No.');
                // Validation - skip empty rows or rows missing required columns
                if (!date || !className || !subjectName || !videoLink) {
                    errors.push(`Tab "${tabSource}" Row ${rowNum} skipped: Missing required columns (Date, Class, Subject, Link)`);
                    continue;
                }
                const validUrl = encodeYouTubeUrl(videoLink);
                if (!validUrl) {
                    // Soft skip for text placeholders/drafts in the Link column
                    errors.push(`Tab "${tabSource}" Row ${rowNum} skipped: Invalid YouTube Link format ("${videoLink}")`);
                    continue;
                }
                // Map Class to existing ERP Class via in-memory cache
                let class_id = resolveClassCached(className, allClasses);
                if (!class_id) {
                    // Fallback: Use the first available active class in the database so the video imports instead of being discarded
                    if (allClasses.length > 0) {
                        class_id = allClasses[0].id;
                    }
                    else {
                        errors.push(`Tab "${tabSource}" Row ${rowNum} skipped: Class name "${className}" not found and no active classes exist in database`);
                        continue;
                    }
                }
                // Normalize and auto-create Subject in Master via in-memory cache
                const canonicalSubject = await ensureSubjectExistsCached(subjectName, subjectCache, existingSubjectKeys);
                // Generate dynamic unique row ID (incorporating tab name to prevent duplicate row index conflicts)
                let sheet_row_id = explicitId ? `${tabSource}_${explicitId}` : '';
                if (!sheet_row_id) {
                    // Fallback: Deterministic Hash including the tab name
                    const rawHashKey = `${tabSource}_${date}_${time}_${class_id}_${canonicalSubject.toLowerCase()}`;
                    sheet_row_id = crypto_1.default.createHash('sha256').update(rawHashKey).digest('hex').substring(0, 32);
                }
                matchedSheetIds.add(sheet_row_id);
                const existingRecord = existingMap.get(sheet_row_id);
                const titleVal = customTitle || `${canonicalSubject} - ${date}`;
                if (!existingRecord) {
                    // Push to BULK INSERT array
                    recordsToCreate.push({
                        date,
                        time,
                        class_id,
                        subject: canonicalSubject,
                        video_url: validUrl,
                        title: titleVal,
                        sheet_row_id,
                        status: 'active',
                    });
                }
                else {
                    // UPDATE Operation (Only run if values have changed to prevent redundant DB writes)
                    const needsUpdate = existingRecord.date !== date ||
                        existingRecord.time !== time ||
                        existingRecord.class_id !== class_id ||
                        existingRecord.subject !== canonicalSubject ||
                        existingRecord.video_url !== validUrl ||
                        existingRecord.title !== titleVal;
                    if (needsUpdate) {
                        try {
                            await database_1.default.videoLecture.update({
                                where: { id: existingRecord.id },
                                data: {
                                    date,
                                    time,
                                    class_id,
                                    subject: canonicalSubject,
                                    video_url: validUrl,
                                    title: titleVal,
                                },
                            });
                            rowsUpdated++;
                        }
                        catch (updateErr) {
                            errors.push(`Tab "${tabSource}" Row ${rowNum} update failed: ${updateErr.message}`);
                        }
                    }
                }
            }
            // --- BULK BATCH DB WRITES ---
            // 1. Bulk Create
            if (recordsToCreate.length > 0) {
                console.log(`📥 [Sheets Sync] Bulk inserting ${recordsToCreate.length} new records...`);
                // Using createMany for sub-second database insertions
                await database_1.default.videoLecture.createMany({
                    data: recordsToCreate,
                    skipDuplicates: true,
                });
                rowsCreated = recordsToCreate.length;
            }
            // 2. Bulk Delete (Remove records deleted from Google Sheets)
            const idsToDelete = [];
            for (const [rowId, lec] of existingMap.entries()) {
                if (!matchedSheetIds.has(rowId)) {
                    idsToDelete.push(lec.id);
                }
            }
            if (idsToDelete.length > 0) {
                console.log(`🗑️ [Sheets Sync] Bulk deleting ${idsToDelete.length} stale records...`);
                await database_1.default.videoLecture.deleteMany({
                    where: { id: { in: idsToDelete } },
                });
                rowsDeleted = idsToDelete.length;
            }
            console.log(`✅ [Sheets Sync] Completed: Created=${rowsCreated}, Updated=${rowsUpdated}, Deleted=${rowsDeleted}. Errors: ${errors.length}`);
            // 6. Update Sync Audit Log (Success)
            await database_1.default.googleSheetSyncLog.update({
                where: { id: syncLog.id },
                data: {
                    end_time: new Date(),
                    rows_processed: rowsProcessed,
                    rows_created: rowsCreated,
                    rows_updated: rowsUpdated,
                    rows_deleted: rowsDeleted,
                    status: 'success',
                    error_message: errors.length > 0 ? `Warnings occurred:\n${errors.join('\n')}` : null,
                },
            });
            return {
                success: true,
                summary: {
                    processed: rowsProcessed,
                    created: rowsCreated,
                    updated: rowsUpdated,
                    deleted: rowsDeleted,
                },
                warnings: errors,
            };
        }
        catch (error) {
            console.error('❌ [Sheets Sync] Job failed:', error.message);
            // Update Sync Audit Log (Failed)
            await database_1.default.googleSheetSyncLog.update({
                where: { id: syncLog.id },
                data: {
                    end_time: new Date(),
                    rows_processed: rowsProcessed,
                    rows_created: rowsCreated,
                    rows_updated: rowsUpdated,
                    rows_deleted: rowsDeleted,
                    status: 'failed',
                    error_message: `Fatal error: ${error.message}\n\nStack:\n${error.stack || ''}`,
                },
            });
            throw error;
        }
    }
}
exports.GoogleSheetSyncJob = GoogleSheetSyncJob;
//# sourceMappingURL=googleSheetSyncJob.js.map
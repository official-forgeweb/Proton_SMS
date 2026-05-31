import crypto from 'crypto';
import prisma from '../config/database';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { ensureSubjectExists } from '../utils/normalization';

/**
 * Class resolver to map raw class/grade strings from Google Sheets to ERP Class IDs.
 */
async function resolveClass(rawClass: string): Promise<string | null> {
  const clean = rawClass.trim();
  if (!clean) return null;

  // 1. Direct query matching name, code, or grade level (case-insensitive)
  let cls = await prisma.class.findFirst({
    where: {
      OR: [
        { class_name: { equals: clean, mode: 'insensitive' } },
        { class_code: { equals: clean, mode: 'insensitive' } },
        { grade_level: { equals: clean, mode: 'insensitive' } },
      ],
    },
  });

  if (cls) return cls.id;

  // 2. Secondary matching: Strip non-numeric to map numbers (e.g. "Class 10th" -> "10")
  const numbersOnly = clean.replace(/[^0-9]/g, '');
  if (numbersOnly) {
    cls = await prisma.class.findFirst({
      where: {
        OR: [
          { class_name: { contains: numbersOnly } },
          { class_code: { contains: numbersOnly } },
          { grade_level: { contains: numbersOnly } },
        ],
      },
    });
    if (cls) return cls.id;
  }

  return null;
}

/**
 * Normalizes YouTube url
 */
function encodeYouTubeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return trimmed;
  }
  return '';
}

/**
 * Helper to fetch a value from parsed sheet row flexibly.
 */
function getCol(row: any, ...possibleNames: string[]): string {
  for (const name of possibleNames) {
    const val = row[name];
    if (val !== undefined) return String(val).trim();
  }
  return '';
}

/**
 * Production-grade Google Sheet Synchronizer
 */
export class GoogleSheetSyncJob {
  /**
   * Triggers the full database synchronization against the Google Sheet configuration.
   * Supports a `force` parameter to override the "google_sheets_enabled" toggle (for Manual Sync).
   */
  public static async sync(force = false): Promise<any> {
    const syncLog = await prisma.googleSheetSyncLog.create({
      data: {
        sync_type: 'video_lectures',
        status: 'pending',
        start_time: new Date(),
      },
    });

    const errors: string[] = [];
    let rowsProcessed = 0;
    let rowsCreated = 0;
    let rowsUpdated = 0;
    let rowsDeleted = 0;

    try {
      // 1. Fetch Dynamic Settings from the database
      let settings = await prisma.systemSetting.findUnique({
        where: { id: 'global' },
      });

      if (!settings) {
        settings = await prisma.systemSetting.create({
          data: { id: 'global' },
        });
      }

      // Check if integration is globally disabled
      if (!settings.google_sheets_enabled && !force) {
        await prisma.googleSheetSyncLog.update({
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
      const sheetName = settings.google_sheet_name || process.env.GOOGLE_SHEET_NAME || 'Videos';

      if (!spreadsheetId) {
        throw new Error(
          'Google Spreadsheet ID not configured (neither in Admin Settings nor in server .env)'
        );
      }

      console.log(
        `🔄 [Sheets Sync] Starting sync for Spreadsheet "${spreadsheetId}", tab "${sheetName}"...`
      );

      // 2. Fetch rows from Google Sheets API
      const parsedRows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, sheetName);
      rowsProcessed = parsedRows.length;

      // 3. Get existing records with a non-null sheet_row_id to compare
      const existingLectures = await prisma.videoLecture.findMany({
        where: { NOT: { sheet_row_id: null } },
      });

      const existingMap = new Map<string, any>();
      existingLectures.forEach((lec) => {
        if (lec.sheet_row_id) {
          existingMap.set(lec.sheet_row_id, lec);
        }
      });

      const matchedSheetIds = new Set<string>();

      // 4. Process Sheet Rows
      for (const row of parsedRows) {
        const rowNum = row.__sheet_row_num;

        // Flexible Header Mapping
        const date = getCol(row, 'Date', 'date', 'DATE');
        const time = getCol(row, 'Time', 'time', 'TIME');
        const className = getCol(row, 'Class', 'class', 'grade', 'Grade', 'batch', 'Batch');
        const subjectName = getCol(row, 'Subject', 'subject', 'SUBJECT');
        const videoLink = getCol(row, 'Link', 'link', 'YouTube Link', 'video_url', 'YouTube');
        const customTitle = getCol(row, 'Title', 'title', 'Topic', 'topic');
        
        // Explicit ID check
        const explicitId = getCol(row, 'ID', 'id', 'Video ID', 'video_id', 'Row ID');

        // Validation - skip empty rows or rows missing required columns
        if (!date || !time || !className || !subjectName || !videoLink) {
          errors.push(
            `Row ${rowNum} skipped: Missing required columns (Date, Time, Class, Subject, Link)`
          );
          continue;
        }

        const validUrl = encodeYouTubeUrl(videoLink);
        if (!validUrl) {
          errors.push(`Row ${rowNum} skipped: Invalid YouTube Link format ("${videoLink}")`);
          continue;
        }

        // Map Class to existing ERP Class
        const class_id = await resolveClass(className);
        if (!class_id) {
          errors.push(
            `Row ${rowNum} skipped: Class name "${className}" not found in ERP master records`
          );
          continue;
        }

        // Normalize and auto-create Subject in Master if it is new
        const canonicalSubject = await ensureSubjectExists(subjectName);

        // Generate dynamic unique row ID
        let sheet_row_id = explicitId;
        if (!sheet_row_id) {
          // Fallback: Deterministic Hash
          const rawHashKey = `${date}_${time}_${class_id}_${canonicalSubject.toLowerCase()}`;
          sheet_row_id = crypto.createHash('sha256').update(rawHashKey).digest('hex').substring(0, 32);
        }

        matchedSheetIds.add(sheet_row_id);

        const existingRecord = existingMap.get(sheet_row_id);
        const titleVal = customTitle || `${canonicalSubject} - ${date}`;

        if (!existingRecord) {
          // INSERT Operation
          try {
            await prisma.videoLecture.create({
              data: {
                date,
                time,
                class_id,
                subject: canonicalSubject,
                video_url: validUrl,
                title: titleVal,
                sheet_row_id,
                status: 'active',
              },
            });
            rowsCreated++;
          } catch (createErr: any) {
            errors.push(`Row ${rowNum} insert failed: ${createErr.message}`);
          }
        } else {
          // UPDATE Operation (Only run if values have changed to prevent redundant DB writes)
          const needsUpdate =
            existingRecord.date !== date ||
            existingRecord.time !== time ||
            existingRecord.class_id !== class_id ||
            existingRecord.subject !== canonicalSubject ||
            existingRecord.video_url !== validUrl ||
            existingRecord.title !== titleVal;

          if (needsUpdate) {
            try {
              await prisma.videoLecture.update({
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
            } catch (updateErr: any) {
              errors.push(`Row ${rowNum} update failed: ${updateErr.message}`);
            }
          }
        }
      }

      // 5. DELETE Operation
      // Any record in the database with a sheet_row_id that is NOT present in the Google Sheet is deleted!
      for (const [rowId, lec] of existingMap.entries()) {
        if (!matchedSheetIds.has(rowId)) {
          try {
            await prisma.videoLecture.delete({
              where: { id: lec.id },
            });
            rowsDeleted++;
          } catch (deleteErr: any) {
            errors.push(`Sync-delete failed for record ID ${lec.id}: ${deleteErr.message}`);
          }
        }
      }

      console.log(
        `✅ [Sheets Sync] Completed: Created=${rowsCreated}, Updated=${rowsUpdated}, Deleted=${rowsDeleted}. Errors: ${errors.length}`
      );

      // 6. Update Sync Audit Log (Success)
      await prisma.googleSheetSyncLog.update({
        where: { id: syncLog.id },
        data: {
          end_time: new Date(),
          rows_processed: rowsProcessed,
          rows_created: rowsCreated,
          rows_updated: rowsUpdated,
          rows_deleted: rowsDeleted,
          status: errors.length > 0 ? 'success' : 'success', // mark success but store warning details
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
    } catch (error: any) {
      console.error('❌ [Sheets Sync] Job failed:', error.message);

      // Update Sync Audit Log (Failed)
      await prisma.googleSheetSyncLog.update({
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

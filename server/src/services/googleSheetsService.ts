import { google } from 'googleapis';

/**
 * Service to connect to and parse data from Google Sheets dynamically.
 */
export class GoogleSheetsService {
  private static getAuthClient() {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error(
        'Missing Google Sheets API credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) in server .env'
      );
    }

    // Clean up escaped newlines in Vercel/environment private keys
    privateKey = privateKey.replace(/\\n/g, '\n');

    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
  }

  /**
   * Reads a given Spreadsheet ID and Sheet Tab Name, returning a structured JSON list.
   * Leverages dynamic header mapping so no columns are hardcoded.
   */
  public static async readSpreadsheet(
    spreadsheetId: string,
    sheetName: string,
    availableSheetTitles?: string[]
  ): Promise<any[]> {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Dynamic Tab Resolution & Fallback
    let targetSheetName = sheetName;
    const sheetTitles = availableSheetTitles ? [...availableSheetTitles] : [];

    if (sheetTitles.length === 0) {
      try {
        const metadata = await sheets.spreadsheets.get({
          spreadsheetId,
        });
        const availableSheets = metadata.data.sheets || [];
        const titles = availableSheets
          .map((s) => s.properties?.title)
          .filter((t): t is string => !!t);
        sheetTitles.push(...titles);
      } catch (metaErr: any) {
        console.warn(`⚠️ [Sheets Service] Failed to retrieve spreadsheet metadata, attempting direct read:`, metaErr.message);
      }
    }

    if (sheetTitles.length > 0) {
      if (!sheetTitles.includes(sheetName)) {
        // 1. Try case-insensitive exact match
        const caseInsensitiveMatch = sheetTitles.find(
          (t) => t.toLowerCase() === sheetName.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          targetSheetName = caseInsensitiveMatch;
          console.log(`ℹ️ [Sheets Service] Tab name case mismatch resolved: "${sheetName}" -> "${targetSheetName}"`);
        } else {
          // 2. Try looking for tabs containing "video" or "lecture" or "sms"
          const partialMatch = sheetTitles.find(
            (t) =>
              t.toLowerCase().includes('video') ||
              t.toLowerCase().includes('lecture')
          );
          if (partialMatch) {
            targetSheetName = partialMatch;
            console.log(`ℹ️ [Sheets Service] Tab name "${sheetName}" not found. Partial match used: "${targetSheetName}"`);
          } else {
            // 3. Fallback to the very first tab
            targetSheetName = sheetTitles[0];
            console.log(`ℹ️ [Sheets Service] Tab name "${sheetName}" not found. Falling back to first tab: "${targetSheetName}"`);
          }
        }
      }
    }

    // Fetch the values of the resolved sheet.
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: targetSheetName,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Dynamic Header Detection: Find the first row that looks like a header row
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      const lowercaseRow = row.map((cell: any) => String(cell).toLowerCase().trim());
      
      // Count matches against common columns in Proton SMS sheet
      let matchCount = 0;
      const targetKeywords = ['sr no', 'date', 'class', 'subject', 'link', 'name', 'chapter', 'topic'];
      for (const keyword of targetKeywords) {
        if (lowercaseRow.some(cell => cell.includes(keyword))) {
          matchCount++;
        }
      }

      if (matchCount >= 3) {
        headerRowIndex = i;
        console.log(`ℹ️ [Sheets Service] Header row dynamically detected at index ${i} for sheet "${targetSheetName}"`);
        break;
      }
    }

    // The header row represents the column headers (e.g. ["Date", "Class", "Subject", "Title", "Link"])
    const headers = rows[headerRowIndex].map((h: any) => String(h).trim());
    const dataRows = rows.slice(headerRowIndex + 1);

    const parsedRecords = dataRows
      .map((row: any[], index: number) => {
        const record: Record<string, string> = {
          // Store physical sheet row index (1-indexed row number, header is row + 1)
          __sheet_row_num: (headerRowIndex + index + 2).toString(),
        };

        headers.forEach((header, colIndex) => {
          if (!header) return;
          const cellValue = row[colIndex] !== undefined ? String(row[colIndex]).trim() : '';
          
          // Duplicate-Safe Mapping: If this column header already has a non-empty value,
          // do not overwrite it with an empty value from a duplicate column.
          if (record[header] === undefined || (cellValue !== '' && record[header] === '')) {
            record[header] = cellValue;
          }
        });

        return record;
      })
      .filter((record) => {
        // Ignore empty rows where all cells (excluding metadata) are empty strings
        return Object.entries(record).some(
          ([key, value]) => key !== '__sheet_row_num' && value !== ''
        );
      });

    return parsedRecords;
  }

  /**
   * Fetches all sheet tab names from the spreadsheet (except metadata sheets like "SALARY").
   */
  public static async getSpreadsheetTabs(spreadsheetId: string): Promise<string[]> {
    if (!spreadsheetId) return [];
    try {
      const auth = this.getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      const metadata = await sheets.spreadsheets.get({ spreadsheetId });
      const availableSheets = metadata.data.sheets || [];
      return availableSheets
        .map((s) => s.properties?.title)
        .filter((t): t is string => !!t && t.toUpperCase() !== 'SALARY');
    } catch (err: any) {
      console.error('❌ Failed to retrieve sheet tab names:', err.message);
      return [];
    }
  }

  /**
   * Tests the connection to the Google Sheet by fetching basic sheet metadata.
   */
  public static async testConnection(spreadsheetId: string): Promise<boolean> {
    try {
      const auth = this.getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      const res = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      return !!res.data.spreadsheetId;
    } catch (error: any) {
      console.error('❌ Google Sheets connection test failed:', error.message);
      throw error;
    }
  }
}

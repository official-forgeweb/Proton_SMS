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

    // Clean up escaped newlines and double quotes in Vercel/environment private keys
    privateKey = privateKey.trim().replace(/^"/, '').replace(/"$/, '').replace(/\\n/g, '\n');

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
    sheetName: string
  ): Promise<any[]> {
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the values of the sheet.
    // Fetching the whole sheet tab automatically captures all populated columns/rows.
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // The first row represents the column headers (e.g. ["Date", "Class", "Subject", "Title", "Link"])
    const headers = rows[0].map((h: any) => String(h).trim());
    const dataRows = rows.slice(1);

    const parsedRecords = dataRows
      .map((row: any[], index: number) => {
        const record: Record<string, string> = {
          // Store physical sheet row index (1-indexed row number, header is row 1)
          __sheet_row_num: (index + 2).toString(),
        };

        headers.forEach((header, colIndex) => {
          if (!header) return;
          const cellValue = row[colIndex];
          record[header] = cellValue !== undefined ? String(cellValue).trim() : '';
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

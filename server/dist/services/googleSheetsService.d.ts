/**
 * Service to connect to and parse data from Google Sheets dynamically.
 */
export declare class GoogleSheetsService {
    private static getAuthClient;
    /**
     * Reads a given Spreadsheet ID and Sheet Tab Name, returning a structured JSON list.
     * Leverages dynamic header mapping so no columns are hardcoded.
     */
    static readSpreadsheet(spreadsheetId: string, sheetName: string, availableSheetTitles?: string[]): Promise<any[]>;
    /**
     * Fetches all sheet tab names from the spreadsheet (except metadata sheets like "SALARY").
     */
    static getSpreadsheetTabs(spreadsheetId: string): Promise<string[]>;
    /**
     * Tests the connection to the Google Sheet by fetching basic sheet metadata.
     */
    static testConnection(spreadsheetId: string): Promise<boolean>;
}
//# sourceMappingURL=googleSheetsService.d.ts.map
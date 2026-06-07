const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, 'YATIN SIR', tabs);
    
    console.log('Total rows read from YATIN SIR:', rows.length);
    if (rows.length > 0) {
      console.log('Columns in YATIN SIR:', Object.keys(rows[0]));
      console.log('First 5 rows:');
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        console.log(`Row #${rows[i].__sheet_row_num}:`, JSON.stringify(rows[i], null, 2));
      }
    }
  } catch (error) {
    console.error(error);
  }
}

main();

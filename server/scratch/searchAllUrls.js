const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    
    for (const tab of tabs) {
      console.log(`\nChecking tab: ${tab}`);
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      
      let matchCount = 0;
      rows.forEach((row, rIdx) => {
        Object.entries(row).forEach(([col, val]) => {
          if (col !== '__sheet_row_num' && val && String(val).toLowerCase().includes('http')) {
            matchCount++;
            if (matchCount <= 5) {
              console.log(`  Row #${row.__sheet_row_num} [${col}]: ${val}`);
            }
          }
        });
      });
      console.log(`  Total cells with URL: ${matchCount}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

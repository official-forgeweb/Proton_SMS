const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    
    for (const tab of ['SAKSHI MAM', 'SHIKSHA MAM', 'ANSHIKA MAM']) {
      console.log(`\n================= TAB: ${tab} =================`);
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      if (rows.length === 0) {
        console.log('No rows read.');
        continue;
      }
      console.log('Columns:', Object.keys(rows[0]));
      console.log('Rows sample:');
      console.log(JSON.stringify(rows, null, 2));
    }
  } catch (error) {
    console.error(error);
  }
}

main();

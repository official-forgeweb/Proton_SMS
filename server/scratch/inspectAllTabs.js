const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    console.log('Available Tabs:', tabs);
    
    for (const tab of tabs) {
      console.log(`\n================= TAB: ${tab} =================`);
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      console.log(`Rows read: ${rows.length}`);
      
      if (rows.length === 0) continue;
      
      const classCount = {};
      rows.forEach(r => {
        const classKey = Object.keys(r).find(k => k.toLowerCase().includes('class'));
        if (classKey) {
          const className = r[classKey] || 'Empty';
          classCount[className] = (classCount[className] || 0) + 1;
        }
      });
      
      console.log('Class counts:');
      console.log(classCount);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

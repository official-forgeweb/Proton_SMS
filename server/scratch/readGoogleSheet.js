const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    console.log('Fetching sheet tab names...');
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    console.log('Available Tabs:', tabs);
    
    if (tabs.length === 0) {
      console.log('No tabs found. Make sure the spreadsheet ID is shared with the service account client email:');
      console.log(process.env.GOOGLE_CLIENT_EMAIL);
      return;
    }

    const targetTab = tabs[0];
    console.log(`Reading sheet "${targetTab}"...`);
    const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, targetTab, tabs);
    console.log(`Successfully read ${rows.length} rows.`);
    
    if (rows.length === 0) return;

    // Show column headers (keys of first row)
    console.log('Columns found:', Object.keys(rows[0]));

    // Group rows by class to see what classes are present
    const classCount = {};
    const sampleRows = {};
    
    rows.forEach(r => {
      // Find a key that looks like 'class'
      const classKey = Object.keys(r).find(k => k.toLowerCase().includes('class'));
      if (classKey) {
        const className = r[classKey] || 'Empty';
        classCount[className] = (classCount[className] || 0) + 1;
        if (!sampleRows[className]) {
          sampleRows[className] = [];
        }
        if (sampleRows[className].length < 3) {
          sampleRows[className].push(r);
        }
      }
    });

    console.log('\nClass counts:');
    console.log(classCount);

    console.log('\nSample rows by class:');
    Object.keys(sampleRows).forEach(c => {
      console.log(`\n--- CLASS: ${c} (${classCount[c]} rows) ---`);
      console.log(JSON.stringify(sampleRows[c], null, 2));
    });

  } catch (error) {
    console.error('Error reading sheet:', error);
  }
}

main();

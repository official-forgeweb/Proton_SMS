const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

function encodeYouTubeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return trimmed;
  }
  return '';
}

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  try {
    const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
    
    for (const tab of tabs) {
      console.log(`\n================= TAB: ${tab} =================`);
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      
      const validRows = rows.filter(r => {
        const linkVal = r['LINK'] || r['Link'] || r['link'] || '';
        return !!encodeYouTubeUrl(linkVal);
      });
      
      console.log(`Total rows: ${rows.length}, Valid YouTube URL rows: ${validRows.length}`);
      if (validRows.length === 0) continue;
      
      // Print first 5 and last 5 valid rows
      console.log('Sample valid rows:');
      const samples = validRows.length <= 10 ? validRows : [...validRows.slice(0, 5), ...validRows.slice(-5)];
      samples.forEach((r, idx) => {
        console.log(`  Row #${r.__sheet_row_num} (Sample index ${idx}):`);
        console.log(`    Date: ${r['DATE'] || r['Date'] || r['date']}`);
        console.log(`    Time/Entry: ${r['Time'] || r['ENTRY'] || r['entry'] || r['time']}`);
        console.log(`    Class: ${r['CLASS'] || r['Class'] || r['class']}`);
        console.log(`    Subject: ${r['SUBJECT'] || r['Subject'] || r['subject']}`);
        console.log(`    Link: ${r['LINK'] || r['Link'] || r['link']}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

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
      console.log(`\nTab: ${tab}`);
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      
      let total = rows.length;
      let hasLinkCol = 0;
      let hasValidUrl = 0;
      
      rows.forEach(r => {
        const linkVal = r['LINK'] || r['Link'] || r['link'] || '';
        if (linkVal) {
          hasLinkCol++;
          if (encodeYouTubeUrl(linkVal)) {
            hasValidUrl++;
          }
        }
      });
      
      console.log(`  Total rows: ${total}`);
      console.log(`  Rows with text in LINK: ${hasLinkCol}`);
      console.log(`  Rows with valid YouTube URL: ${hasValidUrl}`);
    }
  } catch (error) {
    console.error(error);
  }
}

main();

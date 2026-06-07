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
    const classStats = {};
    
    for (const tab of tabs) {
      const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
      rows.forEach(r => {
        const linkVal = r['LINK'] || r['Link'] || r['link'] || '';
        if (encodeYouTubeUrl(linkVal)) {
          const classVal = String(r['CLASS'] || r['Class'] || r['class'] || 'Unknown').trim();
          const subjVal = String(r['SUBJECT'] || r['Subject'] || r['subject'] || 'Unknown').trim();
          
          if (!classStats[classVal]) {
            classStats[classVal] = { count: 0, tabs: {}, subjects: {} };
          }
          classStats[classVal].count++;
          classStats[classVal].tabs[tab] = (classStats[classVal].tabs[tab] || 0) + 1;
          classStats[classVal].subjects[subjVal] = (classStats[classVal].subjects[subjVal] || 0) + 1;
        }
      });
    }
    
    console.log('--- CLASS DISTRIBUTION FOR VALID YOUTUBE ROWS ---');
    console.log(JSON.stringify(classStats, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

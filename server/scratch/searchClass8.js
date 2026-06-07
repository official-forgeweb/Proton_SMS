const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const prisma = require('../dist/config/database').default;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
  
  console.log('--- SEARCHING FOR CLASS 8 IN SPREADSHEET ---');
  for (const tab of tabs) {
    const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, tab, tabs);
    const class8Rows = rows.filter(r => {
      // Find keys containing class/batch
      const classKey = Object.keys(r).find(k => k.toLowerCase().trim() === 'class' || k.toLowerCase().trim() === 'batch');
      if (!classKey) return false;
      const val = String(r[classKey]).trim().toLowerCase();
      return val === '8' || val.includes('class 8') || val.includes('class-8') || val.includes('viii') || val.includes('8th');
    });

    if (class8Rows.length > 0) {
      console.log(`Tab "${tab}" has ${class8Rows.length} Class 8 rows:`);
      class8Rows.slice(0, 5).forEach(r => {
        console.log(`  Row ${r.__sheet_row_num}: Date=${r.Date || r.date}, Subject=${r.Subject || r.subject}, Link=${r.Link || r.link}`);
      });
    }
  }

  // Also check if Class 8 is in the DB
  const cls8 = await prisma.class.findMany({
    where: {
      OR: [
        { class_name: { contains: '8' } },
        { grade_level: { contains: '8' } }
      ]
    }
  });
  console.log('\n--- CLASS 8 RECORDS IN DATABASE ---');
  console.log(JSON.stringify(cls8, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

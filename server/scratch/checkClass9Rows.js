const { GoogleSheetsService } = require('../dist/services/googleSheetsService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const spreadsheetId = '1C2eyiJau5A509d8HTFsVB4Yt_7kQa-IOtsdPi0XERak';
  const tabs = await GoogleSheetsService.getSpreadsheetTabs(spreadsheetId);
  const rows = await GoogleSheetsService.readSpreadsheet(spreadsheetId, 'RITIKA MAM', tabs);

  if (rows.length > 0) {
    console.log('Columns in RITIKA MAM:', Object.keys(rows[0]));
    console.log('Sample row:', JSON.stringify(rows[0], null, 2));
  }

  // Check Class 9 database records using findFirst
  const dbClass9 = await prisma.class.findFirst({
    where: { class_name: 'Class 9' },
    include: {
      class_subjects: {
        include: {
          subject: true
        }
      }
    }
  });

  console.log('\n--- DB CLASS 9 SUBJECTS ---');
  if (dbClass9) {
    console.log('Class 9 Subjects in DB:', dbClass9.class_subjects.map(cs => cs.subject.canonical_name));
  } else {
    console.log('Class 9 not found in DB.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestLog = await prisma.googleSheetSyncLog.findFirst({
    where: { sync_type: 'video_lectures' },
    orderBy: { start_time: 'desc' }
  });

  if (!latestLog || !latestLog.error_message) {
    console.log('No logs or error messages found.');
    return;
  }

  const lines = latestLog.error_message.split('\n');
  console.log(`Total warning lines: ${lines.length}`);

  const categories = {
    missingColumns: 0,
    invalidUrl: 0,
    classNotFound: 0,
    subjectNotFound: 0,
    subjectNotMapped: 0,
    duplicateKey: 0,
    duplicateSheetRowId: 0,
    others: 0
  };

  lines.forEach(line => {
    if (!line.trim()) return;
    if (line.includes('Missing required columns')) {
      categories.missingColumns++;
    } else if (line.includes('Invalid YouTube URL')) {
      categories.invalidUrl++;
    } else if (line.includes('Class Not Found')) {
      categories.classNotFound++;
    } else if (line.includes('Subject Not Found')) {
      categories.subjectNotFound++;
    } else if (line.includes('not mapped to Class')) {
      categories.subjectNotMapped++;
    } else if (line.includes('Duplicate lecture scheduled')) {
      categories.duplicateKey++;
    } else if (line.includes('Duplicate sheet row ID')) {
      categories.duplicateSheetRowId++;
    } else {
      categories.others++;
      if (categories.others <= 5) {
        console.log('Other warning:', line);
      }
    }
  });

  console.log('\n--- WARNING CATEGORIES ANALYSIS ---');
  console.log(categories);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

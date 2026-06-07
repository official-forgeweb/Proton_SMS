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
  const ritikaLines = lines.filter(line => line.includes('RITIKA MAM'));
  
  console.log(`--- RITIKA MAM SYNC WARNINGS (Count: ${ritikaLines.length}) ---`);
  // Print first 50 warnings
  ritikaLines.slice(0, 50).forEach(line => console.log(line));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestLog = await prisma.googleSheetSyncLog.findFirst({
    where: { sync_type: 'video_lectures' },
    orderBy: { start_time: 'desc' },
    include: {
      source: true
    }
  });

  if (!latestLog) {
    console.log('No sync logs found.');
    return;
  }

  console.log('--- LATEST SYNC LOG ---');
  console.log('ID:', latestLog.id);
  console.log('Source:', latestLog.source ? latestLog.source.name : 'Unknown');
  console.log('Status:', latestLog.status);
  console.log('Processed:', latestLog.rows_processed);
  console.log('Created:', latestLog.rows_created);
  console.log('Updated:', latestLog.rows_updated);
  console.log('Deleted:', latestLog.rows_deleted);
  console.log('Failed:', latestLog.rows_failed);
  console.log('\n--- ERROR / WARNING MESSAGES ---');
  console.log(latestLog.error_message);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

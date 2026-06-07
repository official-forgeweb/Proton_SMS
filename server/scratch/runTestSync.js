const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { GoogleSheetSyncJob } = require('../dist/jobs/googleSheetSyncJob');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const sourceId = 'c4297c6c-5ef7-4e38-8f5d-6817bb3569cf';
  
  console.log('1. Configuring sheet_name to "*" (sync all tabs)...');
  await prisma.googleSheetSource.update({
    where: { id: sourceId },
    data: { sheet_name: '*' }
  });
  console.log('✅ Configuration updated.');

  console.log('2. Triggering GoogleSheetSyncJob...');
  const result = await GoogleSheetSyncJob.sync(sourceId);
  console.log('✅ Sync execution finished.');
  console.log('Result:', JSON.stringify(result, null, 2));

  console.log('3. Checking latest sync logs in database...');
  const latestLog = await prisma.googleSheetSyncLog.findFirst({
    where: { source_id: sourceId },
    orderBy: { start_time: 'desc' }
  });

  if (latestLog) {
    console.log('--- LATEST SYNC LOG ---');
    console.log('Status:', latestLog.status);
    console.log('Processed:', latestLog.rows_processed);
    console.log('Created:', latestLog.rows_created);
    console.log('Updated:', latestLog.rows_updated);
    console.log('Deleted:', latestLog.rows_deleted);
    console.log('Failed:', latestLog.rows_failed);
    if (latestLog.error_message) {
      console.log('Errors/Warnings:\n', latestLog.error_message);
    }
  }

  // Count total video lectures in database
  const count = await prisma.videoLecture.count({
    where: { sync_source_id: sourceId }
  });
  console.log(`\nTotal active video lectures linked to this source in DB: ${count}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

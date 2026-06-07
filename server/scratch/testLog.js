const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const syncLog = await prisma.googleSheetSyncLog.create({
    data: {
      sync_type: 'video_lectures',
      source_id: 'c4297c6c-5ef7-4e38-8f5d-6817bb3569cf',
      user_id: null,
      status: 'pending',
      start_time: new Date(),
    },
  });
  console.log('Created log:', syncLog);

  const updatedLog = await prisma.googleSheetSyncLog.update({
    where: { id: syncLog.id },
    data: {
      end_time: new Date(),
      status: 'success',
    },
  });
  console.log('Updated log:', updatedLog);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

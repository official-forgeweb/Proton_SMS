const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.googleSheetSyncLog.findMany({
    orderBy: { start_time: 'desc' },
    take: 5
  });
  console.log('--- LATEST 5 SYNC LOGS ---');
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

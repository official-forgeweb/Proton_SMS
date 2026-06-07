const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.googleSheetSource.findMany();
  console.log('--- CONFIGURED GOOGLE SHEET SOURCES ---');
  console.log(JSON.stringify(sources, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

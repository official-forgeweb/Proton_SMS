const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Querying subjects...');
  try {
    const start = Date.now();
    const subjects = await prisma.subject.findMany({
      orderBy: { canonical_name: 'asc' },
      include: { aliases: true }
    });
    console.log(`Successfully fetched ${subjects.length} subjects in ${Date.now() - start}ms`);
  } catch (error) {
    console.error('Error fetching subjects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

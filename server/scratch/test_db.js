const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Reset empty subject_frequencies so the fallback kicks in
  const result = await prisma.timetableConfig.updateMany({
    where: { subject_frequencies: '[]' },
    data: { subject_frequencies: '[]' }  // Keep as-is; the backend fallback will auto-derive on next generate
  });
  console.log(`Found ${result.count} configs with empty subject_frequencies.`);
  console.log('The backend fallback will auto-derive subjects from ClassSchedule on next /generate call.');
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());

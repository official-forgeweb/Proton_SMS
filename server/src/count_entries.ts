import prisma from './config/database';

async function main() {
  const entries = await prisma.timetable.findMany({
    where: {
      date: { gte: '2026-07-06', lte: '2026-07-12' }
    },
    include: { class_ref: true, subject: true }
  });

  const countByDay: Record<string, number> = {};
  entries.forEach(e => {
    countByDay[e.date] = (countByDay[e.date] || 0) + 1;
  });
  console.log('Count of entries by day:', countByDay);
  
  // Print some details
  console.log('\n--- July 6th (Monday) entries:');
  entries.filter(e => e.date === '2026-07-06').forEach(e => {
    console.log(`[${e.id}] ${e.class_ref.class_name} - ${e.subject.canonical_name} (${e.start_time})`);
  });

  console.log('\n--- July 7th (Tuesday) entries:');
  entries.filter(e => e.date === '2026-07-07').forEach(e => {
    console.log(`[${e.id}] ${e.class_ref.class_name} - ${e.subject.canonical_name} (${e.start_time})`);
  });
}
main();

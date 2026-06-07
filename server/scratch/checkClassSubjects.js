const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    include: {
      class_subjects: {
        include: {
          subject: true
        }
      }
    }
  });

  console.log('--- DB CLASSES & ASSIGNED SUBJECTS ---');
  classes.forEach(c => {
    console.log(`\nClass: ${c.class_name} (ID: ${c.id})`);
    const subjs = c.class_subjects.map(cs => cs.subject.canonical_name);
    console.log('  Subjects:', subjs.length > 0 ? subjs.join(', ') : 'None');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

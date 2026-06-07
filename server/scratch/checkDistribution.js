const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    include: {
      video_lectures: {
        include: {
          subject: true
        }
      }
    }
  });

  console.log('--- CLASS-WISE LECTURE COUNT ---');
  for (const cls of classes) {
    if (cls.video_lectures.length > 0) {
      console.log(`Class: ${cls.class_name} (${cls.class_code}) - total lectures: ${cls.video_lectures.length}`);
      // group by subject name
      const subjCount = {};
      cls.video_lectures.forEach(vl => {
        const name = vl.subject.canonical_name;
        subjCount[name] = (subjCount[name] || 0) + 1;
      });
      console.log('  Subjects:', subjCount);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

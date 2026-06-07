const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany();
  console.log('--- ALL DB CLASSES ---');
  classes.forEach(c => {
    console.log({
      id: c.id,
      class_name: c.class_name,
      class_code: c.class_code,
      grade_level: c.grade_level
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

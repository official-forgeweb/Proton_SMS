const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany({
    include: {
      aliases: true
    }
  });

  console.log('--- ALL DB SUBJECTS AND ALIASES ---');
  subjects.forEach(s => {
    console.log(`Subject: "${s.canonical_name}" (Normalized: "${s.normalized_key}")`);
    if (s.aliases.length > 0) {
      console.log('  Aliases:', s.aliases.map(a => `"${a.alias}" (Normalized: "${a.normalized_key}")`).join(', '));
    } else {
      console.log('  Aliases: None');
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

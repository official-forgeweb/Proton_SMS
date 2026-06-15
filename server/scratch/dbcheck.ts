import prisma from '../src/config/database';

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      failed_login_attempts: true,
      locked_until: true
    }
  });
  console.log("USERS IN DB:", JSON.stringify(users, null, 2));
}

checkUsers().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

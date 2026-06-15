import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('Admin@123', salt);

  await prisma.user.update({
    where: { email: 'admin@protoncoaching.com' },
    data: {
      password_hash: hash,
      failed_login_attempts: 0,
      locked_until: null,
      is_active: true,
      is_verified: true
    }
  });
  console.log("Admin reset and unlocked successfully!");
}

resetAdmin().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

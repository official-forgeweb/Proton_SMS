import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export const seedData = async (): Promise<void> => {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@protoncoaching.com' },
    });

    if (!adminExists) {
      console.log('🌱 Seeding initial demo data to PostgreSQL...');
      const salt = await bcrypt.genSalt(10);

      // 1. Create Default Admin
      await prisma.user.create({
        data: {
          email: 'admin@protoncoaching.com',
          password_hash: await bcrypt.hash('Admin@123', salt),
          role: 'admin',
          is_active: true,
          is_verified: true,
        },
      });

      console.log('✅ Admin account seeded successfully!');
    } else {
      console.log('✅ Database already contains an Admin. Skipping seeding.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during database seeding:', message);
  }
};

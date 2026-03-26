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

      // 2. Create Teacher
      const teacherUser = await prisma.user.create({
        data: {
          email: 'amit@protoncoaching.com',
          password_hash: await bcrypt.hash('Teacher@123', salt),
          role: 'teacher',
          is_active: true,
          is_verified: true,
        },
      });
      await prisma.teacher.create({
        data: {
          user_id: teacherUser.id,
          first_name: 'Amit',
          last_name: 'Sharma',
          employee_id: 'EMP1001',
          phone: '+91-9876543211',
          gender: 'male',
        },
      });

      // 3. Create Student
      const studentUser = await prisma.user.create({
        data: {
          email: 'rahul.sharma@email.com',
          password_hash: await bcrypt.hash('Student@123', salt),
          role: 'student',
          is_active: true,
          is_verified: true,
        },
      });
      await prisma.student.create({
        data: {
          user_id: studentUser.id,
          first_name: 'Rahul',
          last_name: 'Sharma',
          PRO_ID: 'PRO10001',
          phone: '+91-9876543212',
          gender: 'male',
        },
      });

      // 4. Create Parent
      const parentUser = await prisma.user.create({
        data: {
          email: 'parent.sharma@email.com',
          password_hash: await bcrypt.hash('Parent@123', salt),
          role: 'parent',
          is_active: true,
          is_verified: true,
        },
      });
      await prisma.parent.create({
        data: {
          user_id: parentUser.id,
          first_name: 'Mr.',
          last_name: 'Sharma',
          phone: '+91-9876543213',
        },
      });

      console.log('✅ Demo Credentials Seeded Successfully!');
    } else {
      console.log('✅ Database already contains an Admin. Skipping seeding.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during database seeding:', message);
  }
};

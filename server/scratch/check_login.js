const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkLogin() {
  console.log('Starting diagnostic check for admin login...');
  try {
    const email = 'admin@protoncoaching.com';
    const password = 'Admin@123';

    console.log(`1. Finding user by email: ${email}`);
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User found in database:', JSON.stringify({ id: user.id, email: user.email, role: user.role, is_active: user.is_active }));

    console.log('2. Comparing password hash...');
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('✅ Password match result:', isMatch);

    console.log('3. Loading profile info...');
    let profile = {};
    if (user.role === 'admin') {
      profile = { first_name: 'Admin', last_name: 'User', email: user.email };
    }
    console.log('✅ Profile resolution successful');
  } catch (error) {
    console.error('❌ ERROR DURING DIAGNOSTIC:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogin();

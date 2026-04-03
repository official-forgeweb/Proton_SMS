import app from './app';
import { connectDB } from './config/database';
import { seedData } from './data/store';
import { env } from './config/env';

const PORT = env.PORT;

const startServer = async (): Promise<void> => {
  await connectDB();

  // Seed in a try-catch so server starts even if seeding fails (e.g. DB is temporarily down)
  try {
    await seedData();
  } catch (err) {
    console.error('⚠️  Seed data failed (server will still start):', err instanceof Error ? err.message : err);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Proton LMS Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📧 Demo Credentials:`);
    console.log(`   Admin: admin@protoncoaching.com / Admin@123`);
    console.log(`   Teacher: amit@protoncoaching.com / Teacher@123`);
    console.log(`   Student: rahul.sharma@email.com / Student@123`);
    console.log(`   Parent: parent.sharma@email.com / Parent@123\n`);
  });
};

startServer();

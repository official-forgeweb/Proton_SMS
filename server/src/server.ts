import app from './app';
import { connectDB } from './config/database';
import { seedData } from './data/store';
import { env } from './config/env';

const PORT = env.PORT;

const startServer = async (): Promise<void> => {
  // Execute DB connection and seeding in the background
  // so the HTTP server can start immediately, even if internet drops
  const dbInit = async () => {
    try {
      await connectDB();
      try {
        await seedData();
      } catch (err) {
        console.error('⚠️  Seed data failed (server will still start):', err instanceof Error ? err.message : err);
      }
    } catch (err) {
      console.error('⚠️ Database init failed in background:', err instanceof Error ? err.message : err);
    }
  };

  dbInit();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Proton LMS Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📧 Demo Credentials:`);
    console.log(`   Admin: admin@protoncoaching.com / Admin@123`);
    console.log(`   Teacher: amit@protoncoaching.com / Teacher@123`);
    console.log(`   Student: rahul.sharma@email.com / Student@123`);
    console.log(`   Parent: parent.sharma@email.com / Parent@123\n`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    try {
      await import('./config/database').then((mod) => mod.disconnectDB());
      console.log('✅ Database connections closed.');
    } catch (err) {
      console.error('❌ Error during database disconnect:', err);
    }
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();

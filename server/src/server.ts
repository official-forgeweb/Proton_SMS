import app from './app';
import { connectDB } from './config/database';
import { seedData } from './data/store';
import { env } from './config/env';

const PORT = env.PORT;

const startServer = async (): Promise<void> => {
  await connectDB();
  await seedData();

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

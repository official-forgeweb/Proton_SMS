import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export const connectDB = async (): Promise<void> => {
  // Retry connection up to 5 times with exponential backoff
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL connected successfully via Prisma');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, message);
      if (attempt === MAX_RETRIES) {
        console.error('❌ All connection attempts exhausted. Starting server in degraded mode...');
        // Don't exit – let the server run so it can serve 503s and auto-recover
        return;
      }
      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma;

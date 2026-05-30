import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || '';
  if (url) {
    if (!url.includes('pgbouncer=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}pgbouncer=true&connect_timeout=15`;
    }
    if (!url.includes('connection_limit=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}connection_limit=20`;
    }
  }
  return url;
};

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl();
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var prismaConnected: boolean | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

// Eager connection warm-up
if (!globalThis.prismaConnected) {
  globalThis.prismaConnected = true;
  prisma.$connect().catch((err) => {
    console.warn('⚠️ [Server Prisma] Eager $connect() failed (will retry):', err.message);
    globalThis.prismaConnected = false;
  });
}

let keepAliveInterval: NodeJS.Timeout | null = null;

const startKeepAlive = () => {
  if (process.env.NODE_ENV !== 'production') return;
  if (keepAliveInterval) return;

  const pingDatabase = async () => {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      console.log(`⏱️ [Server Keep-Alive] Database ping successful (${Date.now() - start}ms)`);
    } catch (err: any) {
      console.error('❌ [Server Keep-Alive] Database ping failed:', err.message);
    }
  };

  console.log('🔄 [Server Keep-Alive] Initializing database ping interval (every 4 minutes)...');
  pingDatabase();
  keepAliveInterval = setInterval(pingDatabase, 4 * 60 * 1000);
  if (keepAliveInterval.unref) keepAliveInterval.unref();
};

export const connectDB = async (): Promise<void> => {
  // Retry connection up to 5 times with exponential backoff
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL connected successfully via Prisma');
      startKeepAlive();
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

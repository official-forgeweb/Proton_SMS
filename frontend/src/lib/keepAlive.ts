/**
 * Database Keep-Alive / Anti-Cold-Start Utility
 *
 * Neon serverless databases go to sleep after 5 minutes of inactivity on the free tier.
 * This script runs a lightweight 'SELECT 1' query every 4 minutes to keep the connection
 * active and warm.
 *
 * Only runs in production.
 */

let keepAliveInterval: NodeJS.Timeout | null = null;

export function startKeepAlive(prismaClient: any) {
  if (process.env.VERCEL) return; // Disable background keep-alive interval in serverless Vercel
  // Only keep-alive in production to avoid wasting local dev database connections
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (keepAliveInterval) {
    return; // Already initialized
  }

  const pingDatabase = async () => {
    try {
      const start = Date.now();
      await prismaClient.$queryRaw`SELECT 1`;
      console.log(`⏱️ [Next.js Keep-Alive] Database ping successful (${Date.now() - start}ms)`);
    } catch (err: any) {
      console.error('❌ [Next.js Keep-Alive] Database ping failed:', err.message);
    }
  };

  console.log('🔄 [Next.js Keep-Alive] Initializing database ping interval (every 4 minutes)...');
  
  // Run an initial ping immediately in the background
  pingDatabase();

  // Schedule every 4 minutes (240,000 ms)
  keepAliveInterval = setInterval(pingDatabase, 4 * 60 * 1000);
  
  // Unref the timer so it doesn't block the Node.js process from exiting if needed
  if (keepAliveInterval.unref) {
    keepAliveInterval.unref();
  }
}

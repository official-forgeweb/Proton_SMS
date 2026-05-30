/**
 * Next.js Instrumentation Hook
 *
 * This file runs once when the Next.js server starts up.
 * We use it to initialize the Neon DB keep-alive ping
 * to prevent cold starts on serverless PostgreSQL.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server side (not in edge runtime)
  if (typeof globalThis !== 'undefined' && typeof process !== 'undefined') {
    const { default: prisma } = await import('@/lib/prisma');
    const { startKeepAlive } = await import('@/lib/keepAlive');
    startKeepAlive(prisma);
    console.log('🏓 Neon DB keep-alive started (pinging every 4 min)');
  }
}

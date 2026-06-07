/**
 * Shared Prisma Client Singleton for Next.js Server Components
 *
 * Uses the Neon POOLED connection string to avoid exhausting connections
 * while both Express (port 5001) and Next.js (port 3000) are running.
 *
 * In development, the Prisma client is cached on `globalThis` so that
 * Next.js HMR doesn't create a new client on every file change.
 */

import { PrismaClient } from '@prisma/client';
import { startKeepAlive } from './keepAlive';

const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || '';
  if (url) {
    if (!url.includes('pgbouncer=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}pgbouncer=true&connect_timeout=15`;
    }
    if (!url.includes('connection_limit=')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}connection_limit=5`;
    }
  }
  return url;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var __prismaNextClient: undefined | ReturnType<typeof prismaClientSingleton>;
  // eslint-disable-next-line no-var
  var __prismaNextConnected: boolean | undefined;
}

const prisma = globalThis.__prismaNextClient ?? prismaClientSingleton();

// Always preserve on globalThis in serverless environments to prevent connection leaks
globalThis.__prismaNextClient = prisma;

// ── Eager Connection Warm-Up ──
// Connect immediately so the first query doesn't pay the cold-start cost.
// This runs once per process lifecycle (guarded by the global flag).
if (!globalThis.__prismaNextConnected) {
  globalThis.__prismaNextConnected = true;
  prisma.$connect().catch((err) => {
    console.warn('⚠️ [Next.js Prisma] Eager $connect() failed (will retry on first query):', err.message);
    globalThis.__prismaNextConnected = false;
  });
  // Start keep-alive pinging in production
  startKeepAlive(prisma);
}

/**
 * Execute a Prisma query with automatic retry for Neon cold-start errors.
 *
 * Neon can return P1001/P1008 when the serverless compute endpoint is
 * waking up. This helper retries with a short delay optimized for
 * Neon's typical wake-up time (~200-500ms).
 */
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 300,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (err: any) {
      const code = err?.code;
      const isTransient =
        TRANSIENT_PRISMA_CODES.has(code) ||
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes('Connection refused');

      if (isTransient && attempt < maxRetries - 1) {
        console.warn(
          `⚠️ [Next.js Prisma] Transient DB error (${code || err.message}), retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // exponential backoff: 300ms → 600ms
        continue;
      }

      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('withRetry: exhausted all attempts');
}

export default prisma;

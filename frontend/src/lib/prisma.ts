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

const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare global {
  // eslint-disable-next-line no-var
  var __prismaNextClient: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.__prismaNextClient ?? prismaClientSingleton();

// In development, store on globalThis to survive HMR
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaNextClient = prisma;
}

/**
 * Execute a Prisma query with automatic retry for Neon cold-start errors.
 *
 * Neon can return P1001/P1008 when the serverless compute endpoint is
 * waking up. This helper retries once after a short delay.
 */
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000,
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
        delayMs *= 2; // exponential backoff
        continue;
      }

      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('withRetry: exhausted all attempts');
}

export default prisma;

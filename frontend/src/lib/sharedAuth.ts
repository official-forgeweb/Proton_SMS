/**
 * Shared Server-Side Authentication Utility
 *
 * Reads the `access_token` cookie (set by the login page alongside localStorage)
 * and verifies it using the same JWT secret as the Express server.
 *
 * Usage in Server Components:
 *   const session = await getServerSession();
 *   if (!session) redirect('/login');
 */

import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'proton_access_secret_key_2024_super_secure';

interface JwtPayload {
  userId: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

export interface ServerSession {
  userId: string;
  role: UserRole;
}

/**
 * Get the authenticated session from the `access_token` cookie.
 * Returns null if the token is missing, expired, or invalid.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;

    if (!decoded.userId) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role || 'student',
    };
  } catch (error: any) {
    // Token expired or invalid — return null (don't throw)
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return null;
    }
    console.error('[sharedAuth] Unexpected error verifying token:', error.message);
    return null;
  }
}

/**
 * Require a specific role. Returns the session if authorized,
 * or null if the user doesn't have the required role.
 */
export async function requireRole(requiredRole: UserRole): Promise<ServerSession | null> {
  const session = await getServerSession();

  if (!session) return null;
  if (session.role !== requiredRole) return null;

  return session;
}

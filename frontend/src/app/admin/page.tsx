/**
 * Admin Dashboard — Server Component
 *
 * This page fetches data DIRECTLY from the Neon database using Prisma
 * at the server level, completely bypassing the Express API for reads.
 *
 * Benefits:
 *   - Zero client-side loading spinners (data is in the HTML)
 *   - No waterfall: data fetched before React even starts hydrating
 *   - Type-safe queries using the shared Prisma schema
 *
 * Submit actions (POST/PUT/DELETE) still use the Express API.
 */

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getAdminDashboardData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function AdminDashboardPage() {
  // ── Auth Check (server-side) ──
  const session = await requireRole('admin');

  // If no valid session cookie, fall back to client-side auth
  // (DashboardLayout will handle the redirect via useAuthStore)
  if (!session) {
    return (
      <DashboardLayout requiredRole="admin">
        <AdminDashboardFallback />
      </DashboardLayout>
    );
  }

  // ── Data Fetching (direct DB) ──
  try {
    const data = await getAdminDashboardData();

    return (
      <DashboardLayout requiredRole="admin">
        <AdminDashboardClient data={data} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('[AdminDashboard] Database query failed:', error);

    // Graceful degradation: show the page with the client-side fallback
    // which will use the Express API as a backup
    return (
      <DashboardLayout requiredRole="admin">
        <AdminDashboardFallback />
      </DashboardLayout>
    );
  }
}

/**
 * Fallback component that uses the client-side API fetching
 * when:
 *  1. No server-side session cookie exists (first login before cookie is set)
 *  2. Database query fails (Neon cold start, network issue, etc.)
 *
 * This ensures backward compatibility — the page never fully breaks.
 */
function AdminDashboardFallback() {
  return <AdminDashboardFallbackClient />;
}

// Separate file not needed — inline client component import
import AdminDashboardFallbackClient from './AdminDashboardFallbackClient';

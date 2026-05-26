/**
 * Coordinator Dashboard — Server Component
 *
 * This page fetches data DIRECTLY from the database using Prisma
 * at the server level, completely bypassing the Express API for reads.
 */

import { requireRole } from '@/lib/sharedAuth';
import { getAdminDashboardData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import CoordinatorDashboardClient from './CoordinatorDashboardClient';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function CoordinatorDashboardPage() {
  // ── Auth Check (server-side) ──
  const session = await requireRole('coordinator');

  // If no valid session cookie, fall back to client-side auth
  if (!session) {
    return (
      <DashboardLayout requiredRole="coordinator">
        <CoordinatorDashboardFallback />
      </DashboardLayout>
    );
  }

  // ── Data Fetching (direct DB) ──
  try {
    const data = await getAdminDashboardData();

    // Map stats & structure appropriately
    const formattedData = {
      stats: data.stats,
      funnel: {
        enquiries: data.stats.enquiries.total,
        contacted: data.stats.enquiries.total, // fallback
        demo_scheduled: data.stats.demos.total, // fallback
        demo_completed: data.stats.demos.completed, // fallback
        enrolled: data.stats.students.total, // fallback
        conversion_rate: data.stats.enquiries.total > 0 
          ? ((data.stats.students.total / data.stats.enquiries.total) * 100).toFixed(1) 
          : '0',
      },
      recent_activity: data.recent_activity,
      alerts: data.alerts,
      charts: data.charts,
    };

    return (
      <DashboardLayout requiredRole="coordinator">
        <CoordinatorDashboardClient data={formattedData} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('[CoordinatorDashboard] Database query failed:', error);

    return (
      <DashboardLayout requiredRole="coordinator">
        <CoordinatorDashboardFallback />
      </DashboardLayout>
    );
  }
}

/**
 * Fallback component that uses the client-side API fetching
 */
function CoordinatorDashboardFallback() {
  return <CoordinatorDashboardClient />;
}

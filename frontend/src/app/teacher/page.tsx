/**
 * Teacher Dashboard — Server Component
 *
 * Fetches data directly from Neon database using Prisma.
 */

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getTeacherDashboardData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import TeacherDashboardClient from './TeacherDashboardClient';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const session = await requireRole('teacher');

  if (!session) {
    return (
      <DashboardLayout requiredRole="teacher">
        <TeacherDashboardFallback />
      </DashboardLayout>
    );
  }

  try {
    const data = await getTeacherDashboardData(session.userId);

    if (!data) {
      throw new Error("Teacher not found");
    }

    return (
      <DashboardLayout requiredRole="teacher">
        <TeacherDashboardClient data={data} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('[TeacherDashboard] Database query failed:', error);

    return (
      <DashboardLayout requiredRole="teacher">
        <TeacherDashboardFallback />
      </DashboardLayout>
    );
  }
}

function TeacherDashboardFallback() {
  return <TeacherDashboardFallbackClient />;
}

import TeacherDashboardFallbackClient from './TeacherDashboardFallbackClient';

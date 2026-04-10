import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getFeesPageData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminFeesClient from './AdminFeesClient';
import AdminFeesFallbackClient from './AdminFeesFallbackClient';

export const dynamic = 'force-dynamic';

export default async function FeesPage() {
    const session = await requireRole('admin');

    if (!session) {
        return (
            <DashboardLayout requiredRole="admin">
                <AdminFeesFallbackClient />
            </DashboardLayout>
        );
    }

    try {
        const data = await getFeesPageData();

        return (
            <DashboardLayout requiredRole="admin">
                <AdminFeesClient initialData={data} />
            </DashboardLayout>
        );
    } catch (error) {
        console.error('[FeesPage] Database query failed:', error);
        return (
            <DashboardLayout requiredRole="admin">
                <AdminFeesFallbackClient />
            </DashboardLayout>
        );
    }
}

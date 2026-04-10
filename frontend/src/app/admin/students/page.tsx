import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getAdminStudentsData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminStudentsClient from './AdminStudentsClient';
import AdminStudentsFallbackClient from './AdminStudentsFallbackClient';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
    const session = await requireRole('admin');

    if (!session) {
        return (
            <AdminStudentsFallbackClient />
        );
    }

    try {
        const data = await getAdminStudentsData();

        return (
            <AdminStudentsClient initialData={data} />
        );
    } catch (error) {
        console.error('[AdminStudents] Database query failed:', error);
        return (
            <AdminStudentsFallbackClient />
        );
    }
}

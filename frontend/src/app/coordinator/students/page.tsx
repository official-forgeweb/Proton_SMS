import { requireRole } from '@/lib/sharedAuth';
import { getAdminStudentsData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminStudentsClient from '../../admin/students/AdminStudentsClient';
import AdminStudentsFallbackClient from '../../admin/students/AdminStudentsFallbackClient';

export const dynamic = 'force-dynamic';

export default async function CoordinatorStudentsPage() {
    const session = await requireRole(['coordinator', 'admin']);

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
        console.error('[CoordinatorStudents] Database query failed:', error);
        return (
            <AdminStudentsFallbackClient />
        );
    }
}

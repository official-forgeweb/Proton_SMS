import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { requireRole } from '@/lib/sharedAuth';
import { getClassDetailData } from '@/services/dataAccess';
import { redirect } from 'next/navigation';
import ClassCohortClient from './ClassCohortClient';

export const dynamic = 'force-dynamic';

export default async function ClassProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await requireRole('admin');
    if (!session) redirect('/login');

    const data = await getClassDetailData(id);

    if (!data || !data.class) {
         return (
             <DashboardLayout requiredRole="admin">
                 <div className="empty-state" style={{ padding: '80px 24px', textAlign: 'center' }}>
                     <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>Class not found</h3>
                     <p style={{ color: '#64748B', margin: '8px 0 24px' }}>The batch you are looking for does not exist or has been deleted.</p>
                     <Link href="/admin/classes" className="btn btn-primary" style={{ textDecoration: 'none' }}>Back to Classes</Link>
                 </div>
             </DashboardLayout>
         );
    }

    return (
        <DashboardLayout requiredRole="admin">
            <ClassCohortClient initialData={data} />
        </DashboardLayout>
    );
}

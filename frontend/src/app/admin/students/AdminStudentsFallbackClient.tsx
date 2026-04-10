'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminStudentsClient from './AdminStudentsClient';

export default function AdminStudentsFallbackClient() {
    const [data, setData] = useState<{ students: any[], classes: any[], totalCount: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/students', { params: { page: 1, limit: 20 } }),
            api.get('/classes')
        ])
        .then(([resStudents, resClasses]) => {
            setData({
                students: resStudents.data.data || [],
                totalCount: resStudents.data.pagination?.total || 0,
                classes: resClasses.data.data || []
            });
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

    if (isLoading || !data) {
        return (
            <DashboardLayout requiredRole="admin">
                <div className="page-header" style={{ marginBottom: '28px' }}>
                    <div className="skeleton" style={{ width: '250px', height: '36px', borderRadius: '8px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '32px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px', background: '#F8F9FD' }} />
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return <AdminStudentsClient initialData={data} />;
}

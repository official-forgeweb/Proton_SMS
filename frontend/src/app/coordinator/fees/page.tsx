'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminFeesClient from '@/app/admin/fees/AdminFeesClient';

export default function CoordinatorFeesPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/fees/assignments'),
            api.get('/fees/stats')
        ])
        .then(([resAssignments, resStats]) => {
            setData({
                assignments: resAssignments.data.data,
                stats: resStats.data.data
            });
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

    return (
        <DashboardLayout requiredRole="coordinator">
            {isLoading || !data ? (
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', background: '#F8F9FD' }} />
                        ))}
                    </div>
                </div>
            ) : (
                <AdminFeesClient initialData={data} />
            )}
        </DashboardLayout>
    );
}

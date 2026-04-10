'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AdminFeesClient from './AdminFeesClient';
import type { FeesPageData } from '@/services/dataAccess';

export default function AdminFeesFallbackClient() {
    const [data, setData] = useState<FeesPageData | null>(null);
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

    if (isLoading || !data) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', background: '#F8F9FD' }} />
                ))}
            </div>
        );
    }

    return <AdminFeesClient initialData={data} />;
}

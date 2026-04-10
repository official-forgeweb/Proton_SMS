'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import TeacherDashboardClient from './TeacherDashboardClient';
import type { TeacherDashboardData } from '@/services/dataAccess';

export default function TeacherDashboardFallbackClient() {
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/teacher')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <>
                <div className="page-header"><div className="skeleton" style={{ width: '300px', height: '28px' }} /></div>
                <div className="page-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '16px' }} />)}
                    </div>
                </div>
            </>
        );
    }

    if (!data) return <div style={{ textAlign: 'center', padding: '60px', color: '#5E6278' }}>Unable to load dashboard.</div>;

    return <TeacherDashboardClient data={data} />;
}

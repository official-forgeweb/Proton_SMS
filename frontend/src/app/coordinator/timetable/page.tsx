'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminTimetableClient from '@/app/admin/timetable/AdminTimetableClient';

export default function CoordinatorTimetablePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initialFilters = {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    useEffect(() => {
        Promise.all([
            api.get('/timetable', { params: initialFilters }),
            api.get('/classes'),
            api.get('/teachers')
        ])
        .then(([resTimetable, resClasses, resTeachers]) => {
            setData({
                timetable: resTimetable.data.data,
                classes: resClasses.data.data,
                teachers: resTeachers.data.data
            });
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

    return (
        <DashboardLayout requiredRole="coordinator">
            {isLoading || !data ? (
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />
                        ))}
                    </div>
                </div>
            ) : (
                <AdminTimetableClient 
                    initialTimetable={data.timetable} 
                    initialClasses={data.classes} 
                    initialTeachers={data.teachers} 
                    initialFilters={initialFilters} 
                />
            )}
        </DashboardLayout>
    );
}

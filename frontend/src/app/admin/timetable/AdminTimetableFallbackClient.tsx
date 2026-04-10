'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminTimetableClient from './AdminTimetableClient';

export default function AdminTimetableFallbackClient({ initialFilters }: { initialFilters: any }) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    }, [initialFilters]);

    if (isLoading || !data) {
        return (
             <div className="page-body">
                 <div style={{ display: 'grid', gap: '16px' }}>
                     {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
                 </div>
             </div>
        );
    }

    return (
        <AdminTimetableClient 
            initialTimetable={data.timetable} 
            initialClasses={data.classes} 
            initialTeachers={data.teachers} 
            initialFilters={initialFilters} 
        />
    );
}

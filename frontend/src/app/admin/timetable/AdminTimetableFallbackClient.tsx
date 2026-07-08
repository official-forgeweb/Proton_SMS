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
             <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {/* Filter bar skeleton */}
                 <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                     <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '10px' }} />
                     <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
                     <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
                 </div>
                 {/* Week nav skeleton */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                     <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '8px' }} />
                     <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                 </div>
                 {/* Grid skeleton */}
                 <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '16px' }}>
                         {[1, 2, 3, 4, 5, 6, 7].map(i => (
                             <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
                         ))}
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                         {Array.from({ length: 28 }).map((_, i) => (
                             <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
                         ))}
                     </div>
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

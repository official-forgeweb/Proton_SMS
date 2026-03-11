'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, UserCheck, Clock, UserX } from 'lucide-react';

export default function ParentAttendancePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/parent').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Attendance Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Monitor your children's presence in batch classes.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                        {/* Overall Stats */}
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserCheck size={20} color="var(--primary)" /> Average Attendance
                            </h3>

                            {data?.children?.map((child: any) => (
                                <div key={child.id} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                                    <p style={{ fontWeight: 600, fontSize: '15px' }}>{child.first_name} {child.last_name}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                                        <span style={{ fontSize: '24px', fontWeight: 800, color: child.attendance_percentage > 80 ? 'var(--success)' : 'var(--warning)' }}>
                                            {child.attendance_percentage}%
                                        </span>
                                        <span className={`badge ${child.attendance_percentage > 80 ? 'badge-success' : 'badge-warning'}`}>
                                            {child.attendance_percentage > 80 ? 'GOOD' : 'NEEDS ATTENTION'}
                                        </span>
                                    </div>

                                    <div className="progress-bar" style={{ marginTop: '12px' }}>
                                        <div className="progress-fill" style={{ width: `${child.attendance_percentage}%`, background: child.attendance_percentage > 80 ? 'var(--gradient-success)' : 'var(--gradient-warning)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Feed */}
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} color="var(--primary)" /> Recent Activity (30 Days)
                            </h3>
                            <div className="empty-state" style={{ minHeight: '200px' }}>
                                <Clock size={32} />
                                <p>Detailed day-by-day logs will appear here based on your school's data.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

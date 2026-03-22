'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { BookOpen, Users, Clock, Calendar, ChevronRight } from 'lucide-react';

export default function TeacherClassesPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Relying on teacher dashboard endpoint to get assigned classes
        api.get('/dashboard/teacher').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    return (
        <PermissionGuard permissionKey="classes">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Classes</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage your daily schedule and batches.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : data?.classes?.length === 0 ? (
                    <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                        <BookOpen size={48} />
                        <h3>No Classes Assigned Today</h3>
                        <p>You have a free schedule today.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                        {data?.classes?.map((cls: any, idx: number) => (
                            <div key={cls.id} className="card hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-100)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {cls.batch_type?.toUpperCase() || 'REGULAR'} BATCH
                                        </span>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>{cls.class_name}</h3>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={14} color="var(--text-tertiary)" /> {cls.class_time_start} - {cls.class_time_end}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={14} color="var(--text-tertiary)" /> {cls.student_count || 0} Students enrolled
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        onClick={() => window.location.href = `/teacher/classes/${cls.id}`}
                                    >
                                        View Students
                                    </button>
                                    {!cls.attendance_marked && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => window.location.href = `/teacher/attendance/${cls.id}`}
                                        >
                                            Mark Attendance
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
        </PermissionGuard>
    );
}

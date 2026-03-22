'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { UserCheck, Search, Users } from 'lucide-react';
import api from '@/lib/api';

export default function TeacherAttendancePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/teacher').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    return (
        <PermissionGuard permissionKey="attendance">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Mark Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Select a class from your schedule to mark daily attendance.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Available Classes Today</h3>
                        </div>

                        {data?.classes?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.classes.map((cls: any) => (
                                    <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: cls.attendance_marked ? 'var(--bg-tertiary)' : 'var(--bg-secondary)' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '15px' }}>{cls.class_name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                {cls.class_time_start} - {cls.student_count || 0} students
                                            </p>
                                        </div>

                                        {cls.attendance_marked ? (
                                            <span className="badge badge-success" style={{ padding: '8px 12px' }}>
                                                <UserCheck size={14} style={{ marginRight: '6px' }} /> Marked Complete
                                            </span>
                                        ) : (
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '8px 20px' }}
                                                onClick={() => window.location.href = `/teacher/attendance/${cls.id}`}
                                            >
                                                Start Marking
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <UserCheck size={48} />
                                <h3>No Classes Assigned</h3>
                                <p>You have no classes assigned to mark attendance.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
        </PermissionGuard>
    );
}

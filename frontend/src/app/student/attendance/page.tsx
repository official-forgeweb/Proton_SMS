'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, UserCheck, UserX, Clock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function StudentAttendancePage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/dashboard/student');
                setData(res.data.data);

                if (res.data.data?.student?.id) {
                    const attRes = await api.get(`/students/${res.data.data.student.id}/attendance`);
                    setHistory(attRes.data.data.records || []);
                }
            } catch (err) { } finally { setIsLoading(false); }
        };
        fetchData();
    }, []);

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Track your daily attendance and maintain your streak.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
                        {/* Stats Summary */}
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 16px',
                                background: (data?.attendance?.percentage || 0) >= 80 ? 'var(--gradient-success)' : 'var(--gradient-warning)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                fontSize: '32px', fontWeight: 800, boxShadow: 'var(--shadow-lg)'
                            }}>
                                {(data?.attendance?.percentage || 0).toFixed(0)}%
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Overall Attendance</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                Your attendance is {(data?.attendance?.percentage || 0) >= 80 ? 'excellent. Keep it up!' : 'falling behind. Please attend classes regularly.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#D1FAE5', borderRadius: '8px', color: '#065F46', fontWeight: 600 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserCheck size={16} /> Present Days</span>
                                    <span>{data?.attendance?.present || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontWeight: 600 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UserX size={16} /> Absent Days</span>
                                    <span>{data?.attendance?.absent || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar/List */}
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} color="var(--primary)" /> 30-Day History
                            </h3>

                            {history.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {history.map((record) => (
                                        <div key={record._id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', border: '1px solid var(--border-primary)', borderRadius: '8px',
                                            background: record.status === 'present' ? 'var(--bg-tertiary)' : record.status === 'late' ? 'var(--warning-light)' : '#FEE2E2'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {record.status === 'present' ? (
                                                    <UserCheck size={18} color="#065F46" />
                                                ) : record.status === 'late' ? (
                                                    <Clock size={18} color="#92400e" />
                                                ) : (
                                                    <UserX size={18} color="#991B1B" />
                                                )}
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>
                                                        {new Date(record.attendance_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    {record.remarks && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Note: {record.remarks}</p>}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '13px', fontWeight: 600, textTransform: 'capitalize',
                                                color: record.status === 'present' ? '#065F46' : record.status === 'late' ? '#92400e' : '#991B1B'
                                            }}>
                                                {record.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Clock size={48} />
                                    <h3>No History Available</h3>
                                    <p>Your attendance history will appear here once marked by your teachers.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

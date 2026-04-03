'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Users, GraduationCap, Calendar, List, ChevronRight, Activity } from 'lucide-react';

export default function ParentChildrenPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/parent').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Children</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        View academic profiles and performance summaries.
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {data?.children?.length > 0 ? (
                            data.children.map((child: any, idx: number) => (
                                <div key={child.id} className="card hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, padding: '0', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--gradient-primary)', height: '100px', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
                                        <div className="avatar avatar-lg" style={{ background: 'white', color: 'var(--primary)', marginBottom: '-30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '4px solid var(--bg-primary)' }}>
                                            {child.first_name?.[0]}{child.last_name?.[0]}
                                        </div>
                                    </div>

                                    <div style={{ padding: '36px 20px 20px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{child.first_name} {child.last_name}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                                            <span style={{ fontFamily: 'monospace' }}>{child.PRO_ID}</span> •
                                            <span>{child.class_name || 'Not Enrolled'}</span>
                                        </p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                <Calendar size={18} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{child.attendance_percentage}%</span>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Attendance</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                <Activity size={18} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                                                <span style={{ fontSize: '16px', fontWeight: 700 }}>
                                                    {child.last_test ? `${child.last_test.marks_obtained}/${child.last_test.total_marks}` : '-'}
                                                </span>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Last Test</p>
                                            </div>
                                        </div>

                                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
                                            View Detailed Report <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                                <Users size={48} />
                                <h3>No Children Linked</h3>
                                <p>Contact the administration to connect a student to your account.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

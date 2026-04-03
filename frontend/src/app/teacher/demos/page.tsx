'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { Target, CheckCircle, Video } from 'lucide-react';

export default function TeacherDemosPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchDashboard = () => {
        api.get('/dashboard/teacher').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const markCompleted = async (demoId: string) => {
        setUpdatingId(demoId);
        try {
            await api.put(`/enquiries/demos/${demoId}`, { status: 'completed' });
            fetchDashboard();
        } catch (error) {
            console.error(error);
            alert('Failed to update demo status.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <PermissionGuard permissionKey="demos">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Upcoming Demos</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage scheduled demo classes for prospective students.
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
                    ) :  data?.upcoming_demos?.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {data.upcoming_demos.map((demo: any, idx: number) => (
                            <div key={demo.id} className="card animate-fade-in" style={{ animationDelay: `${idx * 40}ms`, padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span className="badge badge-warning" style={{ fontSize: '11px', fontWeight: 700 }}>{demo.status?.toUpperCase()}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>DEMO #{demo.demo_count}</span>
                                </div>

                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{demo.student_name}</h3>
                                <div style={{ margin: '12px 0', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                                    <p style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}><strong>Date:</strong> {demo.demo_date}</p>
                                    <p style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}><strong>Time:</strong> {demo.demo_time}</p>
                                    <p style={{ display: 'flex', gap: '8px' }}><strong>Topic:</strong> {demo.topic || 'General Introduction'}</p>
                                </div>

                                <button
                                    className="btn btn-success"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                                    onClick={() => markCompleted(demo.id)}
                                    disabled={updatingId === demo.id}
                                >
                                    {updatingId === demo.id ? 'Updating...' : <><CheckCircle size={16} /> Mark Completed</>}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card empty-state">
                        <Target size={48} />
                        <h3>No Demos Scheduled</h3>
                        <p>You have no upcoming demo classes at this time.</p>
                    </div>
                )}
            </div>
        </DashboardLayout >
        </PermissionGuard>
    );
}

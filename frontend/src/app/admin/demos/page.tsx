'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Target, Calendar, Clock, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DemoClassesPage() {
    const router = useRouter();
    const [demos, setDemos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDemos();
    }, []);

    const fetchDemos = async () => {
        try {
            const res = await api.get('/enquiries/demos/all');
            setDemos(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Demo Classes</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Track and manage scheduled demo classes for prospective students.
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
                    ) :  demos.length === 0 ? (
                    <div className="empty-state card">
                        <Target size={48} />
                        <h3>No Demo Classes</h3>
                        <p>No demo classes are currently scheduled.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                        {demos.map((demo) => (
                            <div key={demo.id} className="card hover-lift" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                                            {demo.demo_number}
                                        </span>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                                            {demo.enquiry?.student_name || 'Unknown Student'}
                                        </h3>
                                    </div>
                                    <span className={`badge ${demo.status === 'completed' ? 'badge-success' : demo.status === 'scheduled' ? 'badge-info' : 'badge-warning'}`}>
                                        {demo.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={13} /> {demo.demo_date}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={13} /> {demo.demo_time}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Target size={13} /> {demo.subject} • {demo.topic}
                                    </div>
                                    {demo.enquiry?.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={13} /> {demo.enquiry.phone}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        onClick={() => router.push(`/admin/demos/${demo.id}/remark?enquiry=${demo.enquiry_id}`)}
                                    >
                                        <MessageSquare size={14} /> Add Remark
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </DashboardLayout>
    );
}

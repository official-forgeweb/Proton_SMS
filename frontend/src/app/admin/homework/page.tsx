'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { PenTool, Plus, Clock, Users } from 'lucide-react';

export default function HomeworkPage() {
    const router = useRouter();
    const [homework, setHomework] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = () => {
        api.get('/homework').then(res => setHomework(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };



    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Homework Assignments</h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Assign and track student homework progress.
                        </p>
                    </div>
                    <button onClick={() => router.push('/admin/homework/assign')} style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229,57,53,0.3)' }}>
                        <Plus size={16} /> Assign Homework
                    </button>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  homework.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#A1A5B7' }}>
                            <PenTool size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Homework Found</h3>
                            <p style={{ fontSize: '13px' }}>Assign new homework to students.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        {['Title / Subject', 'Class', 'Assigned Date', 'Due Date', 'Submissions', 'Actions'].map((h, i) => (
                                            <th key={h} style={{ padding: '13px 16px', textAlign: i === 5 ? 'right' : 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {homework.map((hw, idx) => (
                                        <tr key={hw.id} style={{ borderBottom: '1px solid #F0F0F5', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{hw.title}</div>
                                                <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px', fontWeight: 500 }}>{hw.subject}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ background: '#FFEBEE', color: '#E53935', padding: '3px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>{hw.class_name}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#5E6278', fontWeight: 500 }}>
                                                    <Clock size={12} color="#A1A5B7" /> {hw.assigned_date}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, background: new Date(hw.due_date) < new Date() ? '#FEE2E2' : '#FEF3C7', color: new Date(hw.due_date) < new Date() ? '#DC2626' : '#92400E' }}>
                                                    {hw.due_date}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1, height: '6px', background: '#F0F0F5', borderRadius: '50px', overflow: 'hidden', maxWidth: '80px' }}>
                                                        <div style={{ height: '100%', width: `${(hw.submitted / (hw.total_students || 1)) * 100}%`, background: 'linear-gradient(90deg, #E53935, #C62828)', borderRadius: '50px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A1D3B', whiteSpace: 'nowrap' }}>{hw.submitted}/{hw.total_students}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button style={{ background: '#FFEBEE', color: '#E53935', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E53935'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFEBEE'; (e.currentTarget as HTMLElement).style.color = '#E53935'; }}
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


            <ToolBottomBar />
        </DashboardLayout>
    );
}


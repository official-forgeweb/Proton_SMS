'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Award, ClipboardList, Target, Medal } from 'lucide-react';

export default function ParentTestsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/parent').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Examination Results</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Review grading and rank improvements over time.
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {data?.children?.map((child: any) => (
                            <div key={child.id} className="card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <div className="avatar" style={{ background: 'var(--primary-100)', color: 'var(--primary)' }}>
                                        {child.first_name?.[0]}
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{child.first_name}'s Tests</h3>
                                </div>

                                {child.last_test ? (
                                    <div style={{
                                        padding: '24px', borderRadius: '12px', border: '1px solid var(--border-primary)',
                                        background: 'var(--bg-secondary)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '24px', alignItems: 'center'
                                    }}>
                                        <div>
                                            <span className="badge badge-info">{child.last_test.test_date}</span>
                                            <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0' }}>{child.last_test.test_name}</h4>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Class Rank: #{child.last_test.rank_in_class}</p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                                            <div style={{ padding: '0 16px', borderRight: '1px solid var(--border-primary)' }}>
                                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>SCORE</p>
                                                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{child.last_test.marks_obtained}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/{child.last_test.total_marks}</span></p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>RESULT</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: child.last_test.pass_fail === 'pass' ? 'var(--success)' : 'var(--error)' }}>
                                                    {child.last_test.pass_fail === 'pass' ? 'PASSED' : 'FAILED'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ padding: '30px' }}>
                                        <ClipboardList size={32} />
                                        <p>No tests recorded yet.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

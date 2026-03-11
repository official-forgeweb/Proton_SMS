'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Award, FileText, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

export default function StudentTestsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Re-use student dashboard endpoint
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/student');
                setData(res.data.data);
            } catch (err) { } finally { setIsLoading(false); }
        };
        fetchDashboard();
    }, []);

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Tests & Results</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Review past examination scores and performance metrics.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : (
                    <>
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={20} color="var(--primary)" /> Academic Record
                                </h3>
                                <span className="badge badge-success">Top {100 - (data?.recent_tests?.[0]?.percentage || 100)}% of Class</span>
                            </div>

                            {data?.recent_tests?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {data.recent_tests.map((test: any, idx: number) => (
                                        <div key={test.test_id} className="animate-fade-in" style={{
                                            padding: '20px', borderRadius: '12px',
                                            border: '1px solid var(--border-primary)',
                                            background: 'var(--bg-secondary)', animationDelay: `${idx * 40}ms`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <span className="badge badge-info">{test.test_type?.toUpperCase() || 'TEST'}</span>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} /> {test.test_date}
                                                        </span>
                                                    </div>
                                                    <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{test.test_name}</h4>
                                                </div>

                                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
                                                    <div>
                                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Score</p>
                                                        <p style={{ fontSize: '24px', fontWeight: 800, color: test.pass_fail === 'pass' ? 'var(--success)' : 'var(--error)' }}>
                                                            {test.marks_obtained}<span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>/{test.total_marks}</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Rank</p>
                                                        <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                                                            #{test.rank_in_class}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <div className="avatar" style={{ background: 'var(--bg-primary)', border: '2px solid', borderColor: test.percentage >= 80 ? 'var(--success)' : test.percentage >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                                                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{test.grade}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                                                    <span>Performance: {test.percentage}%</span>
                                                    <span style={{ color: 'var(--text-tertiary)' }}>{test.pass_fail === 'pass' ? 'PASSED' : 'FAILED'}</span>
                                                </div>
                                                <div className="progress-bar" style={{ height: '8px' }}>
                                                    <div className="progress-fill" style={{ width: `${test.percentage}%`, background: test.percentage >= 80 ? 'var(--success)' : test.percentage >= 60 ? 'var(--warning)' : 'var(--error)' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <FileText size={48} />
                                    <h3>No Tests Taken</h3>
                                    <p>You haven't participated in any assessments yet.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

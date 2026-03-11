'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ClipboardList, Users, CheckCircle, BarChart2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TestProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/tests/${params.id}`).then(res => setTest(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    if (isLoading) return <DashboardLayout requiredRole="admin"><div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div></DashboardLayout>;

    if (!test) return <DashboardLayout requiredRole="admin"><div className="empty-state"><h3>Test not found</h3><button className="btn btn-primary" onClick={() => router.push('/admin/tests')}>Back</button></div></DashboardLayout>;

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>{test.test_code}</span>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{test.test_name}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {test.class_name} • {test.subject} • {new Date(test.test_date).toLocaleDateString()}
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => router.push('/admin/tests')}>Back</button>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>

                    <div className="card" style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} color="var(--primary)" /> Test Statistics
                        </h3>
                        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--info)' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Highest Score</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{test.stats?.highest} <span style={{ fontSize: '12px', fontWeight: 400 }}>/ {test.total_marks}</span></p>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Class Average</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{test.stats?.average}%</p>
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Pass Rate</p>
                            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{test.stats?.pass_percentage}%</p>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={18} color="var(--primary)" /> Student Results
                            </h3>
                            <span className="badge badge-info">{test.stats?.total_students} Appeared</span>
                        </div>

                        {test.results?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>PRO_ID</th>
                                        <th>Score</th>
                                        <th>%</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {test.results.map((r: any) => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 700, color: r.rank_in_class === 1 ? 'var(--warning)' : 'inherit' }}>#{r.rank_in_class}</td>
                                            <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{r.pro_id}</td>
                                            <td>{r.marks_obtained} / {test.total_marks}</td>
                                            <td>{r.percentage}%</td>
                                            <td>
                                                <span className={`badge ${r.pass_fail === 'pass' ? 'badge-success' : 'badge-error'}`}>
                                                    {r.pass_fail.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <p>No results published for this test yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

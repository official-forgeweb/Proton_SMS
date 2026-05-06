'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ClipboardList, Users, CheckCircle, BarChart2, Info } from 'lucide-react';
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => router.push(`/admin/tests/${test.id}/evaluate`)}>Evaluate Scores</button>
                    <button className="btn btn-secondary" onClick={() => router.push('/admin/tests')}>Back</button>
                </div>
            </div>

            <div className="page-body">
                {(test.description || (test.images && test.images.length > 0)) && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={20} color="var(--primary)" /> Test Information & Syllabus
                        </h3>
                        
                        {test.description && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: test.images?.length > 0 ? '24px' : '0', border: '1px solid var(--border-primary)' }}>
                                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                                    {test.description}
                                </p>
                            </div>
                        )}

                        {test.images && test.images.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Attached Documents</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                    {test.images.map((img: string, idx: number) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-primary)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                            <img src={img} alt={`Attachment ${idx + 1}`} style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
                                            <div style={{ padding: '8px', background: 'white', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textAlign: 'center', borderTop: '1px solid var(--border-primary)' }}>
                                                View full image
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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

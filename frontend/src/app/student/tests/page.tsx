'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Award, FileText, Calendar, CheckCircle, TrendingUp, Clock, AlertCircle, PlayCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function StudentTestsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'completed'>('ongoing');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/student');
                setData(res.data.data);
                
                // Auto-switch tab if no ongoing tests but upcoming exist
                const ongoing = res.data.data?.tests?.ongoing || [];
                const upcoming = res.data.data?.tests?.upcoming || [];
                if (ongoing.length === 0 && upcoming.length > 0) setActiveTab('upcoming');
                else if (ongoing.length === 0 && upcoming.length === 0) setActiveTab('completed');
                
            } catch (err) { 
                toast.error('Failed to load test data');
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchDashboard();
    }, []);

    const tests = data?.tests || { ongoing: [], upcoming: [], completed: [] };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ongoing': return <span className="badge badge-success" style={{ background: '#D1FAE5', color: '#065F46' }}>ONGOING</span>;
            case 'scheduled': return <span className="badge badge-info" style={{ background: '#DBEAFE', color: '#1E40AF' }}>UPCOMING</span>;
            case 'completed': return <span className="badge badge-error" style={{ background: '#FEF3C7', color: '#92400E' }}>EVALUATING</span>;
            case 'published': return <span className="badge badge-success">RESULTS OUT</span>;
            default: return <span className="badge badge-neutral">{status.toUpperCase()}</span>;
        }
    };

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Assessments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Track upcoming exams, take ongoing tests, and review performance records.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : (
                    <>
                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-primary)' }}>
                            <button 
                                onClick={() => setActiveTab('ongoing')}
                                className={`btn ${activeTab === 'ongoing' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}
                            >
                                Ongoing {tests.ongoing.length > 0 && <span style={{ marginLeft: '6px', opacity: 0.8 }}>({tests.ongoing.length})</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('upcoming')}
                                className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}
                            >
                                Upcoming {tests.upcoming.length > 0 && <span style={{ marginLeft: '6px', opacity: 0.8 }}>({tests.upcoming.length})</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('completed')}
                                className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px' }}
                            >
                                Past Records
                            </button>
                        </div>

                        {/* Ongoing Tests Section */}
                        {activeTab === 'ongoing' && (
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={20} color="var(--success)" /> Ongoing Tests
                                </h3>
                                {tests.ongoing.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {tests.ongoing.map((test: any, i: number) => (
                                            <div key={test._id || i} style={{
                                                padding: '20px', borderRadius: '16px', border: '1px solid var(--success)',
                                                background: '#F0FDF4', position: 'relative', overflow: 'hidden'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                            {getStatusBadge('ongoing')}
                                                            <span className="badge badge-info">{test.subject}</span>
                                                        </div>
                                                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#064E3B' }}>{test.test_name}</h4>
                                                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: '#065F46' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {test.duration_minutes} Mins</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={14} /> {test.total_marks} Marks</span>
                                                        </div>
                                                    </div>
                                                    <Link href={`/student/tests/${test._id}`}>
                                                        <button className="btn btn-primary" style={{ boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                                                            <PlayCircle size={18} /> Attempt Now
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <CheckCircle size={40} color="var(--text-tertiary)" style={{ opacity: 0.4 }} />
                                        <p style={{ marginTop: '12px', color: 'var(--text-tertiary)' }}>No tests are active at the moment.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upcoming Tests Section */}
                        {activeTab === 'upcoming' && (
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={20} color="var(--primary)" /> Upcoming Schedule
                                </h3>
                                {tests.upcoming.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                        {tests.upcoming.map((test: any, i: number) => (
                                            <div key={test._id || i} style={{
                                                padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)',
                                                background: 'var(--bg-secondary)', borderLeft: '4px solid var(--primary)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span className="badge badge-info">{test.subject}</span>
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>{test.test_date}</span>
                                                </div>
                                                <h4 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{test.test_name}</h4>
                                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                    <span><Clock size={12} /> {test.duration_minutes}m</span>
                                                    <span><Award size={12} /> {test.total_marks}m</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No tests scheduled for the future.</p>
                                )}
                            </div>
                        )}

                        {/* Past Tests Section */}
                        {activeTab === 'completed' && (
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={20} color="var(--primary)" /> Past Performance
                                </h3>
                                {tests.completed.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {tests.completed.map((test: any) => {
                                            const result = data?.recent_tests?.find((tr: any) => tr.test_id === test._id);
                                            return (
                                                <div key={test._id} style={{
                                                    padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-primary)',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    background: result ? 'white' : 'var(--bg-secondary)',
                                                    opacity: result ? 1 : 0.8
                                                }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: 700, fontSize: '15px' }}>{test.test_name}</h4>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{test.subject} • {test.test_date}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {result ? (
                                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                                <div>
                                                                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>SCORE</p>
                                                                    <p style={{ fontSize: '18px', fontWeight: 800, color: result.pass_fail === 'pass' ? 'var(--success)' : 'var(--error)' }}>
                                                                        {result.marks_obtained}/{result.total_marks}
                                                                    </p>
                                                                </div>
                                                                <div className="avatar" style={{ width: '32px', height: '32px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{result.grade}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="badge badge-neutral" style={{ opacity: 0.6 }}>Result Awaited</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No historical test data available.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

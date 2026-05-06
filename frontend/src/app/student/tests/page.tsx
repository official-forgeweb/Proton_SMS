'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Award, FileText, Calendar, CheckCircle, TrendingUp, Clock, AlertCircle, PlayCircle, Eye, BookOpen, Target } from 'lucide-react';
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {(() => {
                                const allTestsRaw = [...(tests.ongoing || []), ...(tests.upcoming || []), ...(tests.completed || [])];
                                const uniqueTests = Array.from(new Map(allTestsRaw.map(t => [t.id || t._id, t])).values());
                                
                                if (uniqueTests.length === 0) {
                                    return (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
                                            <div style={{ width: '64px', height: '64px', background: '#F8F9FD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                                <AlertCircle size={32} color="#CBD5E1" />
                                            </div>
                                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Tests Found</h3>
                                            <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>There are currently no tests scheduled or completed for your batch.</p>
                                        </div>
                                    );
                                }
                                
                                return uniqueTests.map((test: any, idx: number) => {
                                    const result = data?.recent_tests?.find((tr: any) => (tr.test_id === test.id) || (tr.test_id === test._id));
                                    const isCompleted = tests.completed?.some((t: any) => t.id === test.id || t._id === test._id);
                                    
                                    return (
                                        <div key={test.id || test._id || idx} className="animate-fade-in glass-card" style={{ animationDelay: `${idx * 40}ms` }}>
                                            <div style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: 'rgba(229, 57, 53, 0.08)', color: '#E53935', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                        {test.test_type?.replace('_', ' ') || 'TEST'}
                                                    </div>
                                                    
                                                    {isCompleted ? (
                                                        <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                                            COMPLETED
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
                                                            SCHEDULED
                                                        </div>
                                                    )}
                                                </div>

                                                {test.images && test.images.length > 0 && (
                                                    <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', height: '120px' }}>
                                                        <img src={test.images[0]} alt="Test Syllabus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                )}

                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em', marginBottom: '6px' }}>
                                                    {test.test_name}
                                                </h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                                                    <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <BookOpen size={14} /> {test.subject}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                                                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                            <Calendar size={12} /> Date
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{new Date(test.test_date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                            <Target size={12} /> Marks
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.total_marks}</div>
                                                    </div>
                                                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                            <Clock size={12} /> Dur.
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.duration_minutes}m</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => window.location.href = `/student/tests/${test.id || test._id}`}
                                                    style={{ 
                                                        width: '100%', padding: '12px', borderRadius: '12px', 
                                                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                                                        color: 'white', border: 'none',
                                                        fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                        boxShadow: '0 8px 16px rgba(26,29,59,0.1)'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <Eye size={16} /> View Details
                                                </button>
                                                
                                                {result && (
                                                    <div style={{ marginTop: '12px', padding: '10px', background: result.pass_fail === 'pass' ? '#ECFDF5' : '#FEF2F2', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${result.pass_fail === 'pass' ? '#A7F3D0' : '#FECACA'}` }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: result.pass_fail === 'pass' ? '#065F46' : '#991B1B' }}>YOUR SCORE</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 800, color: result.pass_fail === 'pass' ? '#059669' : '#DC2626' }}>{result.marks_obtained}/{result.total_marks}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </>
                )}
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}


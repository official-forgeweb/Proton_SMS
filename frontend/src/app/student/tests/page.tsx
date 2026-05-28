'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ToolBottomBar from '@/components/ToolBottomBar';
import api from '@/lib/api';
import { Award, FileText, Calendar, CheckCircle, TrendingUp, Clock, AlertCircle, PlayCircle, Eye, BookOpen, Target, ShieldAlert, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function StudentTestsPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/student');
                setData(res.data.data);
            } catch (err) { 
                toast.error('Failed to load test data');
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchDashboard();
    }, []);

    const tests = data?.tests || { ongoing: [], upcoming: [], completed: [] };

    // Stats calculations
    const stats = useMemo(() => {
        const ongoing = tests.ongoing?.length || 0;
        const upcoming = tests.upcoming?.length || 0;
        const completed = tests.completed?.length || 0;
        const total = ongoing + upcoming + completed;
        
        // Calculate average score if recent tests exist
        const recent = data?.recent_tests || [];
        let avgScore = 0;
        if (recent.length > 0) {
            const sum = recent.reduce((acc: number, curr: any) => {
                const percentage = (curr.marks_obtained / (curr.total_marks || 1)) * 100;
                return acc + percentage;
            }, 0);
            avgScore = Math.round(sum / recent.length);
        }

        return { ongoing, upcoming, completed, total, avgScore };
    }, [tests, data]);

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0 }}>
                            My Assessments
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Track ongoing exams, check upcoming schedules, and review your academic performance.
                        </p>
                    </div>
                </div>

                {/* Top Glassmorphic Stats */}
                {!isLoading && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                        gap: '20px', 
                        marginBottom: '32px' 
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            backdropFilter: 'blur(16px)',
                            padding: '24px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229, 57, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                <ClipboardList size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scheduled</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>{stats.total}</div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            backdropFilter: 'blur(16px)',
                            padding: '24px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                <Clock size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ongoing / Upcoming</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>{stats.ongoing + stats.upcoming}</div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            backdropFilter: 'blur(16px)',
                            padding: '24px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>{stats.completed}</div>
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                            padding: '24px',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(26, 29, 59, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                                <TrendingUp size={22} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Score</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                                    {stats.completed > 0 ? `${stats.avgScore}%` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="page-body">
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', width: '100%' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-fade-in" style={{ 
                                    height: '280px', 
                                    borderRadius: '24px', 
                                    animationDelay: `${i * 100}ms`, 
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(8px)'
                                }} />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                                {(() => {
                                    const allTestsRaw = [...(tests.ongoing || []), ...(tests.upcoming || []), ...(tests.completed || [])];
                                    const uniqueTests = Array.from(new Map(allTestsRaw.map(t => [t.id || t._id, t])).values());
                                    
                                    if (uniqueTests.length === 0) {
                                        return (
                                            <div style={{ 
                                                gridColumn: '1 / -1', 
                                                textAlign: 'center', 
                                                padding: '80px 40px',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                borderRadius: '24px',
                                                backdropFilter: 'blur(16px)'
                                            }}>
                                                <div style={{ width: '64px', height: '64px', background: '#FFF5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                                    <ShieldAlert size={32} color="#E53935" />
                                                </div>
                                                <h3 style={{ fontSize: '20px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Assessments Scheduled</h3>
                                                <p style={{ fontSize: '15px', color: '#64748B', fontWeight: 500, maxWidth: '400px', margin: '0 auto' }}>
                                                    There are currently no tests scheduled or completed for your batch at this moment.
                                                </p>
                                            </div>
                                        );
                                    }
                                    
                                    return uniqueTests.map((test: any, idx: number) => {
                                        const result = data?.recent_tests?.find((tr: any) => (tr.test_id === test.id) || (tr.test_id === test._id));
                                        const isCompleted = tests.completed?.some((t: any) => t.id === test.id || t._id === test._id);
                                        const isOngoing = tests.ongoing?.some((t: any) => t.id === test.id || t._id === test._id);
                                        
                                        return (
                                            <div key={test.id || test._id || idx} 
                                                className="animate-fade-in" 
                                                style={{ 
                                                    animationDelay: `${idx * 60}ms`,
                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                                    backdropFilter: 'blur(16px)',
                                                    borderRadius: '24px',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    cursor: 'default',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(229, 57, 53, 0.06)';
                                                    e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.3)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.03)';
                                                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                                                }}
                                            >
                                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                                        <div style={{ 
                                                            padding: '6px 14px', 
                                                            borderRadius: '50px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 800, 
                                                            background: 'rgba(229, 57, 53, 0.08)', 
                                                            color: '#E53935', 
                                                            letterSpacing: '0.05em', 
                                                            textTransform: 'uppercase' 
                                                        }}>
                                                            {test.test_type?.replace('_', ' ') || 'TEST'}
                                                        </div>
                                                        
                                                        {isCompleted ? (
                                                            <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, background: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                                                COMPLETED
                                                            </div>
                                                        ) : isOngoing ? (
                                                            <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, background: '#FCE8E6', color: '#C5221F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.5s infinite' }} />
                                                                LIVE NOW
                                                            </div>
                                                        ) : (
                                                            <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, background: '#E8F0FE', color: '#1A73E8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                                                UPCOMING
                                                            </div>
                                                        )}
                                                    </div>

                                                    {test.images && test.images.length > 0 && (
                                                        <div style={{ marginBottom: '18px', borderRadius: '16px', overflow: 'hidden', height: '130px', border: '1px solid #E2E8F0' }}>
                                                            <img src={test.images[0]} alt="Test Syllabus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    )}

                                                    <h3 style={{ 
                                                        fontSize: '19px', 
                                                        fontWeight: 800, 
                                                        color: '#1A1D3B', 
                                                        fontFamily: 'Poppins, sans-serif', 
                                                        letterSpacing: '-0.015em', 
                                                        marginBottom: '8px',
                                                        lineHeight: '1.3'
                                                    }}>
                                                        {test.test_name}
                                                    </h3>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <BookOpen size={14} color="#E53935" /> {test.subject}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                                                        <div style={{ background: '#F8FAFC', padding: '12px 10px', borderRadius: '14px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8F92A1', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                <Calendar size={11} /> Date
                                                            </div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>
                                                                {new Date(test.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </div>
                                                        </div>
                                                        <div style={{ background: '#F8FAFC', padding: '12px 10px', borderRadius: '14px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8F92A1', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                <Target size={11} /> Marks
                                                            </div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.total_marks}</div>
                                                        </div>
                                                        <div style={{ background: '#F8FAFC', padding: '12px 10px', borderRadius: '14px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8F92A1', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                <Clock size={11} /> Dur.
                                                            </div>
                                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.duration_minutes}m</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 'auto' }}>
                                                        <button
                                                            onClick={() => window.location.href = `/student/tests/${test.id || test._id}`}
                                                            style={{ 
                                                                width: '100%', 
                                                                padding: '14px', 
                                                                borderRadius: '16px', 
                                                                background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                                                                color: 'white', 
                                                                border: 'none',
                                                                fontWeight: 800, 
                                                                fontSize: '14px', 
                                                                cursor: 'pointer', 
                                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                gap: '8px',
                                                                boxShadow: '0 4px 12px rgba(26,29,59,0.1)'
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, #E53935 0%, #C62828 100%)';
                                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(229,57,53,0.3)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.background = 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,29,59,0.1)';
                                                            }}
                                                        >
                                                            <Eye size={16} /> View Details
                                                        </button>
                                                        
                                                        {result && (
                                                            <div style={{ 
                                                                marginTop: '16px', 
                                                                padding: '14px 16px', 
                                                                background: result.pass_fail === 'pass' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                                                                borderRadius: '16px', 
                                                                border: `1px dashed ${result.pass_fail === 'pass' ? '#10B981' : '#EF4444'}`,
                                                                display: 'flex', 
                                                                flexDirection: 'column', 
                                                                gap: '10px'
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Result</div>
                                                                    <div style={{ 
                                                                        fontSize: '11px', 
                                                                        fontWeight: 900, 
                                                                        color: result.pass_fail === 'pass' ? '#10B981' : '#EF4444',
                                                                        background: result.pass_fail === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '6px'
                                                                    }}>
                                                                        {result.pass_fail?.toUpperCase()}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 700 }}>Score Obtained</span>
                                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                                                        <span style={{ fontSize: '20px', fontWeight: 900, color: result.pass_fail === 'pass' ? '#10B981' : '#EF4444' }}>{result.marks_obtained}</span>
                                                                        <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700 }}>/{result.total_marks}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Custom Progress Bar */}
                                                                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                                    <div style={{ 
                                                                        width: `${(result.marks_obtained / result.total_marks) * 100}%`, 
                                                                        height: '100%', 
                                                                        background: result.pass_fail === 'pass' ? '#10B981' : '#EF4444', 
                                                                        borderRadius: '50px' 
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}

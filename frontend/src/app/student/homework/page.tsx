'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { PenTool, CheckCircle, Clock, AlertTriangle, FileUp, MessageSquare, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StudentHomeworkPage() {
    const [data, setData] = useState<any>(null);
    const [completedHomework, setCompletedHomework] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [dashboardRes, submissionsRes] = await Promise.all([
                api.get('/dashboard/student'),
                api.get('/students/me/homework-history')
            ]);
            setData(dashboardRes.data.data);
            setCompletedHomework(submissionsRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch homework', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmission = async (homeworkId: string) => {
        setIsSubmitting(homeworkId);
        try {
            await api.post(`/homework/${homeworkId}/submit`);
            toast.success('Homework submitted successfully!');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit homework');
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Homework & Assignments
                        </h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Submit your pending schoolwork and review grades and teachers' feedback.
                        </p>
                    </div>
                </div>

                <div className="page-body">
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                            
                            {/* Pending Homework */}
                            {data?.pending_homework?.length > 0 ? (
                                <div className="glass-card" style={{ 
                                    padding: '30px', 
                                    borderRadius: '24px', 
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    background: 'rgba(255, 255, 255, 0.9)', 
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)'
                                }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#F59E0B', fontFamily: 'Poppins, sans-serif' }}>
                                        <AlertTriangle size={22} /> Action Required
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {data.pending_homework.map((hw: any, idx: number) => (
                                            <div key={hw.id} className="animate-fade-in hover-lift" style={{
                                                padding: '20px', 
                                                borderRadius: '16px', 
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                borderLeft: '4px solid #F59E0B', 
                                                background: '#FFFFFF',
                                                animationDelay: `${idx * 40}ms`, 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                flexWrap: 'wrap', 
                                                gap: '16px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ 
                                                            fontSize: '10px', 
                                                            fontWeight: 800, 
                                                            padding: '4px 10px', 
                                                            borderRadius: '6px', 
                                                            background: '#FEF3C7', 
                                                            color: '#F59E0B',
                                                            letterSpacing: '0.04em'
                                                        }}>DUE SOON</span>
                                                        <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                            <Clock size={13} /> Due: {hw.homework?.due_date}
                                                        </span>
                                                    </div>
                                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>{hw.homework?.title || 'Homework'}</h4>
                                                    <p style={{ fontSize: '13px', color: '#5E6278', marginTop: '4px', fontWeight: 600 }}>{hw.homework?.subject}</p>
                                                    <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '8px', fontStyle: 'italic', lineHeight: 1.4 }}>"{hw.homework?.description}"</p>
                                                </div>

                                                <button
                                                    className="btn hover-lift"
                                                    style={{ 
                                                        display: 'flex', 
                                                        gap: '8px', 
                                                        alignItems: 'center',
                                                        background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '12px 24px',
                                                        borderRadius: '12px',
                                                        fontWeight: 700,
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(229, 57, 53, 0.15)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => handleSubmission(hw.homework?._id)}
                                                    disabled={isSubmitting === hw.homework?._id}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 57, 53, 0.25)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.15)';
                                                    }}
                                                >
                                                    <FileUp size={16} /> {isSubmitting === hw.homework?._id ? 'Submitting...' : 'Submit Work'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card" style={{ 
                                    textAlign: 'center', 
                                    padding: '50px 30px',
                                    borderRadius: '24px', 
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    background: 'rgba(255, 255, 255, 0.9)', 
                                    backdropFilter: 'blur(16px)'
                                }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CheckCircle size={32} color="#10B981" />
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>You're all caught up!</h3>
                                    <p style={{ color: '#8F92A1', fontSize: '14px', marginTop: '8px', fontWeight: 500 }}>No pending homework assignments. Outstanding work!</p>
                                </div>
                            )}

                            {/* Submission History */}
                            <div className="glass-card" style={{ 
                                padding: '30px', 
                                borderRadius: '24px', 
                                border: '1px solid rgba(226, 232, 240, 0.8)', 
                                background: 'rgba(255, 255, 255, 0.9)', 
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)'
                            }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10B981', fontFamily: 'Poppins, sans-serif' }}>
                                    <CheckCircle size={22} /> Submission History
                                </h3>

                                {completedHomework.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8F9FD', borderRadius: '20px' }}>
                                        <PenTool size={36} color="#A1A5B7" style={{ marginBottom: '12px' }} />
                                        <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 500 }}>Recently submitted assignments will appear here.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {completedHomework.map((sub: any) => (
                                            <div key={sub.id} style={{ 
                                                padding: '20px', 
                                                borderRadius: '16px', 
                                                background: '#F8F9FD', 
                                                border: '1px solid rgba(226, 232, 240, 0.6)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>{sub.homework_id?.title}</h4>
                                                        <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '4px', fontWeight: 500 }}>
                                                            Subject: <span style={{ color: '#5E6278', fontWeight: 600 }}>{sub.homework_id?.subject}</span> • Submitted on {new Date(sub.submission_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span style={{ 
                                                        fontSize: '10px', 
                                                        fontWeight: 800, 
                                                        padding: '4px 12px', 
                                                        borderRadius: '6px',
                                                        background: sub.status === 'evaluated' ? '#DCFCE7' : '#DBEAFE',
                                                        color: sub.status === 'evaluated' ? '#15803D' : '#1D4ED8',
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        {sub.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                {sub.status === 'evaluated' && (
                                                    <div style={{ 
                                                        marginTop: '16px', 
                                                        padding: '16px', 
                                                        background: '#FFFFFF', 
                                                        borderRadius: '12px', 
                                                        borderLeft: '4px solid #10B981',
                                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                                        borderLeftWidth: '4px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Award size={15} /> Score: {sub.marks_obtained}/{sub.homework_id?.total_marks}
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Feedback provided</span>
                                                        </div>
                                                        <p style={{ fontSize: '13px', color: '#5E6278', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
                                                            <MessageSquare size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-1px', color: '#A1A5B7' }} />
                                                            "{sub.feedback || 'Great work!'}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}

'use client';
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
                api.get('/students/me/homework-history') // I will create this endpoint
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
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Homework & Assignments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Submit pending homework and review teacher feedback.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr)', gap: '20px' }}>

                        {data?.pending_homework?.length > 0 ? (
                            <div className="card">
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                                    <AlertTriangle size={20} /> Action Required
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {data.pending_homework.map((hw: any, idx: number) => (
                                        <div key={hw.id} className="animate-fade-in" style={{
                                            padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)',
                                            borderLeft: '4px solid var(--warning)', background: 'var(--bg-secondary)',
                                            animationDelay: `${idx * 40}ms`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>DUE SOON</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> Due: {hw.homework?.due_date}
                                                    </span>
                                                </div>
                                                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{hw.homework?.title || 'Homework'}</h4>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{hw.homework?.subject}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>"{hw.homework?.description}"</p>
                                            </div>

                                            <button
                                                className="btn btn-primary"
                                                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                                                onClick={() => handleSubmission(hw.homework?._id)}
                                                disabled={isSubmitting === hw.homework?._id}
                                            >
                                                <FileUp size={16} /> {isSubmitting === hw.homework?._id ? 'Submitting...' : 'Submit Work'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                                <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>You're all caught up!</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No pending homework assignments. Enjoy your free time!</p>
                            </div>
                        )}

                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} color="var(--success)" /> Submission History
                            </h3>

                            {completedHomework.length === 0 ? (
                                <div className="empty-state" style={{ minHeight: '200px' }}>
                                    <PenTool size={32} />
                                    <p>Recently submitted homework will appear here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {completedHomework.map((sub: any) => (
                                        <div key={sub.id} className="card" style={{ padding: '16px', background: 'var(--bg-tertiary)', border: 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{sub.homework_id?.title}</h4>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{sub.homework_id?.subject} • Submitted on {new Date(sub.submission_date).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`badge badge-${sub.status === 'evaluated' ? 'success' : 'info'}`} style={{ fontSize: '11px' }}>
                                                    {sub.status.toUpperCase()}
                                                </span>
                                            </div>

                                            {sub.status === 'evaluated' && (
                                                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Award size={14} color="var(--success)" /> Score: {sub.marks_obtained}/{sub.homework_id?.total_marks}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Feedback provided</span>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                        <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} />
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
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Info, ArrowLeft, Clock, Award, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function AttemptTestPage() {
    const params = useParams();
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (params.id) {
            fetchTestData();
        }
    }, [params.id]);

    const fetchTestData = async () => {
        try {
            const res = await api.get(`/tests/${params.id}`);
            const testData = res.data.data;
            setTest(testData);

            if (user?.profile?.id && testData.results) {
                const myResult = testData.results.find((r: any) => r.student_id === user.profile.id);
                setResult(myResult || null);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load test details');
            router.push('/student/tests');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="spinner" style={{ margin: '100px auto' }} suppressHydrationWarning />;

    return (
        <DashboardLayout requiredRole="student">
        <div style={{ minHeight: 'calc(100vh - 40px)', background: '#F4F5F9', padding: '24px', margin: '-24px', borderRadius: '24px' }} suppressHydrationWarning>
            <div style={{ maxWidth: '1000px', margin: '0 auto 24px' }}>
                <button 
                    onClick={() => router.push('/student/tests')}
                    style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px',
                        marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>

            {/* Header */}
            <div style={{ 
                maxWidth: '1000px', margin: '0 auto 24px', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'flex-start',
                background: 'white', padding: '24px', borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {test?.test_name}
                    </h1>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {test?.subject}
                            </div>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} color="var(--primary)" />
                            {test?.test_date ? new Date(test.test_date).toLocaleDateString() : 'TBD'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} color="var(--primary)" />
                            {test?.duration_minutes} Minutes
                        </span>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right', background: 'var(--bg-secondary)', padding: '12px 24px', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Total Marks
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                        {test?.total_marks}
                    </p>
                </div>
            </div>

            {/* Content Container */}
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                    
                    {/* Test Description & Attachments */}
                    {(test?.description || (test?.images && test.images.length > 0)) ? (
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                <Info size={20} color="var(--primary)" /> Test Information & Syllabus
                            </h3>
                            
                            {test?.description && (
                                <div style={{ 
                                    background: 'var(--bg-secondary)', padding: '20px', 
                                    borderRadius: '12px', marginBottom: '24px',
                                    border: '1px solid var(--border-primary)'
                                }}>
                                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                                        {test.description}
                                    </p>
                                </div>
                            )}

                            {test?.images && test.images.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Attached Documents</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                        {test.images.map((img: string, idx: number) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-primary)', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                                <img src={img} alt={`Attachment ${idx + 1}`} style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
                                                <div style={{ padding: '12px', background: 'white', fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textAlign: 'center', borderTop: '1px solid var(--border-primary)' }}>
                                                    Click to view full image
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <Info size={40} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>No additional details provided.</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '8px' }}>Please follow your teacher's instructions for this test.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Marks / Performance Section */}
            <div style={{ maxWidth: '1000px', margin: '24px auto 0' }}>
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                        <Award size={20} color="var(--success)" /> My Test Performance
                    </h3>

                    {result ? (
                        result.was_present === false ? (
                            /* Absent Card */
                            <div style={{ 
                                background: '#FFFBEB', 
                                border: '1px solid #FDE68A',
                                borderRadius: '16px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                        width: '64px', height: '64px', borderRadius: '50%', 
                                        background: '#FEF3C7',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#D97706'
                                    }}>
                                        <AlertCircle size={32} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Attendance Status</p>
                                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#D97706' }}>ABSENT</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Score</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>0 / {test?.total_marks}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>Not Present</p>
                                    </div>
                                </div>

                                <div style={{ width: '100%', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #FDE68A' }}>
                                    <p style={{ fontSize: '14px', color: '#92400E', fontWeight: 500 }}>
                                        You were marked as absent for this test. If you believe this is an error, please contact your teacher.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Present — Normal Result Card */
                            <div style={{ 
                                background: result.pass_fail === 'pass' ? '#F0FDF4' : '#FEF2F2', 
                                border: `1px solid ${result.pass_fail === 'pass' ? '#BBF7D0' : '#FECACA'}`,
                                borderRadius: '16px', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ 
                                        width: '64px', height: '64px', borderRadius: '50%', 
                                        background: result.pass_fail === 'pass' ? '#DCFCE7' : '#FEE2E2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: result.pass_fail === 'pass' ? '#16A34A' : '#DC2626'
                                    }}>
                                        {result.pass_fail === 'pass' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Marks Obtained</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '32px', fontWeight: 800, color: result.pass_fail === 'pass' ? '#16A34A' : '#DC2626' }}>{result.marks_obtained}</span>
                                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-tertiary)' }}>/ {test?.total_marks}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Percentage</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{result.percentage}%</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Grade</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{result.grade}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: result.pass_fail === 'pass' ? '#16A34A' : '#DC2626', textTransform: 'capitalize' }}>
                                            {result.pass_fail}
                                        </p>
                                    </div>
                                </div>

                                {result.remarks && (
                                    <div style={{ width: '100%', marginTop: '8px', paddingTop: '16px', borderTop: `1px solid ${result.pass_fail === 'pass' ? '#BBF7D0' : '#FECACA'}` }}>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Teacher Remarks</p>
                                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{result.remarks}"</p>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div style={{ 
                            background: 'var(--bg-secondary)', border: '1px dashed var(--border-primary)', 
                            borderRadius: '16px', padding: '40px', textAlign: 'center' 
                        }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border-primary)' }}>
                                <Clock size={32} color="var(--text-tertiary)" />
                            </div>
                            <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Marks not declared yet</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Your teacher has not uploaded the results for this test yet. You will be notified once they are available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </DashboardLayout>
    );
}

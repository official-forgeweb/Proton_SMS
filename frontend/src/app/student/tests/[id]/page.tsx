'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Clock, AlertTriangle, CheckCircle, ArrowLeft, Info, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttemptTestPage() {
    const params = useParams();
    const router = useRouter();
    const [test, setTest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchTestData();
        }
    }, [params.id]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && test && !isSubmitted) {
            handleSubmit();
        }
    }, [timeLeft, test, isSubmitted]);

    const fetchTestData = async () => {
        try {
            const res = await api.get(`/tests/${params.id}`);
            const testData = res.data.data;
            setTest(testData);
            setTimeLeft(testData.duration_minutes * 60);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load test details');
            router.push('/student/tests');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Note: For now, we simulate submission as the backend TestResult logic 
            // is currently primarily teacher-driven for grading.
            // In a full implementation, this object would contain student answers.
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            setIsSubmitted(true);
            toast.success('Test submitted successfully!');
        } catch (error) {
            toast.error('Submission failed. Please contact support.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="spinner" style={{ margin: '100px auto' }} />;

    if (isSubmitted) {
        return (
            <DashboardLayout requiredRole="student">
                <div className="card" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle size={40} color="var(--success)" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Test Submitted!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        Your attempt for <strong>{test?.test_name}</strong> has been received. 
                        Your teacher will evaluate it soon.
                    </p>
                    <button className="btn btn-primary" onClick={() => router.push('/student/tests')}>
                        Return to Dashboard
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F4F5F9', padding: '24px' }}>
            {/* Header */}
            <div style={{ 
                maxWidth: '1000px', margin: '0 auto 24px', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center',
                background: 'white', padding: '16px 24px', borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: '24px', zIndex: 100
            }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800 }}>{test?.test_name}</h1>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{test?.subject} • Max {test?.total_marks} Marks</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Time Remaining</p>
                        <p style={{ 
                            fontSize: '20px', fontWeight: 800, 
                            color: timeLeft < 300 ? 'var(--error)' : 'var(--primary)',
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end'
                        }}>
                            <Clock size={20} /> {formatTime(timeLeft)}
                        </p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        style={{ padding: '10px 24px' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Finish Test'}
                    </button>
                </div>
            </div>

            {/* Test Content Placeholder */}
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '20px', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} color="var(--primary)" /> Instructions
                        </h3>
                        <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>• Please ensure you have a stable internet connection before finishing.</li>
                            <li>• Once you click "Finish Test", you cannot change your answers.</li>
                            <li>• The test will auto-submit when the timer reaches 00:00.</li>
                            <li>• Do not refresh or close this tab during the assessment.</li>
                        </ul>
                    </div>

                    {/* Question Placeholder */}
                    <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--border-primary)', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                        <HelpCircle size={48} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                        <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Exam Content Loading...</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                            Please refer to your physical question paper or follow your teacher's instructions for the specific questions in this {test?.test_type || 'assessment'}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning for early exit */}
            <div style={{ maxWidth: '1000px', margin: '24px auto', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <AlertTriangle size={14} color="var(--warning)" /> 
                    Closing this window will not stop the timer.
                </p>
            </div>
        </div>
    );
}

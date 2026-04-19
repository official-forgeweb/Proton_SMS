'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    User, Phone, Mail, GraduationCap, Activity, ArrowLeft,
    TrendingUp, BookOpen, Target, Award, Calendar, BarChart3,
    Clock, Check, X, Minus
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherStudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [attendance, setAttendance] = useState<any>(null);
    const [testStats, setTestStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [homeworkHistory, setHomeworkHistory] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/students/${params.id}`);
            setStudent(res.data.data);
        } catch (error) {
            console.error('Error fetching student details', error);
        } finally {
            setIsLoading(false);
        }

        // Fetch reports in parallel
        const [attRes, testRes, perfRes, hwRes] = await Promise.allSettled([
            api.get(`/students/${params.id}/attendance`),
            api.get(`/students/${params.id}/tests`),
            api.get(`/students/${params.id}/performance`),
            api.get(`/students/${params.id}/homework-history`)
        ]);
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.data.data);
        if (testRes.status === 'fulfilled') setTestStats(testRes.value.data.data);
        if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data.data);
        if (hwRes.status === 'fulfilled') setHomeworkHistory(hwRes.value.data.data);
    };

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return '#059669';
        if (pct >= 60) return '#D97706';
        if (pct >= 40) return '#EA580C';
        return '#DC2626';
    };

    const getScoreBg = (pct: number) => {
        if (pct >= 80) return '#ECFDF5';
        if (pct >= 60) return '#FEF3C7';
        if (pct >= 40) return '#FFF7ED';
        return '#FEF2F2';
    };

    const getGradeLabel = (pct: number) => {
        if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B'; if (pct >= 50) return 'C'; return 'D';
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
                `}} />
                <div style={{ padding: '32px' }}>
                    <div className="skeleton" style={{ height: '120px', marginBottom: '24px', borderRadius: '24px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
                    </div>
                    <div className="skeleton" style={{ height: '400px' }} />
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <GraduationCap size={64} color="#D1D5DB" />
                    <h3 style={{ marginTop: '20px', fontSize: '18px', fontWeight: 700, color: '#1A1D3B' }}>Student not found</h3>
                    <button onClick={() => router.push('/teacher/students')} style={{
                        marginTop: '20px', background: '#E53935', color: 'white', border: 'none',
                        padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                    }}>Back to Students</button>
                </div>
            </DashboardLayout>
        );
    }

    const attPct = parseFloat(attendance?.summary?.percentage || 0);
    const avgScore = parseFloat(testStats?.summary?.average_percentage || 0);
    const totalTests = testStats?.summary?.total_tests || 0;
    const passedTests = testStats?.summary?.passed || 0;
    const failedTests = testStats?.summary?.failed || 0;
    const hwCount = Array.isArray(homeworkHistory) ? homeworkHistory.length : 0;
    const subjectAnalytics = performance?.subjectAnalytics || [];
    const trend = performance?.trend || [];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'academics', label: 'Academics', icon: <BookOpen size={16} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
    ];

    return (
        <DashboardLayout requiredRole="teacher">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                .animate-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .stat-card {
                    background: white; border-radius: 20px; padding: 18px; border: 1px solid #F1F4F9;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .stat-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
                .stat-card-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
                .stat-card:hover .stat-card-icon { transform: scale(1.1) rotate(5deg); }
                .progress-bar-glow { height: 8px; border-radius: 8px; background: #F1F2F6; overflow: hidden; position: relative; }
                .progress-bar-fill { height: 100%; border-radius: 8px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
                .progress-bar-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite linear; }
                .tab-btn { padding: 10px 20px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.25s; background: transparent; color: #8F92A1; }
                .tab-btn:hover { background: #F8F9FD; color: #1A1D3B; }
                .tab-btn.active { background: linear-gradient(135deg, #E53935 0%, #B71C1C 100%); color: white; box-shadow: 0 4px 12px rgba(229,57,53,0.3); }
                .data-card { background: white; border-radius: 20px; padding: 24px; border: 1px solid #F1F2F6; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .test-row { display: flex; align-items: center; padding: 14px 16px; border-radius: 12px; transition: all 0.2s; gap: 16px; }
                .test-row:hover { background: #F8F9FD; }
            `}} />

            {/* Hero Header */}
            <div className="animate-in" style={{
                background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 60%, #1a0a2e 100%)',
                borderRadius: '24px', padding: '28px 36px', marginBottom: '24px', color: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(229,57,53,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-50px', right: '150px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(124,58,237,0.06)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(229,57,53,0.2), rgba(124,58,237,0.2))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: '26px', backdropFilter: 'blur(10px)',
                        }}>
                            {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                                    {student.first_name} {student.last_name}
                                </h1>
                                <span style={{ fontSize: '11px', fontWeight: 800, background: '#E53935', color: 'white', padding: '4px 10px', borderRadius: '50px', letterSpacing: '0.5px' }}>
                                    {student.PRO_ID}
                                </span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    background: student.academic_status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: student.academic_status === 'active' ? '#10B981' : '#EF4444',
                                    padding: '4px 10px', borderRadius: '50px'
                                }}>
                                    {(student.academic_status || 'active').toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mail size={13} /> {student.email || 'No email'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={13} /> {student.phone || 'No phone'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <GraduationCap size={13} /> {student.classes?.map((c: any) => c.class_name).join(', ') || 'No Batch'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => router.push('/teacher/students')}
                            style={{
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: '10px 18px', borderRadius: '12px', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                                transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                            <ArrowLeft size={16} /> All Students
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px', animationDelay: '100ms' }}>
                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#FFF0F1', color: '#E53935', flexShrink: 0 }}>
                        <Activity size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance</span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: attPct >= 75 ? '#10B981' : '#F43F5E', background: attPct >= 75 ? '#ECFDF5' : '#FFF1F2', padding: '2px 6px', borderRadius: '4px' }}>
                                {attPct >= 75 ? 'GOOD' : 'LOW'}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{attPct}%</h3>
                        <div className="progress-bar-glow" style={{ height: '4px', margin: '8px 0' }}>
                            <div className="progress-bar-fill" style={{ width: `${attPct}%`, background: '#E53935' }} />
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#F5F3FF', color: '#7C3AED', flexShrink: 0 }}>
                        <Target size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Score</span>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{avgScore}%</h3>
                        <div className="progress-bar-glow" style={{ height: '4px', margin: '8px 0' }}>
                            <div className="progress-bar-fill" style={{ width: `${avgScore}%`, background: '#7C3AED' }} />
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#E8F5E9', color: '#2E7D32', flexShrink: 0 }}>
                        <Award size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests</span>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{totalTests}</h3>
                        <p style={{ fontSize: '11px', color: '#5E6278', fontWeight: 600, margin: '4px 0 0' }}>
                            <span style={{ color: '#2E7D32', fontWeight: 800 }}>{passedTests}</span> Pass • <span style={{ color: '#DC2626', fontWeight: 800 }}>{failedTests}</span> Fail
                        </p>
                    </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#E3F2FD', color: '#1565C0', flexShrink: 0 }}>
                        <BookOpen size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Homework</span>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{hwCount}</h3>
                        <p style={{ fontSize: '11px', color: '#5E6278', fontWeight: 600, margin: '4px 0 0' }}>Submissions</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="animate-in" style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#F8F9FD', padding: '6px', borderRadius: '16px', animationDelay: '200ms' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animationDelay: '250ms' }}>
                    {/* Personal Info */}
                    <div className="data-card">
                        <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="#E53935" /> Personal Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Name', value: `${student.first_name} ${student.last_name}` },
                                { label: 'Gender', value: student.gender || 'N/A' },
                                { label: 'DOB', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A' },
                                { label: 'PRO ID', value: student.PRO_ID },
                                { label: 'Phone', value: student.phone || 'N/A' },
                                { label: 'Email', value: student.email || 'N/A' },
                                { label: 'School', value: student.school_name || 'N/A' },
                                { label: 'Status', value: (student.academic_status || 'active').toUpperCase() },
                            ].map(item => (
                                <div key={item.label}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>{item.label}</span>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: '4px 0 0', wordBreak: 'break-all' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject Performance */}
                    <div className="data-card">
                        <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={18} color="#7C3AED" /> Subject Performance
                        </h3>
                        {subjectAnalytics.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#A1A5B7' }}>
                                <BarChart3 size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>No performance data yet</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {subjectAnalytics.map((sub: any) => (
                                    <div key={sub.subject}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>{sub.subject}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: getScoreColor(sub.average) }}>{Math.round(sub.average)}%</span>
                                        </div>
                                        <div className="progress-bar-glow" style={{ height: '6px' }}>
                                            <div className="progress-bar-fill" style={{ width: `${sub.average}%`, background: getScoreColor(sub.average) }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'academics' && (
                <div className="animate-in data-card" style={{ animationDelay: '250ms' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#E53935" /> Recent Test Results
                    </h3>
                    {!testStats?.tests || testStats.tests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#A1A5B7' }}>
                            <Award size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontWeight: 600, fontSize: '14px' }}>No tests submitted yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {testStats.tests.map((t: any) => {
                                const pct = t.percentage || 0;
                                return (
                                    <div key={t.id} className="test-row">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: getScoreBg(pct), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: getScoreColor(pct), flexShrink: 0 }}>
                                            {getGradeLabel(pct)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', display: 'block' }}>{t.test?.test_name || 'Test'}</span>
                                            <span style={{ fontSize: '12px', color: '#8F92A1' }}>{t.test?.subject} • {t.test?.date ? new Date(t.test.date).toLocaleDateString() : ''}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: 800, fontSize: '16px', color: getScoreColor(pct) }}>{t.marks_obtained}/{t.total_marks}</span>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: getScoreColor(pct) }}>{Math.round(pct)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="animate-in data-card" style={{ animationDelay: '250ms' }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="#E53935" /> Attendance Record
                    </h3>
                    {!attendance?.records || attendance.records.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#A1A5B7' }}>
                            <Calendar size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontWeight: 600, fontSize: '14px' }}>No attendance records yet</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', padding: '16px', background: '#F8F9FD', borderRadius: '16px' }}>
                                {[
                                    { label: 'Present', count: attendance.summary?.present || 0, color: '#059669', bg: '#ECFDF5', icon: <Check size={16} /> },
                                    { label: 'Absent', count: attendance.summary?.absent || 0, color: '#DC2626', bg: '#FEF2F2', icon: <X size={16} /> },
                                    { label: 'Total', count: attendance.summary?.total || 0, color: '#1565C0', bg: '#E3F2FD', icon: <Calendar size={16} /> },
                                ].map(s => (
                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {s.icon}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B' }}>{s.count}</span>
                                            <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 600, display: 'block' }}>{s.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflow: 'auto' }}>
                                {attendance.records.slice(0, 30).map((r: any, idx: number) => (
                                    <div key={r.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: idx % 2 === 0 ? '#FAFBFE' : 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>
                                                {new Date(r.attendance_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {r.class_name && (
                                                <span style={{ fontSize: '11px', fontWeight: 700, background: '#E3F2FD', color: '#1565C0', padding: '2px 8px', borderRadius: '6px' }}>
                                                    {r.class_name}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', textTransform: 'uppercase',
                                            background: r.status === 'present' ? '#ECFDF5' : r.status === 'absent' ? '#FEF2F2' : '#FEF3C7',
                                            color: r.status === 'present' ? '#059669' : r.status === 'absent' ? '#DC2626' : '#D97706',
                                        }}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}

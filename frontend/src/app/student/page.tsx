'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import ResponsivePageContainer from '@/components/ui/ResponsivePageContainer';
import ResponsiveGrid from '@/components/ui/ResponsiveGrid';
import ResponsiveCard from '@/components/ui/ResponsiveCard';
import {
    Calendar, ClipboardList, Award, BookOpen,
    CheckCircle, Clock, PenTool, CreditCard, Activity, Star,
    ChevronRight, Flame
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export default function StudentDashboard() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/student')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="student">
                <ResponsivePageContainer>
                    <div style={{ marginBottom: '32px' }}>
                        <div className="skeleton" style={{ width: '280px', height: '36px', borderRadius: '12px' }} />
                    </div>
                    {/* Welcome Banner Skeleton */}
                    <div className="skeleton" style={{ height: '180px', borderRadius: '24px', marginBottom: '32px' }} />
                    
                    <ResponsiveGrid desktopCols={4} tabletCols={2} mobileCols={1} gap="24px" style={{ marginBottom: '32px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '20px' }} />
                        ))}
                    </ResponsiveGrid>

                    {/* Content Columns Skeleton */}
                    <ResponsiveGrid desktopCols={2} tabletCols={1} mobileCols={1} gap="24px">
                        <div className="skeleton" style={{ height: '380px', borderRadius: '18px' }} />
                        <div className="skeleton" style={{ height: '380px', borderRadius: '18px' }} />
                    </ResponsiveGrid>
                </ResponsivePageContainer>
            </DashboardLayout>
        );
    }

    const student = data?.student;
    const attendance = data?.attendance;
    const performanceData = data?.charts?.performance || [];
    const attendanceTrend = data?.charts?.attendance || [];

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Calculate present and absent days inside attendance trend
    const presentCount = attendanceTrend.filter((a: any) => a.status === 1).length;
    const absentCount = attendanceTrend.filter((a: any) => a.status === 0).length;

    // Custom Tooltip component for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(26, 29, 59, 0.95)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '11px', color: '#A1A5B7', textTransform: 'uppercase' }}>{label}</p>
                    <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '16px', color: '#FFFFFF' }}>
                        Score: <span style={{ color: '#E53935' }}>{payload[0].value}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardLayout requiredRole="student">
            <ResponsivePageContainer style={{ paddingBottom: '120px' }} className="animate-page-entry">
                {/* CSS styles injected for custom animations and transitions */}
                <style>{`
                    .welcome-banner {
                        position: relative;
                        overflow: hidden;
                        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .welcome-banner:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 16px 40px rgba(229, 57, 53, 0.15) !important;
                    }
                    .quick-action-btn {
                        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .quick-action-btn:hover {
                        transform: translateY(-4px) scale(1.02);
                        border-color: rgba(229, 57, 53, 0.3) !important;
                        box-shadow: 0 12px 24px rgba(229, 57, 53, 0.06) !important;
                    }
                    .session-dot {
                        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .session-dot:hover {
                        transform: scale(1.25);
                        z-index: 10;
                    }
                    .tile-item {
                        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .tile-item:hover {
                        transform: translateX(6px);
                        background: #FAFAFC !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
                    }
                    .pulse-tag {
                        position: relative;
                    }
                    .pulse-tag::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: -8px;
                        transform: translateY(-50%);
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background-color: currentColor;
                        animation: pulse-glow 1.5s infinite;
                    }
                    @keyframes pulse-glow {
                        0% { opacity: 0.3; transform: translateY(-50%) scale(0.8); }
                        50% { opacity: 1; transform: translateY(-50%) scale(1.2); }
                        100% { opacity: 0.3; transform: translateY(-50%) scale(0.8); }
                    }
                `}</style>

                {/* Main Header / Welcome Area */}
                <div style={{ marginBottom: '24px', padding: '12px 0' }}>
                    <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                        Student Dashboard
                    </h2>
                    <p style={{ color: '#5E6278', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        Track your academic excellence and daily tasks.
                    </p>
                </div>

                {/* Welcome Banner Hero */}
                <div className="welcome-banner" style={{
                    background: 'linear-gradient(135deg, #1A1D3B 0%, #11142A 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    color: 'white',
                    boxShadow: '0 12px 36px rgba(26, 29, 59, 0.12)',
                    marginBottom: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    {/* Interactive Aura Blur Elements */}
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(229,57,53,0.35) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '26px',
                                fontWeight: 800,
                                boxShadow: '0 8px 24px rgba(229, 57, 53, 0.35)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                textTransform: 'uppercase'
                            }}>
                                {student?.first_name?.[0] || ''}{student?.last_name?.[0] || ''}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: 'rgba(229, 57, 53, 0.2)',
                                        color: '#FF8A80',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        border: '1px solid rgba(229, 57, 53, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Flame size={12} /> Student Lounge
                                    </span>
                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        color: '#E4E6EF',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        borderRadius: '20px'
                                    }}>
                                        {student?.PRO_ID}
                                    </span>
                                </div>
                                <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginTop: '8px', color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif', margin: '8px 0 0 0' }}>
                                    Welcome back, {student?.first_name || 'Student'}! 👋
                                </h1>
                                <p style={{ color: '#A1A5B7', fontSize: '13.5px', marginTop: '6px', fontWeight: 500, margin: '6px 0 0 0' }}>
                                    Enrolled Program: <strong style={{ color: '#FFFFFF' }}>{data?.classes?.[0]?.class_name || 'No class enrolled'}</strong>
                                </p>
                            </div>
                        </div>
                        
                        {/* Detailed Performance Snapshot Box */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '18px',
                            padding: '16px 20px',
                            flex: '1 1 280px',
                            maxWidth: '340px',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <p style={{ fontSize: '13px', color: '#E4E6EF', margin: 0, fontWeight: 500, lineHeight: '1.5' }}>
                                {(attendance?.percentage || 0) >= 80 ? (
                                    <span>🌟 Fantastic! Your attendance is a stellar <strong style={{ color: '#10B981', fontWeight: 700 }}>{(attendance?.percentage || 0).toFixed(0)}%</strong>. Keep this top record going!</span>
                                ) : (
                                    <span>⚠️ Attention: Attendance is currently <strong style={{ color: '#F59E0B', fontWeight: 700 }}>{(attendance?.percentage || 0).toFixed(0)}%</strong>. Ensure attendance in upcoming lectures.</span>
                                )}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 500 }}>Pending Homework:</span>
                                <span style={{ fontSize: '12px', color: '#EC4899', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <BookOpen size={12} /> {data?.pending_homework?.length || 0} Assignments
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Access Portal Row */}
                <ResponsiveGrid desktopCols={4} tabletCols={2} mobileCols={1} gap="16px" style={{ marginBottom: '32px' }}>
                    {[
                        { title: 'Academic Schedule', route: '/student/timetable', icon: Calendar, color: '#E53935', bg: '#FFEBEE', desc: 'Lecture timelines' },
                        { title: 'Recorded Lectures', route: '/student/video-lectures', icon: BookOpen, color: '#3B82F6', bg: '#DBEAFE', desc: 'Classroom playbacks' },
                        { title: 'Study Materials', route: '/student/study-materials', icon: ClipboardList, color: '#10B981', bg: '#D1FAE5', desc: 'Download syllabus notes' },
                        { title: 'My Performance', route: '/student/performance', icon: Award, color: '#F97316', bg: '#FFEDD5', desc: 'Grades & scorecard' }
                    ].map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <Link key={i} href={action.route} style={{ textDecoration: 'none' }}>
                                <div className="quick-action-btn" style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E4E6EF',
                                    borderRadius: '16px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    cursor: 'pointer',
                                    height: '100%',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
                                }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        background: action.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: action.color,
                                        flexShrink: 0
                                    }}>
                                        <Icon size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.title}</span>
                                            <ChevronRight size={14} style={{ opacity: 0.4, flexShrink: 0, marginLeft: '4px' }} />
                                        </h4>
                                        <span style={{ fontSize: '10.5px', color: '#8F92A1', display: 'block', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.desc}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </ResponsiveGrid>

                {/* High-Fidelity Stats Section */}
                <ResponsiveGrid desktopCols={4} tabletCols={2} mobileCols={1} gap="24px" style={{ marginBottom: '32px' }}>
                    {[
                        { 
                            label: 'Attendance Metric', 
                            value: `${(attendance?.percentage || 0).toFixed(0)}%`, 
                            icon: Calendar, 
                            color: (attendance?.percentage || 0) >= 80 ? '#10B981' : '#F59E0B', 
                            bg: (attendance?.percentage || 0) >= 80 ? '#D1FAE5' : '#FEF3C7',
                            tag: (attendance?.percentage || 0) >= 80 ? 'EXCELLENT' : 'NEEDS FOCUS',
                            borderGlow: (attendance?.percentage || 0) >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            progress: attendance?.percentage || 0
                        },
                        { 
                            label: 'Last Exam Score', 
                            value: data?.recent_tests?.[0] ? `${data.recent_tests[0].marks_obtained}/${data.recent_tests[0].total_marks}` : '-', 
                            icon: Award, 
                            color: '#3B82F6', 
                            bg: '#DBEAFE',
                            tag: data?.recent_tests?.[0] ? `RANK #${data.recent_tests[0].rank_in_class}` : 'FIRST EXAM PENDING',
                            borderGlow: 'rgba(59, 130, 246, 0.2)',
                            progress: data?.recent_tests?.[0] ? data.recent_tests[0].percentage : 0
                        },
                        { 
                            label: 'Pending Fee Due', 
                            value: data?.fee?.pending > 0 ? `₹${((data?.fee?.pending || 0) / 1000).toFixed(1)}K` : '₹0', 
                            icon: CreditCard, 
                            color: data?.fee?.status === 'paid' ? '#10B981' : '#F97316', 
                            bg: data?.fee?.status === 'paid' ? '#D1FAE5' : '#FFEDD5',
                            tag: data?.fee?.status === 'paid' ? 'PAID IN FULL' : 'FEE DUES ACTIVE',
                            borderGlow: data?.fee?.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                            progress: data?.fee?.status === 'paid' ? 100 : 30
                        },
                        { 
                            label: 'Pending Homework', 
                            value: data?.pending_homework?.length || 0, 
                            icon: PenTool, 
                            color: '#EC4899', 
                            bg: '#FCE7F3',
                            tag: `${data?.pending_homework?.length || 0} ACTIVE TASKS`,
                            borderGlow: 'rgba(236, 72, 153, 0.2)',
                            progress: data?.pending_homework?.length > 0 ? Math.max(10, 100 - (data.pending_homework.length * 15)) : 100
                        },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <ResponsiveCard key={s.label} style={{ 
                                border: `1px solid ${s.borderGlow}`, 
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '170px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="pulse-tag" style={{ 
                                        fontSize: '10px', 
                                        fontWeight: 800, 
                                        padding: '4px 8px', 
                                        borderRadius: '6px', 
                                        background: s.bg, 
                                        color: s.color,
                                        marginLeft: '12px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {s.tag}
                                    </span>
                                </div>
                                
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278', marginTop: '6px' }}>{s.label}</div>
                                </div>

                                {/* Embedded Micro Progress Bar */}
                                <div style={{ height: '4px', background: '#EEEEF5', borderRadius: '10px', marginTop: '14px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${s.progress}%`, 
                                        background: s.color, 
                                        borderRadius: '10px',
                                        transition: 'width 0.8s ease'
                                    }} />
                                </div>
                            </ResponsiveCard>
                        );
                    })}
                </ResponsiveGrid>

                {/* Charts Area */}
                <ResponsiveGrid desktopCols={2} tabletCols={1} mobileCols={1} gap="24px" style={{ marginBottom: '32px' }}>
                    {/* Score Trend Card */}
                    <ResponsiveCard style={{ padding: '28px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '18px', background: '#E53935', borderRadius: '4px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>My Score Trend</h3>
                            </div>
                            <span style={{ fontSize: '12px', color: '#E53935', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: '#FFEBEE' }}>12 Months Metrics</span>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#E53935" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#E53935" />
                                            <stop offset="100%" stopColor="#B71C1C" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="url(#strokeGradient)" strokeWidth={3.5} fillOpacity={1} fill="url(#scoreColor)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ResponsiveCard>

                    {/* Attendance Activity Matrix */}
                    <ResponsiveCard style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '18px', background: '#10B981', borderRadius: '4px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Attendance Heatmap</h3>
                                </div>
                                <Activity size={18} color="#10B981" />
                            </div>
                            <p style={{ fontSize: '12px', color: '#8F92A1', marginBottom: '20px', fontWeight: 500, margin: '4px 0 20px 0' }}>Grid visualization of last 30 lecture sessions</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                                {attendanceTrend.length > 0 ? attendanceTrend.map((a: any, i: number) => (
                                    <div key={i} className="session-dot" title={`${a.date} - ${a.status === 1 ? 'Present' : 'Absent'}`} style={{ 
                                        height: '34px', 
                                        borderRadius: '8px', 
                                        background: a.status === 1 ? '#D1FAE5' : '#FFEBEE',
                                        border: `1px solid ${a.status === 1 ? '#10B981' : '#E53935'}`,
                                        boxShadow: `0 2px 8px ${a.status === 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(229, 57, 53, 0.12)'}`,
                                        cursor: 'pointer'
                                    }} />
                                )) : (
                                    [...Array(30)].map((_, i) => <div key={i} style={{ height: '34px', borderRadius: '8px', background: '#F4F5F9' }} />)
                                )}
                            </div>
                        </div>
                        
                        {/* Numerical breakdown inside tracker */}
                        <div style={{ marginTop: '20px', borderTop: '1px dashed #E4E6EF', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#D1FAE5', border: '1px solid #10B981' }} />
                                        <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase' }}>Present</span>
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{presentCount} Days</div>
                                </div>
                                <div style={{ height: '24px', width: '1px', background: '#E4E6EF' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FFEBEE', border: '1px solid #E53935' }} />
                                        <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase' }}>Absent</span>
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#E53935', marginTop: '4px' }}>{absentCount} Days</div>
                                </div>
                            </div>
                        </div>
                    </ResponsiveCard>
                </ResponsiveGrid>

                {/* Lists Grid Section */}
                <ResponsiveGrid desktopCols={2} tabletCols={1} mobileCols={1} gap="24px">
                    {/* Recent Tests Section */}
                    <ResponsiveCard>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                <Award size={20} color="#4F60FF" /> Recent Test Log
                            </h3>
                            <Link href="/student/performance" style={{ background: '#FFEBEE', border: 'none', color: '#E53935', fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', textDecoration: 'none' }}>
                                View History
                            </Link>
                        </div>
                        {data?.recent_tests?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.recent_tests.slice(0, 3).map((test: any) => {
                                    const themeColor = test.percentage >= 80 ? '#10B981' : test.percentage >= 60 ? '#F59E0B' : '#E53935';
                                    
                                    return (
                                        <div key={test.test_id} className="tile-item" style={{
                                            padding: '16px', 
                                            borderRadius: '16px',
                                            border: '1px solid #F0F0F5', 
                                            borderLeft: `4px solid ${themeColor}`,
                                            background: '#FFFFFF'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 700, fontSize: '14.5px', color: '#1A1D3B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{test.test_name}</p>
                                                    <p style={{ fontSize: '11.5px', color: '#8F92A1', marginTop: '4px', fontWeight: 500, margin: '4px 0 0 0' }}>
                                                        {formatDate(test.test_date)}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <p style={{ fontSize: '18px', fontWeight: 800, color: themeColor, margin: 0 }}>
                                                        {test.marks_obtained}/{test.total_marks}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#F4F5F9', color: '#5E6278', fontWeight: 700 }}>RANK #{test.rank_in_class}</span>
                                                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#F4F5F9', color: '#5E6278', fontWeight: 700 }}>GRADE {test.grade}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Micro progress line inside tile */}
                                            <div style={{ height: '6px', background: '#F0F0F5', borderRadius: '10px', marginTop: '14px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', 
                                                    width: `${test.percentage}%`,
                                                    background: `linear-gradient(90deg, ${themeColor} 0%, ${themeColor}CC 100%)`,
                                                    borderRadius: '10px'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F9FD', borderRadius: '16px' }}>
                                <Star size={32} color="#A1A5B7" style={{ margin: '0 auto 12px' }} />
                                <p style={{ color: '#8F92A1', fontSize: '13.5px', fontWeight: 500, margin: 0 }}>No test results available yet.</p>
                            </div>
                        )}
                    </ResponsiveCard>

                    {/* Homework & Tasks Section */}
                    <ResponsiveCard>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                <PenTool size={20} color="#EC4899" /> Homework Tasks
                            </h3>
                            <Link href="/student/homework" style={{ background: '#FCE7F3', border: 'none', color: '#EC4899', fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', textDecoration: 'none' }}>
                                Launch Portal
                            </Link>
                        </div>
                        {data?.pending_homework?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.pending_homework.slice(0, 3).map((hw: any) => (
                                    <div key={hw.id} className="tile-item" style={{
                                        padding: '16px', 
                                        borderRadius: '16px',
                                        border: '1px solid #F0F0F5',
                                        borderLeft: '4px solid #F59E0B', 
                                        background: '#FFFFFF'
                                    }}>
                                        <p style={{ fontWeight: 700, fontSize: '14.5px', color: '#1A1D3B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hw.homework?.title || 'Homework Assignment'}</p>
                                        <p style={{ fontSize: '11.5px', color: '#8F92A1', marginTop: '6px', fontWeight: 500, margin: '6px 0 0 0' }}>
                                            Subject: <strong style={{ color: '#5E6278' }}>{hw.homework?.subject}</strong> • Due: <strong style={{ color: '#E53935' }}>{formatDate(hw.homework?.due_date)}</strong>
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                            <div style={{ 
                                                padding: '3px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '10px', 
                                                fontWeight: 800, 
                                                background: '#FEF3C7', 
                                                color: '#F59E0B', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '4px' 
                                            }}>
                                                <Clock size={11} /> PENDING SUBMISSION
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F9FD', borderRadius: '16px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <CheckCircle size={28} color="#10B981" />
                                </div>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>All Caught Up!</h4>
                                <p style={{ color: '#8F92A1', fontSize: '13px', marginTop: '6px', fontWeight: 500, margin: '6px 0 0 0' }}>All active homework assignments are completed.</p>
                            </div>
                        )}
                    </ResponsiveCard>
                </ResponsiveGrid>
            </ResponsivePageContainer>
        </DashboardLayout>
    );
}

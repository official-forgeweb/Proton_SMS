'use client';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Users, ClipboardList, UserCheck, Calendar, Clock,
    ChevronRight, Phone, Target, CheckCircle, AlertCircle, Zap, TrendingUp, Activity, ArrowUpRight,
    Sparkles, Bell, BarChart3, GraduationCap, ArrowRight, Layers, MapPin, Video, ExternalLink
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

import type { TeacherDashboardData } from '@/services/dataAccess';

interface Props { data: TeacherDashboardData; }

// ──────────────────────────────────────────────
// Premium Chart Tooltip (dark glass style)
// ──────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(9, 11, 17, 0.95)',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i !== payload.length - 1 ? '4px' : '0' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.stroke || p.fill || p.color }} />
                        <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginRight: '4px' }}>{p.name || p.dataKey}:</span>
                            {p.value}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function TeacherDashboardClient({ data }: Props) {
    const router = useRouter();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const performanceData = data?.charts?.performance || [];
    const attendanceData = data?.charts?.attendance || [];
    const totalClasses = data?.stats?.total_classes || 0;
    const totalStudents = data?.stats?.total_students || 0;
    const pendingEvals = data?.stats?.pending_evaluations || 0;
    const assignedEnqs = data?.stats?.assigned_enquiries || 0;

    const avgAttendance = attendanceData.length > 0 
        ? (attendanceData.reduce((a: number, b: any) => a + b.percentage, 0) / attendanceData.length).toFixed(1) 
        : '0';

    const timeGreeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    const teacherInitials = data?.teacher_name
        ? data.teacher_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'TR';

    const statCards = [
        { icon: BookOpen, label: 'My Classes', value: totalClasses, color: '#E53935', bg: 'rgba(229,57,53,0.06)', border: 'rgba(229,57,53,0.1)' },
        { icon: Users, label: 'Total Students', value: totalStudents, color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.1)' },
        { icon: ClipboardList, label: 'Pending Reviews', value: pendingEvals, color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.1)' },
        { icon: Target, label: 'Assigned Leads', value: assignedEnqs, color: '#F97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.1)' },
    ];

    const quickLinks = [
        { label: 'Homework Manager', desc: 'Assign work & track student submissions', icon: BookOpen, path: '/teacher/homework' },
        { label: 'Test Results Portal', desc: 'Grade evaluations and upload marks', icon: GraduationCap, path: '/teacher/tests' },
        { label: 'Study Materials', desc: 'Upload handouts and digital resources', icon: Layers, path: '/teacher/study-materials' },
    ];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>

            {/* ── Hero Banner ── */}
            <div className="animate-fade-in" style={{
                background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                margin: '0 0 0 0', borderRadius: '0 0 28px 28px', padding: '40px 40px 44px',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(26, 29, 59, 0.18)',
            }}>
                {/* Decorative glow */}
                <div style={{ position: 'absolute', top: '-80px', right: '40px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '100px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(30px)' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif',
                            boxShadow: '0 8px 24px rgba(229, 57, 53, 0.25)',
                            border: '2px solid rgba(255, 255, 255, 0.12)',
                        }}>
                            {teacherInitials}
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                    background: 'rgba(229, 57, 53, 0.15)', color: '#FF8A80', fontSize: '10px', fontWeight: 800,
                                    padding: '5px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1.2px',
                                    border: '1px solid rgba(229, 57, 53, 0.2)',
                                }}>
                                    Teacher Portal
                                </span>
                            </div>
                            <h1 style={{
                                fontSize: '30px', fontWeight: 900, margin: 0, fontFamily: 'Poppins, sans-serif',
                                letterSpacing: '-0.02em', lineHeight: 1.2
                            }}>
                                {timeGreeting}, {data?.teacher_name || 'Teacher'}!
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginTop: '8px', fontWeight: 500, maxWidth: '560px', lineHeight: 1.5 }}>
                                {dayName}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} — 
                                You have <span style={{ color: '#FF8A80', fontWeight: 700 }}>{data?.today?.classes?.length || 0} classes</span> scheduled today.
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => router.push('/teacher/timetable')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                                padding: '12px 22px', borderRadius: '14px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '13px', transition: 'all 0.25s', backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <Calendar size={15} /> My Schedule
                        </button>
                        <button
                            onClick={() => router.push('/teacher/students')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'linear-gradient(135deg, #E53935, #C62828)', color: 'white', border: 'none',
                                padding: '12px 22px', borderRadius: '14px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '13px', transition: 'all 0.25s',
                                boxShadow: '0 6px 20px rgba(229, 57, 53, 0.35)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(229, 57, 53, 0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.35)'; }}
                        >
                            <Users size={15} /> View Students
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 24px', maxWidth: '1500px', margin: '0 auto' }}>

                {/* ── Stats Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '32px', marginBottom: '32px' }}>
                    {statCards.map((s, idx) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="animate-fade-in card-hover" style={{
                                background: '#FFFFFF',
                                borderRadius: '20px',
                                padding: '24px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                                border: `1px solid ${s.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '18px',
                                position: 'relative',
                                overflow: 'hidden',
                                animationDelay: `${80 + idx * 60}ms`
                            }}>
                                <div style={{
                                    position: 'absolute', top: 0, right: 0, width: '90px', height: '90px',
                                    background: `radial-gradient(circle at top right, ${s.color}08 0%, transparent 70%)`,
                                    pointerEvents: 'none'
                                }} />
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    background: s.bg, color: s.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Icon size={22} strokeWidth={2.5} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {s.label}
                                    </span>
                                    <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', margin: '4px 0 0 0', lineHeight: 1.1, fontFamily: 'Poppins, sans-serif' }}>
                                        {s.value}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Analytics Charts ── */}
                <div className="dashboard-grid-2col" style={{ marginBottom: '32px' }}>
                    {/* Performance Chart */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(229,57,53,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Class Performance</h3>
                                    <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>Avg student marks across recent exams</p>
                                </div>
                            </div>
                            <span style={{
                                background: 'rgba(229,57,53,0.06)', color: '#E53935',
                                fontSize: '11px', fontWeight: 800, padding: '5px 14px', borderRadius: '10px', letterSpacing: '0.04em',
                                textTransform: 'uppercase', border: '1px solid rgba(229,57,53,0.1)'
                            }}>
                                Active Batches
                            </span>
                        </div>
                        
                        <div style={{ height: '280px', width: '100%' }}>
                            {performanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#E53935" />
                                                <stop offset="100%" stopColor="#880E4F" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} dy={8} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(229, 57, 53, 0.03)', radius: 12 }} />
                                        <Bar dataKey="value" name="Avg Score" fill="url(#barGrad)" radius={[10, 10, 4, 4]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                    <BarChart3 size={36} style={{ marginBottom: '12px', color: '#A1A5B7', opacity: 0.4 }} />
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#5E6278', margin: 0 }}>No performance data yet</p>
                                    <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '4px' }}>Trends unlock once test evaluations are published.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Trend */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Attendance Trend</h3>
                                <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>Roll call metrics & compliance</p>
                            </div>
                        </div>
                        
                        <div style={{ height: '200px', width: '100%', flex: 1 }}>
                            {attendanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area type="monotone" dataKey="percentage" name="Attendance %" stroke="#10B981" fill="url(#attendGrad)" strokeWidth={2.5} dot={{ stroke: '#10B981', strokeWidth: 2, r: 3, fill: '#FFFFFF' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                    <TrendingUp size={36} style={{ marginBottom: '12px', color: '#A1A5B7', opacity: 0.4 }} />
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#5E6278', margin: 0 }}>No attendance history</p>
                                </div>
                            )}
                        </div>

                        {/* Attendance summary pill */}
                        <div style={{
                            padding: '14px 20px', borderRadius: '14px',
                            background: 'rgba(16,185,129,0.04)',
                            border: '1px solid rgba(16,185,129,0.12)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={16} color="#10B981" />
                                <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 700 }}>Avg Attendance Compliance</span>
                            </div>
                            <span style={{ color: '#10B981', fontWeight: 800, fontSize: '20px', fontFamily: 'Poppins, sans-serif' }}>
                                {avgAttendance}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Today's Sessions + Right Column ── */}
                <div className="dashboard-grid-2col" style={{ alignItems: 'start' }}>
                    
                    {/* Today's Schedule */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EEEEF5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #E53935, #C62828)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                    boxShadow: '0 6px 16px rgba(229, 57, 53, 0.25)'
                                }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Today&apos;s Sessions</h3>
                                    <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>Classes for {dayName}</p>
                                </div>
                            </div>
                            {data?.today?.classes?.length > 0 && (
                                <span style={{
                                    background: 'rgba(229,57,53,0.06)', color: '#E53935',
                                    padding: '5px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                                    border: '1px solid rgba(229,57,53,0.08)'
                                }}>
                                    {data.today.classes.length} Session{data.today.classes.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {data?.today?.classes?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {data.today.classes.map((cls: any) => {
                                    const isOnline = !!cls.online_link;
                                    return (
                                        <div key={cls.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px',
                                            border: '1px solid #F0F0F5', background: '#FFFFFF',
                                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                                        }} className="card-hover">
                                            {/* Time Badge */}
                                            <div style={{
                                                width: '60px', height: '60px', borderRadius: '16px',
                                                background: isOnline ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #E53935, #C62828)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
                                                fontWeight: 800, flexShrink: 0,
                                                boxShadow: isOnline ? '0 6px 16px rgba(16,185,129,0.2)' : '0 6px 16px rgba(229,57,53,0.2)'
                                            }}>
                                                <span style={{ fontSize: '8px', opacity: 0.75, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start</span>
                                                <span style={{ fontSize: '15px', fontFamily: 'Poppins, sans-serif', fontWeight: 800 }}>{cls.class_time_start || '--'}</span>
                                            </div>
                                            
                                            {/* Class details */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <p style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B', margin: 0 }}>{cls.class_name}</p>
                                                    {isOnline && (
                                                        <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(16,185,129,0.06)', color: '#10B981', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.1)' }}>
                                                            Online
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                                        <Users size={13} color="#E53935" /> {cls.student_count || 0} Students
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                                        <MapPin size={13} color="#E53935" /> {isOnline ? 'Virtual Room' : `Room ${cls.room_number || 'B1'}`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                {isOnline && (
                                                    <a
                                                        href={cls.online_link.startsWith('http') ? cls.online_link : `https://${cls.online_link}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{
                                                            background: '#FFFFFF', color: '#10B981', border: '1.5px solid rgba(16,185,129,0.3)',
                                                            padding: '7px 14px', borderRadius: '10px', fontSize: '12px',
                                                            fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#10B981'; }}
                                                    >
                                                        <Video size={12} /> Join
                                                    </a>
                                                )}
                                                {cls.attendance_marked ? (
                                                    <span style={{
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                        color: '#10B981', background: 'rgba(16,185,129,0.06)',
                                                        fontWeight: 800, fontSize: '11px', padding: '7px 14px', borderRadius: '10px',
                                                        border: '1px solid rgba(16,185,129,0.1)'
                                                    }}>
                                                        <CheckCircle size={13} /> Done
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push('/teacher/attendance')}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #E53935, #C62828)', color: 'white', border: 'none',
                                                            padding: '8px 16px', borderRadius: '10px', fontSize: '12px',
                                                            fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,57,53,0.2)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    >
                                                        Mark Attendance
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                <Calendar size={40} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 14px', opacity: 0.4 }} />
                                <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 700, margin: 0 }}>No classes scheduled today</p>
                                <p style={{ color: '#8F92A1', fontSize: '12px', marginTop: '6px' }}>Enjoy your free day or use this time for evaluations!</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Pipeline + Quick Links + Tip */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Enquiry Pipeline */}
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EEEEF5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(249,115,22,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                                        <Target size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Enquiry Pipeline</h3>
                                        <p style={{ fontSize: '11px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>Assigned student inquiries</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data?.enquiries && data.enquiries.length > 0 ? (
                                    data.enquiries.slice(0, 3).map((enq: any) => (
                                        <div
                                            key={enq.id}
                                            className="card-hover"
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '14px 16px', borderRadius: '14px', background: '#FAFBFD',
                                                border: '1px solid #F0F0F5', transition: 'all 0.25s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(249,115,22,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Users size={15} color="#F97316" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>{enq.student_name}</p>
                                                    <p style={{ fontSize: '11px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>{enq.interested_course}</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px',
                                                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px',
                                                background: enq.status === 'new' ? 'rgba(229,57,53,0.06)' : 'rgba(249,115,22,0.06)',
                                                color: enq.status === 'new' ? '#E53935' : '#F97316',
                                                border: `1px solid ${enq.status === 'new' ? 'rgba(229,57,53,0.1)' : 'rgba(249,115,22,0.1)'}`
                                            }}>
                                                {enq.status || 'New'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '24px', color: '#8F92A1', fontSize: '13px', fontWeight: 600 }}>
                                        No active inquiries assigned.
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push('/teacher/enquiries')}
                                    className="card-hover"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: '1px solid #EEEEF5', background: '#FFFFFF',
                                        color: '#5E6278', fontSize: '13px', fontWeight: 700,
                                        cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '6px', transition: 'all 0.25s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1A1D3B'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#1A1D3B'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#5E6278'; e.currentTarget.style.borderColor = '#EEEEF5'; }}
                                >
                                    View Full Pipeline <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Access Console */}
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Poppins, sans-serif' }}>
                                <Sparkles size={15} color="#E53935" /> Quick Access
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {quickLinks.map(link => {
                                    const LinkIcon = link.icon;
                                    return (
                                        <div
                                            key={link.label}
                                            className="card-hover"
                                            onClick={() => router.push(link.path)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                                                borderRadius: '14px', background: '#FAFBFD', border: '1px solid #F0F0F5',
                                                cursor: 'pointer', transition: 'all 0.25s', textDecoration: 'none',
                                            }}
                                        >
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(229,57,53,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935', flexShrink: 0 }}>
                                                <LinkIcon size={18} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>{link.label}</p>
                                                <p style={{ fontSize: '11px', color: '#8F92A1', margin: '2px 0 0 0', fontWeight: 500 }}>{link.desc}</p>
                                            </div>
                                            <ArrowRight size={16} color="#A1A5B7" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pro Tip Card */}
                        <div style={{
                            padding: '24px 28px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #121426 0%, #20234a 60%, #301431 100%)',
                            color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 12px 32px rgba(15, 17, 35, 0.2)',
                            border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: '#E53935', opacity: 0.08, filter: 'blur(30px)' }} />
                            
                            <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Poppins, sans-serif', position: 'relative', zIndex: 1 }}>
                                <Zap size={16} color="#FF8A80" /> Pro Tip
                            </h4>
                            <p style={{ fontSize: '13px', lineHeight: 1.65, opacity: 0.8, fontWeight: 500, position: 'relative', zIndex: 1, margin: 0 }}>
                                Mark attendance within 15 minutes of class start to keep your compliance above 98% and trigger instant parent notifications.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

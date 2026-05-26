'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    GraduationCap, Users, Phone, BookOpen, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, Activity, Zap, Target, Award,
    Clock, ChevronRight, Bell, ArrowUpRight, BarChart3,
    FileText, ClipboardList, PenTool, Video, MessageSquare,
    Calendar, Briefcase
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar,
} from 'recharts';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface DashboardData {
    stats: any;
    funnel: any;
    recent_activity: any[];
    alerts: any[];
    charts: any;
}

// ──────────────────────────────────────────────
// Stat Card Component (mirrors admin quality)
// ──────────────────────────────────────────────
const StatCard = ({
    icon: Icon, label, value, subLabel, change, positive,
    iconBg, iconColor, gradient, delay, onClick
}: any) => (
    <div
        className={`animate-fade-in card-hover ${!gradient ? 'glass-panel' : ''}`}
        onClick={onClick}
        style={{
            background: gradient || '#FFFFFF',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: gradient ? '0 16px 32px -8px rgba(99,102,241,0.35)' : '0 8px 24px -6px rgba(0,0,0,0.03)',
            border: gradient ? 'none' : '1px solid rgba(240,240,245,0.8)',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
            position: 'relative' as const,
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: onClick ? 'pointer' : 'default',
            animationDelay: `${delay}ms`,
            zIndex: 1,
        }}
    >
        {gradient && (
            <>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }} />
            </>
        )}
        {!gradient && (
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: `radial-gradient(circle at top right, ${iconBg}40 0%, transparent 60%)`, opacity: 0.6, zIndex: -1 }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: gradient ? 'rgba(255,255,255,0.2)' : (iconBg || '#EEF2FF'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: gradient ? 'white' : (iconColor || '#6366F1'),
                boxShadow: gradient ? 'inset 0 2px 4px rgba(255,255,255,0.2)' : `0 4px 14px -4px ${iconColor}60`
            }}>
                <Icon size={26} strokeWidth={2.5} />
            </div>
            {change && (
                <span style={{
                    fontSize: '13px', fontWeight: 700, padding: '6px 12px', borderRadius: '20px',
                    background: positive ? (gradient ? 'rgba(255,255,255,0.25)' : '#ECFDF5') : '#FEF2F2',
                    color: positive ? (gradient ? '#FFFFFF' : '#059669') : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    boxShadow: gradient ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
                }}>
                    {positive ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
                    {change}
                </span>
            )}
        </div>

        <div style={{ zIndex: 1, marginTop: '2px' }}>
            <span style={{
                fontSize: '15px', fontWeight: 600,
                color: gradient ? 'rgba(255,255,255,0.9)' : '#8F92A1',
                letterSpacing: '0.02em',
            }}>
                {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <p style={{
                    fontSize: '38px', fontWeight: 800, lineHeight: 1.1,
                    color: gradient ? 'white' : '#1A1D3B',
                    fontFamily: 'Poppins, sans-serif',
                    letterSpacing: '-0.02em',
                }}>
                    {value}
                </p>
            </div>
            {subLabel && (
                <p style={{
                    fontSize: '13px', marginTop: '12px',
                    color: gradient ? 'rgba(255,255,255,0.75)' : '#A1A5B7',
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Target size={14} opacity={gradient ? 0.9 : 0.5} />
                    {subLabel}
                </p>
            )}
        </div>
    </div>
);

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(26, 29, 59, 0.95)',
                borderRadius: '14px',
                padding: '14px 18px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i !== payload.length - 1 ? '6px' : '0' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill }} />
                        <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, margin: 0 }}>
                            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginRight: '6px' }}>{p.name}:</span>
                            {p.value}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Quick Action Card
const QuickAction = ({ icon: Icon, label, desc, color, bg, href, router, delay }: any) => (
    <div
        className="animate-fade-in card-hover"
        onClick={() => router.push(href)}
        style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '24px',
            border: '1px solid rgba(240,240,245,0.8)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            position: 'relative', overflow: 'hidden',
            animationDelay: `${delay}ms`,
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle at top right, ${bg} 0%, transparent 70%)`, opacity: 0.5 }} />
        <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px -2px ${color}40`,
        }}>
            <Icon size={22} color={color} strokeWidth={2.5} />
        </div>
        <div>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#8F92A1', margin: '4px 0 0 0' }}>{desc}</p>
        </div>
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <ArrowUpRight size={16} color="#D1D5DB" />
        </div>
    </div>
);

// ──────────────────────────────────────────────
// Main Dashboard Component
// ──────────────────────────────────────────────

export default function CoordinatorDashboardClient({ data: serverData }: { data?: DashboardData }) {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(serverData || null);
    const [loading, setLoading] = useState(!serverData);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get('/dashboard/admin');
            setData(res.data.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!serverData) fetchData();
    }, [serverData, fetchData]);

    if (loading || !data) {
        return (
            <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    const { stats, funnel, recent_activity, alerts, charts } = data;

    const formatShort = (amount: number) => {
        if (!amount) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const finalBarChartData = charts?.performance || [];
    const finalRadialData = charts?.gender || [];
    const finalStarStudents = charts?.top_students || [];

    // Quick actions grid
    const quickActions = [
        { icon: GraduationCap, label: 'Students', desc: 'Manage enrollments', color: '#10B981', bg: '#ECFDF5', href: '/coordinator/students' },
        { icon: Phone, label: 'Enquiries', desc: 'Handle leads & CRM', color: '#F59E0B', bg: '#FFFBEB', href: '/coordinator/enquiries' },
        { icon: BookOpen, label: 'Classes', desc: 'Create & manage', color: '#8B5CF6', bg: '#F5F3FF', href: '/coordinator/classes' },
        { icon: Calendar, label: 'Timetable', desc: 'Schedule overview', color: '#3B82F6', bg: '#EFF6FF', href: '/coordinator/timetable' },
        { icon: FileText, label: 'Study Materials', desc: 'PDF notes & assets', color: '#EC4899', bg: '#FDF2F8', href: '/coordinator/study-materials' },
        { icon: ClipboardList, label: 'Tests', desc: 'Create & monitor', color: '#EF4444', bg: '#FEF2F2', href: '/coordinator/tests' },
        { icon: PenTool, label: 'Homework', desc: 'Assign & grade', color: '#14B8A6', bg: '#F0FDFA', href: '/coordinator/homework' },
        { icon: BarChart3, label: 'Reports', desc: 'Analytics & exports', color: '#6366F1', bg: '#EEF2FF', href: '/coordinator/reports' },
    ];

    return (
        <div className="bg-mesh dashboard-container">

            {/* ─── Header ─── */}
            <div className="animate-fade-in" style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', animationDelay: '0ms' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                            width: '40px', height: '40px', borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                        }}>
                            <Briefcase size={20} strokeWidth={2.5} />
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                            Coordinator Dashboard
                        </h1>
                    </div>
                    <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> Operations overview — {formattedDate}
                    </p>
                </div>
            </div>

            {/* ─── Stat Cards ─── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px',
            }}>
                <StatCard
                    label="Active Students"
                    value={formatShort(stats?.students?.active || 0)}
                    subLabel={`Total Enrolled: ${formatShort(stats?.students?.total || 0)}`}
                    change={`${((stats?.students?.active / (stats?.students?.total || 1)) * 100 || 0).toFixed(1)}%`}
                    positive={true}
                    icon={GraduationCap}
                    gradient="linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
                    delay={100}
                    onClick={() => router.push('/coordinator/students')}
                />
                <StatCard
                    label="New Enquiries"
                    value={formatShort(stats?.enquiries?.new || 0)}
                    subLabel={`Total Leads: ${formatShort(stats?.enquiries?.total || 0)}`}
                    positive={true}
                    icon={Phone}
                    iconBg="#FFFBEB"
                    iconColor="#F59E0B"
                    delay={150}
                    onClick={() => router.push('/coordinator/enquiries')}
                />
                <StatCard
                    label="Active Classes"
                    value={formatShort(stats?.classes?.active || 0)}
                    subLabel={`Total Classes: ${formatShort(stats?.classes?.total || 0)}`}
                    change={`${stats?.classes?.active || 0}`}
                    positive={true}
                    icon={BookOpen}
                    iconBg="#F5F3FF"
                    iconColor="#8B5CF6"
                    delay={200}
                />
                <StatCard
                    label="Teaching Staff"
                    value={formatShort(stats?.teachers?.active || 0)}
                    subLabel={`Total Teachers: ${formatShort(stats?.teachers?.total || 0)}`}
                    change={`${((stats?.teachers?.active / (stats?.teachers?.total || 1)) * 100 || 0).toFixed(0)}%`}
                    positive={true}
                    icon={Users}
                    iconBg="#FFF0F1"
                    iconColor="#E53935"
                    delay={250}
                />
            </div>

            {/* ─── Quick Actions Grid ─── */}
            <div className="animate-fade-in" style={{ marginBottom: '32px', animationDelay: '300ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#EEF2FF', padding: '8px', borderRadius: '10px', color: '#6366F1' }}>
                        <Zap size={18} strokeWidth={2.5} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                        Quick Actions
                    </h2>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                }}>
                    {quickActions.map((action, idx) => (
                        <QuickAction key={action.label} {...action} router={router} delay={350 + idx * 50} />
                    ))}
                </div>
            </div>

            {/* ─── Charts Row ─── */}
            <div className="responsive-grid-12">
                {/* Bar Chart */}
                <div className="animate-fade-in glass-panel card-hover grid-span-8" style={{
                    borderRadius: '24px', padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '500ms'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                Academic Performance Insights
                            </h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '6px', fontWeight: 500 }}>Monthly average student scores vs attendance</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#F8F9FD', padding: '10px 16px', borderRadius: '14px' }}>
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1D3B', fontWeight: 600 }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#6366F1', display: 'inline-block' }} />
                                Attendance Avg (%)
                            </span>
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1D3B', fontWeight: 600 }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#F97316', display: 'inline-block' }} />
                                Avg Score (%)
                            </span>
                        </div>
                    </div>
                    <div style={{ height: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={finalBarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EBEBF0" opacity={0.6} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#8F92A1', fontWeight: 600 }} dy={12} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8F92A1', fontWeight: 500 }} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 12 }} />
                                <Bar dataKey="Attendance" name="Attendance Avg" fill="#6366F1" radius={[6, 6, 6, 6]} barSize={14} />
                                <Bar dataKey="Student" name="Avg Score" fill="#F97316" radius={[6, 6, 6, 6]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Enquiry Funnel */}
                <div className="animate-fade-in glass-panel card-hover grid-span-4" style={{
                    borderRadius: '24px', padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '600ms',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #EEF2FF 0%, transparent 70%)', zIndex: 0 }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', zIndex: 1, position: 'relative' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                Enquiry Funnel
                            </h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '6px', fontWeight: 500 }}>Conversion pipeline</p>
                        </div>
                        <span style={{
                            fontSize: '13px', fontWeight: 800, color: '#10B981',
                            background: '#ECFDF5', padding: '6px 14px', borderRadius: '20px',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.1)',
                        }}>
                            {funnel.conversion_rate}% Rate
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', zIndex: 1 }}>
                        {[
                            { label: 'Total Enquiries', value: funnel.enquiries, color: '#6366F1', pct: 100 },
                            { label: 'Contacted', value: funnel.contacted, color: '#3B82F6', pct: funnel.enquiries > 0 ? (funnel.contacted / funnel.enquiries) * 100 : 0 },
                            { label: 'Demo Scheduled', value: funnel.demo_scheduled, color: '#F59E0B', pct: funnel.enquiries > 0 ? (funnel.demo_scheduled / funnel.enquiries) * 100 : 0 },
                            { label: 'Demo Completed', value: funnel.demo_completed, color: '#F97316', pct: funnel.enquiries > 0 ? (funnel.demo_completed / funnel.enquiries) * 100 : 0 },
                            { label: 'Enrolled', value: funnel.enrolled, color: '#10B981', pct: funnel.enquiries > 0 ? (funnel.enrolled / funnel.enquiries) * 100 : 0 },
                        ].map((step) => (
                            <div key={step.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>{step.label}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>{step.value}</span>
                                </div>
                                <div style={{ height: '10px', background: '#F4F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${step.pct}%`,
                                        background: `linear-gradient(90deg, ${step.color}, ${step.color}CC)`,
                                        borderRadius: '6px', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: `0 2px 8px ${step.color}40`,
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Bottom Row ─── */}
            <div className="responsive-grid-12">
                {/* Star Performers Table */}
                <div className="animate-fade-in glass-panel grid-span-8" style={{
                    borderRadius: '24px', padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '700ms'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ background: '#FFF4E5', padding: '12px', borderRadius: '14px', color: '#F97316' }}>
                                <Award size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                    Star Performers
                                </h3>
                                <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '4px', fontWeight: 500 }}>Top students ranking globally</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/coordinator/students')}
                            className="dashboard-view-all-btn"
                            style={{
                                background: '#F8F9FD', border: '1px solid #EEEEF5', borderRadius: '12px',
                                padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', fontWeight: 700, color: '#5E6278',
                                transition: 'all 0.2s',
                            }}
                        >
                            View All <ChevronRight size={16} />
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F0F0F5', padding: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                            <thead>
                                <tr>
                                    {['Student Info', 'ID Number', 'Total Marks', 'Accuracy', 'Batch'].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '16px 20px', textAlign: 'left' as const,
                                            color: '#A1A5B7', fontWeight: 700, fontSize: '12px',
                                            textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {finalStarStudents.length > 0 ? finalStarStudents.map((s: any, i: number) => (
                                    <tr key={i} className="table-row-hover">
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff&size=40&bold=true`}
                                                    style={{ width: '42px', height: '42px', borderRadius: '12px', border: '2px solid #F4F5F9', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                                                    alt={s.name}
                                                />
                                                <div>
                                                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B', display: 'block' }}>{s.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>Rank #{i + 1} Global</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#5E6278', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                            {s.id}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '32px', height: '6px', background: '#F4F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: '90%', height: '100%', background: '#F97316', borderRadius: '4px' }} />
                                                </div>
                                                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B' }}>{s.marks}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                background: '#ECFDF5', color: '#059669',
                                                padding: '6px 14px', borderRadius: '10px',
                                                fontSize: '13px', fontWeight: 800,
                                                display: 'inline-block', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
                                            }}>
                                                {s.percent}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ background: '#F8F9FD', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                                {s.year || 2024}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: '#A1A5B7', fontSize: '15px', fontWeight: 500 }}>
                                            No star performers data available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Smart Alerts */}
                <div className="animate-fade-in glass-panel grid-span-4" style={{
                    borderRadius: '24px', padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    display: 'flex', flexDirection: 'column',
                    animationDelay: '800ms',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <style dangerouslySetInnerHTML={{__html: `
                        .coord-custom-scrollbar::-webkit-scrollbar {
                            width: 5px;
                        }
                        .coord-custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .coord-custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(161, 165, 183, 0.2);
                            border-radius: 10px;
                        }
                        .coord-custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(161, 165, 183, 0.4);
                        }
                        @keyframes coord-pulse-ring {
                            0% { transform: scale(0.95); opacity: 0.3; }
                            50% { transform: scale(1.08); opacity: 0.6; }
                            100% { transform: scale(0.95); opacity: 0.3; }
                        }
                        .coord-pulse-danger-ring {
                            position: absolute;
                            top: -4px; left: -4px; right: -4px; bottom: -4px;
                            border-radius: 50%;
                            border: 3px solid #EF4444;
                            animation: coord-pulse-ring 2s infinite ease-in-out;
                            pointer-events: none;
                        }
                    `}} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#EEF2FF', padding: '10px', borderRadius: '12px', color: '#6366F1' }}>
                                <Zap size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                                    Smart Alerts
                                </h3>
                                <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>Critical signals & insights</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="coord-custom-scrollbar"
                        style={{
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            maxHeight: '480px', overflowY: 'auto', paddingRight: '4px', flex: 1
                        }}
                    >
                        {alerts.length > 0 ? (() => {
                            const sortedAlerts = [...alerts].sort((a: any, b: any) => {
                                const weight = { danger: 3, warning: 2, success: 1, info: 0 } as any;
                                return (weight[b.type] || 0) - (weight[a.type] || 0);
                            });

                            return sortedAlerts.map((alert: any, i: number) => {
                                const isStudentAlert = alert.action_link && alert.action_link.includes('/students/');

                                const getAlertConfig = (type: string) => {
                                    switch (type) {
                                        case 'danger': return { icon: AlertTriangle, bg: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(254, 226, 226, 0.9) 100%)', color: '#DC2626', border: '#FECACA' };
                                        case 'warning': return { icon: Activity, bg: 'linear-gradient(135deg, rgba(255, 251, 235, 0.95) 0%, rgba(254, 243, 199, 0.9) 100%)', color: '#D97706', border: '#FDE68A' };
                                        case 'success': return { icon: CheckCircle, bg: 'linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(220, 252, 231, 0.9) 100%)', color: '#16A34A', border: '#BBF7D0' };
                                        default: return { icon: Bell, bg: 'linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.9) 100%)', color: '#2563EB', border: '#BFDBFE' };
                                    }
                                };
                                const config = getAlertConfig(alert.type);
                                const AlertIcon = config.icon;

                                let initials = 'AI';
                                let studentId = 'default';
                                if (isStudentAlert) {
                                    studentId = alert.action_link.split('/students/')[1] || 'default';
                                    const rawName = alert.message.split(' (')[0] || '';
                                    const nameParts = rawName.split(' ');
                                    if (nameParts.length >= 2) {
                                        initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                                    } else if (nameParts.length === 1 && nameParts[0]) {
                                        initials = nameParts[0].substring(0, 2).toUpperCase();
                                    }
                                }

                                const getAvatarBg = (sId: string) => {
                                    const colors = ['#EEF2FF', '#FDF2F8', '#ECFDF5', '#FFFBEB', '#F5F3FF'];
                                    const textColors = ['#4F46E5', '#DB2777', '#059669', '#D97706', '#7C3AED'];
                                    const idx = sId.charCodeAt(0) % colors.length;
                                    return { bg: colors[idx], text: textColors[idx] };
                                };
                                const avatarTheme = getAvatarBg(studentId);

                                // Rewrite admin links to coordinator
                                const actionLink = alert.action_link
                                    ? alert.action_link.replace('/admin/', '/coordinator/')
                                    : null;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => actionLink && router.push(actionLink)}
                                        style={{
                                            display: 'flex', gap: '16px', alignItems: 'center',
                                            padding: '16px', borderRadius: '18px', background: config.bg,
                                            border: `1px solid ${config.border}`, cursor: actionLink ? 'pointer' : 'default',
                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                                        }}
                                        className="card-hover alert-card-transition"
                                    >
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            {isStudentAlert ? (
                                                <div style={{
                                                    width: '42px', height: '42px', borderRadius: '12px',
                                                    background: avatarTheme.bg, color: avatarTheme.text,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '13px',
                                                    border: '1.5px solid rgba(255,255,255,0.8)',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                                                    fontFamily: 'Poppins, sans-serif'
                                                }}>
                                                    {initials}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    width: '42px', height: '42px', borderRadius: '12px',
                                                    background: '#FFFFFF', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: config.color,
                                                    border: '1.5px solid rgba(255,255,255,0.8)',
                                                    boxShadow: `0 4px 10px ${config.color}15`,
                                                }}>
                                                    <AlertIcon size={20} strokeWidth={2.5} />
                                                </div>
                                            )}

                                            {alert.type === 'danger' && <div className="coord-pulse-danger-ring" />}

                                            {isStudentAlert && (
                                                <div style={{
                                                    position: 'absolute', bottom: '-4px', right: '-4px',
                                                    width: '18px', height: '18px', borderRadius: '50%',
                                                    background: config.color, color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    border: '1.5px solid white'
                                                }}>
                                                    <AlertIcon size={9} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B', marginBottom: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0 }}>
                                                {alert.title}
                                            </h4>
                                            <p style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: 1.45, fontWeight: 500, margin: 0 }}>
                                                {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            });
                        })() : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F8F9FD', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <CheckCircle size={32} color="#10B981" style={{ marginBottom: '12px', opacity: 0.8 }} />
                                <p style={{ color: '#1A1D3B', fontSize: '15px', fontWeight: 700, margin: 0 }}>All Systems Nominal</p>
                                <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 500, marginTop: '4px', margin: 0 }}>No critical warnings at this time.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Recent Activity Timeline ─── */}
            <div className="animate-fade-in glass-panel" style={{
                borderRadius: '24px', padding: '32px', marginTop: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                animationDelay: '900ms',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: '#F5F3FF', padding: '10px', borderRadius: '12px', color: '#8B5CF6' }}>
                        <Activity size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                            Recent Activity
                        </h3>
                        <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '4px', fontWeight: 500 }}>Latest operations & events</p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recent_activity?.length > 0 ? recent_activity.map((item: any, idx: number) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px 20px', borderRadius: '16px', background: '#F8F9FD',
                            transition: 'all 0.2s',
                        }} className="card-hover">
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: item.type === 'enrollment' ? '#ECFDF5' : item.type === 'payment' ? '#EFF6FF' : '#FFFBEB',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: item.type === 'enrollment' ? '#10B981' : item.type === 'payment' ? '#3B82F6' : '#F59E0B',
                                    boxShadow: `0 0 8px ${item.type === 'enrollment' ? '#10B981' : item.type === 'payment' ? '#3B82F6' : '#F59E0B'}60`,
                                }} />
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', flex: 1, margin: 0, lineHeight: 1.5 }}>
                                {item.message}
                            </p>
                            <span style={{
                                fontSize: '12px', color: '#A1A5B7', whiteSpace: 'nowrap',
                                background: '#FFFFFF', padding: '4px 12px', borderRadius: '8px',
                                fontWeight: 600, border: '1px solid #F0F0F5',
                            }}>
                                {item.time ? new Date(item.time).toLocaleDateString() : ''}
                            </span>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F9FD', borderRadius: '16px' }}>
                            <p style={{ color: '#A1A5B7', fontSize: '14px', fontWeight: 500, margin: 0 }}>No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

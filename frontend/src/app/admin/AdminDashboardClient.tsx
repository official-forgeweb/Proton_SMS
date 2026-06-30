'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, BookOpen, Clock, Activity, Target, Zap, ChevronRight, Award, AlertTriangle, CheckCircle, Bell, Plus, Calendar, Shield, Phone
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, LineChart, Line
} from 'recharts';

import api from '@/lib/api';
import type { AdminDashboardData, AdminDashboardCharts, AlertInsight } from '@/services/dataAccess';

// ──────────────────────────────────────────────
// Custom Tooltip for Charts
// ──────────────────────────────────────────────
const CustomTooltip = React.memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(9, 11, 17, 0.95)',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i !== payload.length - 1 ? '4px' : '0' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.stroke || p.fill }} />
                        <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginRight: '4px' }}>{p.name}:</span>
                            {typeof p.value === 'number' && p.name.includes('Fee') ? `₹${p.value.toLocaleString()}` : p.value}
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
});
CustomTooltip.displayName = 'CustomTooltip';

// ──────────────────────────────────────────────
// MEMOIZED HIGH-PERFORMANCE CHARTS
// ──────────────────────────────────────────────

const FeeCollectionChart = React.memo(({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="feeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="Fees" name="Fees Collected" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#feeGlow)" />
        </AreaChart>
    </ResponsiveContainer>
));
FeeCollectionChart.displayName = 'FeeCollectionChart';

const StudentGrowthChart = React.memo(({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E53935', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="Students" name="Total Enrolled" stroke="#E53935" strokeWidth={3} dot={{ r: 4, stroke: '#E53935', strokeWidth: 2, fill: '#FFFFFF' }} activeDot={{ r: 6 }} />
        </LineChart>
    </ResponsiveContainer>
));
StudentGrowthChart.displayName = 'StudentGrowthChart';

const AttendanceOverviewChart = React.memo(({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="attGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3B82F6', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="Attendance" name="Avg Attendance %" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#attGlow)" />
        </AreaChart>
    </ResponsiveContainer>
));
AttendanceOverviewChart.displayName = 'AttendanceOverviewChart';

const EnquiryTrendsChart = React.memo(({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBF0" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 500 }} dx={-8} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#F97316', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="Enquiries" name="New Leads" stroke="#F97316" strokeWidth={2.5} strokeDasharray="3 3" dot={{ r: 3, stroke: '#F97316', fill: '#F97316' }} />
        </LineChart>
    </ResponsiveContainer>
));
EnquiryTrendsChart.displayName = 'EnquiryTrendsChart';

// ──────────────────────────────────────────────
// Stats Card Component
// ──────────────────────────────────────────────
const StatCard = React.memo(({ icon: Icon, label, value, trend, isTrendPositive, delay, colorClass }: any) => {
    const colorTheme = useMemo(() => {
        switch (colorClass) {
            case 'red': return { bg: 'rgba(229,57,53,0.06)', text: '#E53935', border: 'rgba(229,57,53,0.1)' };
            case 'green': return { bg: 'rgba(16,185,129,0.06)', text: '#10B981', border: 'rgba(16,185,129,0.1)' };
            case 'blue': return { bg: 'rgba(59,130,246,0.06)', text: '#3B82F6', border: 'rgba(59,130,246,0.1)' };
            case 'orange': return { bg: 'rgba(249,115,22,0.06)', text: '#F97316', border: 'rgba(249,115,22,0.1)' };
            default: return { bg: 'rgba(139,92,246,0.06)', text: '#8B5CF6', border: 'rgba(139,92,246,0.1)' };
        }
    }, [colorClass]);

    return (
        <div className="animate-fade-in card-hover" style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
            border: `1px solid ${colorTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            position: 'relative',
            overflow: 'hidden',
            animationDelay: `${delay}ms`
        }}>
            <div style={{
                position: 'absolute', top: 0, right: 0, width: '90px', height: '90px',
                background: `radial-gradient(circle at top right, ${colorTheme.text}08 0%, transparent 70%)`,
                pointerEvents: 'none'
            }} />
            
            <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: colorTheme.bg, color: colorTheme.text,
                display: 'flex', alignItems: 'center', justifyItems: 'center',
                justifyContent: 'center', flexShrink: 0
            }}>
                <Icon size={22} strokeWidth={2.5} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', margin: '4px 0 0 0', lineHeight: 1.1, fontFamily: 'Poppins, sans-serif' }}>
                    {value}
                </h3>
            </div>

            {trend && (
                <div style={{
                    fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '20px',
                    background: isTrendPositive ? '#ECFDF5' : '#FEF2F2',
                    color: isTrendPositive ? '#059669' : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '2px', alignSelf: 'flex-start'
                }}>
                    {isTrendPositive ? '+' : ''}{trend}
                </div>
            )}
        </div>
    );
});
StatCard.displayName = 'StatCard';

// ──────────────────────────────────────────────
// Quick Action Button
// ──────────────────────────────────────────────
const QuickAction = React.memo(({ label, icon: Icon, onClick, colorClass }: any) => {
    const color = colorClass === 'red' ? '#E53935' : colorClass === 'green' ? '#10B981' : colorClass === 'orange' ? '#F97316' : '#6366F1';
    
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px',
                background: '#FFFFFF', border: '1px solid #EEEEF5', color: '#334155', fontWeight: 700,
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="header-action-btn"
        >
            <div style={{
                width: '24px', height: '24px', borderRadius: '8px',
                background: `${color}10`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={14} strokeWidth={2.5} />
            </div>
            {label}
        </button>
    );
});
QuickAction.displayName = 'QuickAction';

// ──────────────────────────────────────────────
// Main Client Dashboard Component
// ──────────────────────────────────────────────
interface AdminDashboardClientProps {
    data: AdminDashboardData;
}

export default function AdminDashboardClient({ data }: AdminDashboardClientProps) {
    const router = useRouter();

    const stats = data?.stats;
    const recentActivity = data?.recent_activity || [];

    const [charts, setCharts] = useState<AdminDashboardCharts | null>(data?.charts || null);
    const [alerts, setAlerts] = useState<AlertInsight[]>(data?.alerts || []);
    const [loadingCharts, setLoadingCharts] = useState(!data?.charts?.fees?.length);
    const [loadingAlerts, setLoadingAlerts] = useState(!data?.alerts?.length);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (loadingCharts) {
            api.get('/dashboard/admin/charts')
                .then(res => {
                    if (res.data && res.data.success) {
                        setCharts(res.data.data);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingCharts(false));
        }

        if (loadingAlerts) {
            api.get('/dashboard/admin/alerts')
                .then(res => {
                    if (res.data && res.data.success) {
                        setAlerts(res.data.data);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingAlerts(false));
        }
    }, [loadingCharts, loadingAlerts]);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Format helper for numbers
    const formatNumber = (val: number) => {
        if (!val) return '0';
        return val.toLocaleString();
    };

    // ──────────────────────────────────────────────
    // Dynamic DB-Backed Historical Chart Series & Parity
    // ──────────────────────────────────────────────
    const hasFeesData = useMemo(() => charts?.fees?.some((item: any) => item.Fees > 0), [charts]);
    const hasStudentsData = useMemo(() => charts?.students?.some((item: any) => item.Students > 0), [charts]);
    const hasAttendanceData = useMemo(() => charts?.attendance?.some((item: any) => item.Attendance > 0), [charts]);
    const hasEnquiriesData = useMemo(() => charts?.enquiries?.some((item: any) => item.Enquiries > 0), [charts]);

    // Premium dynamic HSL empty state placeholder
    const renderEmptyState = (label: string, actionText: string) => (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', width: '100%', gap: '14px', padding: '24px', textAlign: 'center',
            background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0',
            animation: 'fadeIn 0.3s ease'
        }}>
            <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(161, 165, 183, 0.08)', color: '#8F92A1',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Activity size={20} />
            </div>
            <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>No Data Recorded</h4>
                <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '4px', marginInline: 0, fontWeight: 500 }}>
                    {actionText}
                </p>
            </div>
        </div>
    );

    return (
        <div className="animate-page-entry dashboard-client-container">
            
            {/* 1. Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                        Operational Console
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', marginInline: 0 }}>
                        <Calendar size={14} color="#E53935" /> Proton SMS ERP • {formattedDate}
                    </p>
                </div>
                
                {/* Quick actions grid row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <QuickAction label="Add Student" icon={Plus} onClick={() => router.push('/admin/students')} colorClass="red" />
                    <QuickAction label="Add Fee" icon={DollarSign} onClick={() => router.push('/admin/fees')} colorClass="green" />
                    <QuickAction label="Add Teacher" icon={Users} onClick={() => router.push('/admin/teachers')} colorClass="orange" />
                    <QuickAction label="Create Notice" icon={BookOpen} onClick={() => router.push('/admin/operations')} colorClass="indigo" />
                    <QuickAction label="View Enquiries" icon={Phone} onClick={() => router.push('/admin/enquiries')} colorClass="blue" />
                </div>
            </div>

            {/* 2. Stats Grid (8 Premium Cards) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px'
            }}>
                <StatCard label="Total Students" value={formatNumber(stats?.students?.total || 0)} icon={GraduationCap} delay={50} colorClass="red" />
                <StatCard label="Active Teachers" value={formatNumber(stats?.teachers?.active || 0)} icon={Users} delay={100} colorClass="orange" />
                <StatCard label="Coordinators" value={formatNumber(stats?.coordinators?.active || 0)} icon={Shield} delay={150} colorClass="indigo" />
                <StatCard label="Fees Collected" value={`₹${formatNumber(stats?.revenue?.total || 0)}`} icon={DollarSign} delay={200} colorClass="green" />
                <StatCard label="Pending Fees" value={`₹${formatNumber(stats?.revenue?.pending || 0)}`} icon={AlertTriangle} delay={250} colorClass="red" />
                <StatCard label="Attendance %" value={`${stats?.attendance?.avg_percentage || 0}%`} icon={Activity} delay={300} colorClass="blue" />
                <StatCard label="Due Installments" value={formatNumber(stats?.upcoming_installments || 0)} icon={Clock} delay={350} colorClass="red" />
                <StatCard label="Open Enquiries" value={formatNumber(stats?.enquiries?.new || 0)} icon={Phone} delay={400} colorClass="orange" />
            </div>

            {/* 3. Analytics Section (2x2 Memoized Charts Grid) */}
            <div>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                        Operational Analytics
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '4px', marginInline: 0 }}>Visual analysis of fee cashflows, enrollment growth, and lead metrics</p>
                </div>
                
                <div className="dashboard-grid-2col">
                    {/* Chart 1: Fee Collection */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Fee Collection</span>
                        <div style={{ height: '240px', width: '100%' }}>
                            {loadingCharts || !mounted ? (
                                <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
                            ) : hasFeesData ? (
                                <FeeCollectionChart data={charts?.fees || []} />
                            ) : (
                                renderEmptyState('Fee Collection', 'Collect your first installment to display revenue projections.')
                            )}
                        </div>
                    </div>

                    {/* Chart 2: Student Growth */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cumulative Student Growth</span>
                        <div style={{ height: '240px', width: '100%' }}>
                            {loadingCharts || !mounted ? (
                                <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
                            ) : hasStudentsData ? (
                                <StudentGrowthChart data={charts?.students || []} />
                            ) : (
                                renderEmptyState('Student Growth', 'Admit your first student to track institutional growth.')
                            )}
                        </div>
                    </div>

                    {/* Chart 3: Attendance Overview */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance Overview</span>
                        <div style={{ height: '240px', width: '100%' }}>
                            {loadingCharts || !mounted ? (
                                <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
                            ) : hasAttendanceData ? (
                                <AttendanceOverviewChart data={charts?.attendance || []} />
                            ) : (
                                renderEmptyState('Attendance Overview', 'Mark student attendance in class cohorts to track engagement metrics.')
                            )}
                        </div>
                    </div>

                    {/* Chart 4: Enquiry Trends */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enquiry Lead Trends</span>
                        <div style={{ height: '240px', width: '100%' }}>
                            {loadingCharts || !mounted ? (
                                <div className="skeleton" style={{ height: '100%', width: '100%', borderRadius: '12px' }} />
                            ) : hasEnquiriesData ? (
                                <EnquiryTrendsChart data={charts?.enquiries || []} />
                            ) : (
                                renderEmptyState('Enquiry Leads', 'Add enquiry inquiries in lead pipeline to analyze lead generation performance.')
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Split bottom segment: Recent Activity & System Alerts */}
            <div className="dashboard-grid-2col" style={{ alignItems: 'start' }}>
                
                {/* Left Side: Recent Activity Feed */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} color="#6366F1" /> Recent Activity Log
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px', marginInline: 0 }}>Live operational events log</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {recentActivity.length > 0 ? recentActivity.slice(0, 6).map((activity, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: activity.type === 'payment' ? '#10B981' : activity.type === 'enrollment' ? '#6366F1' : '#F97316',
                                    flexShrink: 0
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {activity.message}
                                    </p>
                                </div>
                                <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 500, flexShrink: 0 }}>
                                    {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#A1A5B7', fontSize: '13px' }}>
                                No recent activities logged today.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: System Alerts */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={18} color="#E53935" /> Active System Alerts
                        </h3>
                        <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px', marginInline: 0 }}>Critical indicators requiring staff resolution</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.length > 0 ? alerts.slice(0, 4).map((alert, idx) => {
                            const config = alert.type === 'danger'
                                ? { icon: AlertTriangle, bg: '#FEF2F2', border: '#FEE2E2', color: '#EF4444' }
                                : alert.type === 'warning'
                                ? { icon: AlertTriangle, bg: '#FFFBEB', border: '#FEF3C7', color: '#D97706' }
                                : { icon: CheckCircle, bg: '#ECFDF5', border: '#D1FAE5', color: '#059669' };
                            const Icon = config.icon;

                            return (
                                <div key={idx} style={{
                                    display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px',
                                    background: config.bg, border: `1px solid ${config.border}`, alignItems: 'center'
                                }}>
                                    <div style={{ color: config.color, flexShrink: 0 }}>
                                        <Icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {alert.title}
                                        </p>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#10B981', fontSize: '13px', fontWeight: 700 }}>
                                <CheckCircle size={20} style={{ display: 'block', margin: '0 auto 8px' }} />
                                All Systems Nominal — No alerts
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}

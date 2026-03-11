'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Users, GraduationCap, BookOpen, Phone, Target, CreditCard,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity,
    Clock, AlertTriangle, CheckCircle, ChevronRight, Plus, BarChart3,
    DollarSign, UserPlus, FileText, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardData {
    stats: {
        students: { total: number; active: number };
        teachers: { total: number; active: number };
        classes: { total: number; active: number };
        enquiries: { total: number; new: number };
        demos: { total: number; completed: number };
        revenue: { total: number; pending: number };
    };
    funnel: {
        enquiries: number;
        contacted: number;
        demo_scheduled: number;
        demo_completed: number;
        enrolled: number;
        conversion_rate: number;
    };
    recent_activity: Array<{
        type: string;
        message: string;
        time: string;
    }>;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/admin');
                setData(res.data.data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
        return `₹${amount}`;
    };

    const formatTime = (time: string) => {
        const diff = Date.now() - new Date(time).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const StatCard = ({ icon: Icon, label, value, subValue, color, bgColor, trend, onClick }: any) => (
        <div
            className="stat-card hover-lift"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div className="stat-icon" style={{ background: bgColor }}>
                <Icon size={22} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{value}</div>
                <div className="stat-label">{label}</div>
                {subValue && (
                    <div className="stat-change" style={{ color: trend === 'up' ? 'var(--success)' : 'var(--text-tertiary)' }}>
                        {trend === 'up' && <TrendingUp size={12} />}
                        {subValue}
                    </div>
                )}
            </div>
            {onClick && <ChevronRight size={16} color="var(--text-tertiary)" />}
        </div>
    );

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div className="page-header">
                    <div>
                        <div className="skeleton" style={{ width: '200px', height: '28px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '300px', height: '16px' }} />
                    </div>
                </div>
                <div className="page-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const stats = data?.stats;
    const funnel = data?.funnel;

    return (
        <DashboardLayout requiredRole="admin">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Admin Dashboard</span>
                        <Zap size={20} color="var(--warning)" />
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Welcome to Proton Coaching Control Center
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => router.push('/admin/reports')}>
                        <BarChart3 size={16} /> Reports
                    </button>
                    <button className="btn btn-primary" onClick={() => router.push('/admin/students?action=add')}>
                        <Plus size={16} /> Add Student
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px', marginBottom: '32px',
                }}>
                    <StatCard
                        icon={GraduationCap}
                        label="Total Students"
                        value={stats?.students.total || 0}
                        subValue={`${stats?.students.active || 0} active`}
                        color="#3B82F6" bgColor="#DBEAFE"
                        trend="up"
                        onClick={() => router.push('/admin/students')}
                    />
                    <StatCard
                        icon={Users}
                        label="Teachers"
                        value={stats?.teachers.total || 0}
                        subValue={`${stats?.teachers.active || 0} active`}
                        color="#8B5CF6" bgColor="#EDE9FE"
                        onClick={() => router.push('/admin/teachers')}
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Classes"
                        value={stats?.classes.total || 0}
                        subValue={`${stats?.classes.active || 0} ongoing`}
                        color="#10B981" bgColor="#D1FAE5"
                        onClick={() => router.push('/admin/classes')}
                    />
                    <StatCard
                        icon={Phone}
                        label="Enquiries"
                        value={stats?.enquiries.total || 0}
                        subValue={`${stats?.enquiries.new || 0} new`}
                        color="#F97316" bgColor="#FFEDD5"
                        trend="up"
                        onClick={() => router.push('/admin/enquiries')}
                    />
                    <StatCard
                        icon={Target}
                        label="Demo Classes"
                        value={stats?.demos.total || 0}
                        subValue={`${stats?.demos.completed || 0} completed`}
                        color="#EC4899" bgColor="#FCE7F3"
                        onClick={() => router.push('/admin/demos')}
                    />
                    <StatCard
                        icon={CreditCard}
                        label="Revenue"
                        value={formatCurrency(stats?.revenue.total || 0)}
                        subValue={`${formatCurrency(stats?.revenue.pending || 0)} pending`}
                        color="#14B8A6" bgColor="#CCFBF1"
                        onClick={() => router.push('/admin/fees')}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                    {/* Conversion Funnel */}
                    <div className="card" style={{ gridColumn: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Conversion Funnel</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Lead to enrollment journey</p>
                            </div>
                            <span className="badge badge-success" style={{ fontSize: '13px', fontWeight: 700 }}>
                                {funnel?.conversion_rate || 0}% Rate
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { label: 'Total Enquiries', value: funnel?.enquiries || 0, color: '#3B82F6', max: funnel?.enquiries || 1 },
                                { label: 'Contacted', value: funnel?.contacted || 0, color: '#8B5CF6', max: funnel?.enquiries || 1 },
                                { label: 'Demo Scheduled', value: funnel?.demo_scheduled || 0, color: '#F59E0B', max: funnel?.enquiries || 1 },
                                { label: 'Demo Completed', value: funnel?.demo_completed || 0, color: '#F97316', max: funnel?.enquiries || 1 },
                                { label: 'Enrolled', value: funnel?.enrolled || 0, color: '#10B981', max: funnel?.enquiries || 1 },
                            ].map((step) => (
                                <div key={step.label} className="funnel-step">
                                    <span style={{ width: '120px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                        {step.label}
                                    </span>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <div className="funnel-bar" style={{
                                            width: `${Math.max((step.value / step.max) * 100, 8)}%`,
                                            background: step.color,
                                            minWidth: '40px',
                                        }}>
                                            {step.value}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '40px', textAlign: 'right' }}>
                                        {step.max > 0 ? ((step.value / step.max) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card" style={{ gridColumn: '2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={18} color="var(--primary)" />
                                    Live Activity
                                </h3>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {data?.recent_activity?.map((activity, idx) => {
                                const typeColors: Record<string, { bg: string; icon: any; color: string }> = {
                                    enrollment: { bg: '#D1FAE5', icon: UserPlus, color: '#10B981' },
                                    payment: { bg: '#CCFBF1', icon: DollarSign, color: '#14B8A6' },
                                    enquiry: { bg: '#FFEDD5', icon: Phone, color: '#F97316' },
                                };
                                const typeInfo = typeColors[activity.type] || typeColors.enquiry;
                                const Icon = typeInfo.icon;

                                return (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                                        padding: '12px 0',
                                        borderBottom: idx < (data?.recent_activity?.length || 0) - 1 ? '1px solid var(--border-primary)' : 'none',
                                    }} className="animate-fade-in" >
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px', background: typeInfo.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Icon size={14} color={typeInfo.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                                {activity.message}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} /> {formatTime(activity.time)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card" style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        {[
                            { label: 'Add Student', icon: UserPlus, href: '/admin/students', color: '#3B82F6', bg: '#DBEAFE' },
                            { label: 'Add Teacher', icon: Users, href: '/admin/teachers', color: '#8B5CF6', bg: '#EDE9FE' },
                            { label: 'Create Class', icon: BookOpen, href: '/admin/classes', color: '#10B981', bg: '#D1FAE5' },
                            { label: 'New Enquiry', icon: Phone, href: '/admin/enquiries', color: '#F97316', bg: '#FFEDD5' },
                            { label: 'Schedule Demo', icon: Target, href: '/admin/demos', color: '#EC4899', bg: '#FCE7F3' },
                            { label: 'Record Payment', icon: CreditCard, href: '/admin/fees', color: '#14B8A6', bg: '#CCFBF1' },
                            { label: 'Create Test', icon: FileText, href: '/admin/tests', color: '#EF4444', bg: '#FEE2E2' },
                            { label: 'View Reports', icon: BarChart3, href: '/admin/reports', color: '#6366F1', bg: '#E0E7FF' },
                        ].map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    className="hover-lift"
                                    onClick={() => router.push(action.href)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)', background: 'var(--bg-primary)',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px', background: action.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={action.color} />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Users, GraduationCap, DollarSign, MoreHorizontal, TrendingUp, TrendingDown, BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Cell
} from 'recharts';

interface DashboardData {
    stats: {
        students: { total: number; active: number };
        teachers: { total: number; active: number };
        parents?: { total: number };
        classes: { total: number; active: number };
        enquiries: { total: number; new: number };
        demos: { total: number; completed: number };
        revenue: { total: number; pending: number };
    };
    recent_activity: Array<{
        type: string;
        message: string;
        time: string;
    }>;
}

const barChartData = [
    { name: 'Jan', Teacher: 65, Student: 48 },
    { name: 'Feb', Teacher: 38, Student: 53 },
    { name: 'Mar', Teacher: 79, Student: 58 },
    { name: 'Apr', Teacher: 118, Student: 89 },
    { name: 'May', Teacher: 51, Student: 62 },
    { name: 'Jun', Teacher: 81, Student: 54 },
    { name: 'Jul', Teacher: 32, Student: 42 },
    { name: 'Aug', Teacher: 78, Student: 30 },
    { name: 'Sep', Teacher: 110, Student: 61 },
    { name: 'Oct', Teacher: 53, Student: 39 },
    { name: 'Nov', Teacher: 68, Student: 48 },
];

const radialData = [
    { name: 'Female', value: 7000, fill: '#F97316' },
    { name: 'Male', value: 8000, fill: '#E53935' },
];

const starStudents = [
    { name: 'Evelyn Harper', id: 'PRE43178', marks: 1185, percent: '98%', year: 2024 },
    { name: 'Diana Plenty', id: 'PRE43174', marks: 1165, percent: '91%', year: 2024 },
    { name: 'John Millar', id: 'PRE43187', marks: 1175, percent: '92%', year: 2024 },
    { name: 'Miles Esther', id: 'PRE43371', marks: 1180, percent: '93%', year: 2024 },
];

// Stat Card Component
const StatCard = ({
    icon: Icon,
    label,
    value,
    subLabel,
    change,
    positive,
    iconBg,
    iconColor,
    gradient,
}: {
    icon: any;
    label: string;
    value: string;
    subLabel?: string;
    change?: string;
    positive?: boolean;
    iconBg?: string;
    iconColor?: string;
    gradient?: string;
}) => (
    <div style={{
        background: gradient || '#FFFFFF',
        borderRadius: '18px',
        padding: '24px',
        boxShadow: gradient ? '0 8px 24px rgba(229,57,53,0.15)' : '0 2px 12px rgba(0,0,0,0.04)',
        border: gradient ? 'none' : '1px solid #F0F0F5',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
    }}
        onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = gradient
                ? '0 12px 28px rgba(229,57,53,0.22)'
                : '0 6px 20px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = gradient
                ? '0 8px 24px rgba(229,57,53,0.15)'
                : '0 2px 12px rgba(0,0,0,0.04)';
        }}
    >
        {gradient && (
            <>
                <div style={{
                    position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20px', right: '60px', width: '60px', height: '60px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
                }} />
            </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
                fontSize: '13px', fontWeight: 600,
                color: gradient ? 'rgba(255,255,255,0.8)' : '#8F92A1',
            }}>
                {label}
            </span>
            {change && (
                <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '50px',
                    background: positive ? (gradient ? 'rgba(255,255,255,0.2)' : '#D1FAE5') : '#FEE2E2',
                    color: positive ? (gradient ? 'white' : '#059669') : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '2px',
                }}>
                    {positive ? '+' : ''}{change}
                </span>
            )}
        </div>

        <div>
            <p style={{
                fontSize: '30px', fontWeight: 800, lineHeight: 1,
                color: gradient ? 'white' : '#1A1D3B',
                fontFamily: 'Poppins, sans-serif',
            }}>
                {value}
            </p>
            {subLabel && (
                <p style={{
                    fontSize: '12px', marginTop: '6px',
                    color: gradient ? 'rgba(255,255,255,0.65)' : '#A1A5B7',
                    fontWeight: 500,
                }}>
                    {subLabel}
                </p>
            )}
        </div>

        <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: gradient ? 'rgba(255,255,255,0.2)' : (iconBg || '#FFEBEE'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: gradient ? 'white' : (iconColor || '#E53935'),
        }}>
            <Icon size={22} strokeWidth={2} />
        </div>
    </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#1A1D3B', borderRadius: '10px', padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.fill, fontSize: '13px', fontWeight: 700 }}>
                        {p.name}: {p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
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

    const formatShort = (amount: number) => {
        if (!amount) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px', border: '3px solid #f3f3f3', borderTop: '3px solid #E53935', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const stats = data?.stats;
    const barChartData = data?.charts?.performance || [];
    const radialData = data?.charts?.gender || [];
    const starStudents = data?.charts?.top_students || [];
    const recentActivity = data?.recent_activity || [];

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>

                {/* Page Title */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                        Admin Dashboard
                    </h1>
                    <p style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500, marginTop: '4px' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* 4 Top Stat Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px',
                }}>
                    <StatCard
                        label="Total Students"
                        value={formatShort(stats?.students.total)}
                        subLabel="Students currently enrolled"
                        change={`${((stats?.students.active / stats?.students.total) * 100 || 0).toFixed(1)}%`}
                        positive={true}
                        icon={GraduationCap}
                        gradient="linear-gradient(135deg, #E53935 0%, #C62828 100%)"
                    />
                    <StatCard
                        label="Total Teachers"
                        value={formatShort(stats?.teachers.total)}
                        subLabel="Active vs Total staff"
                        change={`${((stats?.teachers.active / stats?.teachers.total) * 100 || 0).toFixed(0)}%`}
                        positive={true}
                        icon={Users}
                        iconBg="#FFEBEE"
                        iconColor="#E53935"
                    />
                    <StatCard
                        label="Total Parents"
                        value={formatShort(stats?.parents?.total)}
                        subLabel="Parents in system"
                        icon={Users}
                        iconBg="#FFF3E0"
                        iconColor="#F97316"
                    />
                    <StatCard
                        label="Total Earnings"
                        value={`₹${formatShort(stats?.revenue.total)}`}
                        subLabel={`Pending: ₹${formatShort(stats?.revenue.pending)}`}
                        change={`${((stats?.revenue.total / (stats?.revenue.total + stats?.revenue.pending || 1)) * 100).toFixed(1)}%`}
                        positive={true}
                        icon={DollarSign}
                        iconBg="#D1FAE5"
                        iconColor="#10B981"
                    />
                </div>

                {/* Charts Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px',
                }}>
                    {/* Bar Chart - All Exam Results */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5',
                        gridColumn: 'span 2'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    All Exam Results
                                </h3>
                                <p style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '3px' }}>Monthly average student scores</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#5E6278', fontWeight: 500 }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E53935', display: 'inline-block' }} />
                                    Attendance Avg (%)
                                </span>
                                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#5E6278', fontWeight: 500 }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
                                    Avg Score (%)
                                </span>
                            </div>
                        </div>
                        <div style={{ height: '280px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F5" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#A1A5B7', fontWeight: 500 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#A1A5B7' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(229,57,53,0.04)', radius: 8 }} />
                                    <Bar dataKey="Attendance" name="Attendance Avg" fill="#E53935" radius={[6, 6, 0, 0]} barSize={10} />
                                    <Bar dataKey="Student" name="Avg Score" fill="#F97316" radius={[6, 6, 0, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Radial Chart - Students */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Students
                                </h3>
                                <p style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '3px' }}>Gender distribution</p>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/students')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <MoreHorizontal size={18} color="#A1A5B7" />
                            </button>
                        </div>

                        <div style={{ height: '220px', width: '100%', position: 'relative', flex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="100%"
                                    barSize={18}
                                    data={radialData}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar background={{ fill: '#F4F5F9' }} dataKey="value" cornerRadius={12} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', textAlign: 'center',
                            }}>
                                <p style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, marginBottom: '2px' }}>Total</p>
                                <p style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>{formatShort(stats?.students.total)}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {radialData.map((item: any) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.fill, flexShrink: 0 }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278', textTransform: 'capitalize' }}>{item.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>{item.value}</span>
                                        <span style={{ fontSize: '11px', color: '#A1A5B7', marginLeft: '6px' }}>{((item.value / stats?.students.total) * 100 || 0).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                }}>
                    {/* Star Students Table */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5',
                        gridColumn: 'span 2'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Star Students
                                </h3>
                                <p style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '3px' }}>Top performers based on recent tests</p>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/students')}
                                style={{
                                    background: '#F4F5F9', border: 'none', cursor: 'pointer',
                                    borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#5E6278', fontWeight: 600,
                                }}
                            >
                                View All
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        {['Name', 'Student ID', 'Marks', 'Percent', 'Year'].map((h, i) => (
                                            <th key={i} style={{
                                                padding: '12px 16px', textAlign: 'left',
                                                color: '#A1A5B7', fontWeight: 600, fontSize: '12px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                borderBottom: '1px solid #F0F0F5',
                                                ...(i === 0 ? { borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' } : {}),
                                                ...(i === 4 ? { borderTopRightRadius: '10px', borderBottomRightRadius: '10px' } : {}),
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {starStudents.length > 0 ? starStudents.map((s: any, i: number) => (
                                        <tr key={i} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${s.name}&background=4F60FF&color=fff&size=32`}
                                                        style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #FFEBEE' }}
                                                        alt={s.name}
                                                    />
                                                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1A1D3B' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5', fontSize: '13px', color: '#8F92A1' }}>
                                                {s.id}
                                            </td>
                                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5', fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>
                                                {s.marks}
                                            </td>
                                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5' }}>
                                                <span style={{
                                                    background: '#D1FAE5', color: '#059669',
                                                    padding: '3px 10px', borderRadius: '50px',
                                                    fontSize: '12px', fontWeight: 700,
                                                }}>
                                                    {s.percent}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5', fontSize: '13px', color: '#8F92A1' }}>
                                                {s.year}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#A1A5B7', fontSize: '14px' }}>
                                                No test data available for rankings yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '24px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Recent Activity
                                </h3>
                                <p style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '3px' }}>Latest updates from system</p>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/activity')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <MoreHorizontal size={18} color="#A1A5B7" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                            {recentActivity.length > 0 ? recentActivity.map((activity: any, i: number) => {
                                const getActivityConfig = (type: string) => {
                                    switch (type) {
                                        case 'enrollment': return { icon: GraduationCap, bg: '#FFEBEE', color: '#E53935' };
                                        case 'payment': return { icon: DollarSign, bg: '#D1FAE5', color: '#10B981' };
                                        case 'enquiry': return { icon: Users, bg: '#FFF3E0', color: '#F97316' };
                                        default: return { icon: BookOpen, bg: '#F4F5F9', color: '#5E6278' };
                                    }
                                };
                                const config = getActivityConfig(activity.type);
                                const Icon = config.icon;
                                
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            background: config.bg, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: config.color, flexShrink: 0,
                                        }}>
                                            <Icon size={20} strokeWidth={2} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', marginBottom: '3px' }}>
                                                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                                </h4>
                                                <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                                    {new Date(activity.time).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#8F92A1', lineHeight: 1.5 }}>{activity.message}</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p style={{ textAlign: 'center', color: '#A1A5B7', padding: '20px' }}>No recent activity.</p>
                            )}
                        </div>

                        <button 
                            onClick={() => router.push('/admin/activity')}
                            style={{
                                width: '100%', padding: '11px', background: '#F4F5F9',
                                color: '#E53935', border: 'none', borderRadius: '12px',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer', marginTop: '20px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = '#FFEBEE';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = '#F4F5F9';
                            }}
                        >
                            View All Activity
                        </button>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}

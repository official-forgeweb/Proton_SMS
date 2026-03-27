'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Users, GraduationCap, DollarSign, MoreHorizontal, TrendingUp, TrendingDown, BookOpen, Clock, Activity, Target, Zap, ChevronRight, Award
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
    charts?: {
        performance?: any[];
        gender?: any[];
        top_students?: any[];
    };
}

const barChartData: any[] = [];

const radialData: any[] = [];

const starStudents: any[] = [];

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
    delay
}: any) => (
    <div className={`animate-fade-in card-hover ${!gradient ? 'glass-panel' : ''}`} style={{
        background: gradient || '#FFFFFF',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: gradient ? '0 16px 32px -8px rgba(229,57,53,0.35)' : '0 8px 24px -6px rgba(0,0,0,0.03)',
        border: gradient ? 'none' : '1px solid rgba(240,240,245,0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
        animationDelay: `${delay}ms`,
        zIndex: 1,
    }}>
        {/* Background embellishments */}
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
                background: gradient ? 'rgba(255,255,255,0.2)' : (iconBg || '#FFEBEE'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: gradient ? 'white' : (iconColor || '#E53935'),
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
                    backdropFilter: 'blur(8px)',
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

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(26, 29, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '14px 18px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i !== payload.length - 1 ? '6px' : '0' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill }} />
                        <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>
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
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                `}} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                    </div>
                    <p style={{ color: '#1A1D3B', fontSize: '16px', fontWeight: 600, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', fontFamily: 'Poppins, sans-serif' }}>
                        Preparing your dashboard...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    const stats = data?.stats;
    const finalBarChartData = data?.charts?.performance || barChartData;
    const finalRadialData = data?.charts?.gender || radialData;
    const finalStarStudents = data?.charts?.top_students || starStudents;
    const recentActivity = data?.recent_activity || [];

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .card-hover:hover {
                    transform: translateY(-6px) scale(1.01);
                }
                .activity-timeline-item:last-child .timeline-line {
                    display: none;
                }
                .table-row-hover {
                    transition: all 0.2s ease;
                }
                .table-row-hover:hover {
                    background: #F8F9FD;
                    transform: scale(1.005);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .table-row-hover:hover td:first-child {
                    border-top-left-radius: 12px;
                    border-bottom-left-radius: 12px;
                }
                .table-row-hover:hover td:last-child {
                    border-top-right-radius: 12px;
                    border-bottom-right-radius: 12px;
                }
                .bg-mesh {
                    background-color: #f7f8fc;
                    background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 0% 50%, hsla(355,100%,93%,0.15) 0px, transparent 50%);
                }
            `}} />

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>
                
                {/* Header Section */}
                <div className="animate-fade-in" style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: '#E53935', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Activity size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Dashboard Overview
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> Here's what's happening at your institution on {formattedDate}
                        </p>
                    </div>
                </div>

                {/* 4 Top Stat Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }}>
                    <StatCard
                        label="Total Students"
                        value={formatShort(stats?.students?.total || 0)}
                        subLabel="Students currently enrolled"
                        change={`${((stats?.students?.active / (stats?.students?.total || 1)) * 100 || 0).toFixed(1)}%`}
                        positive={true}
                        icon={GraduationCap}
                        gradient="linear-gradient(135deg, #E53935 0%, #B71C1C 100%)"
                        delay={100}
                    />
                    <StatCard
                        label="Total Teachers"
                        value={formatShort(stats?.teachers?.total || 0)}
                        subLabel="Active vs Total staff"
                        change={`${((stats?.teachers?.active / (stats?.teachers?.total || 1)) * 100 || 0).toFixed(0)}%`}
                        positive={true}
                        icon={Users}
                        iconBg="#FFF0F1"
                        iconColor="#E53935"
                        delay={200}
                    />
                    <StatCard
                        label="Total Parents"
                        value={formatShort(stats?.parents?.total || 0)}
                        subLabel="Verified parent accounts"
                        icon={Users}
                        iconBg="#FFF4E5"
                        iconColor="#F97316"
                        delay={300}
                    />
                    <StatCard
                        label="Total Earnings"
                        value={`₹${formatShort(stats?.revenue?.total || 0)}`}
                        subLabel={`Pending: ₹${formatShort(stats?.revenue?.pending || 0)}`}
                        change={`${(((stats?.revenue?.total || 0) / (((stats?.revenue?.total || 0) + (stats?.revenue?.pending || 0)) || 1)) * 100 || 0).toFixed(1)}%`}
                        positive={true}
                        icon={DollarSign}
                        iconBg="#ECFDF5"
                        iconColor="#10B981"
                        delay={400}
                    />
                </div>

                {/* Charts Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '24px',
                    marginBottom: '32px',
                }}>
                    {/* Bar Chart - All Exam Results */}
                    <div className="animate-fade-in glass-panel card-hover" style={{
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                        gridColumn: 'span 8', animationDelay: '500ms'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Academic Performance Insights
                                </h3>
                                <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '6px', fontWeight: 500 }}>Monthly average student scores vs attendance</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#F8F9FD', padding: '10px 16px', borderRadius: '14px' }}>
                                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1D3B', fontWeight: 600 }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#E53935', display: 'inline-block' }} />
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
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 13, fill: '#8F92A1', fontWeight: 600 }}
                                        dy={12}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#8F92A1', fontWeight: 500 }}
                                        dx={-10}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(229,57,53,0.06)', radius: 12 }} />
                                    <Bar dataKey="Attendance" name="Attendance Avg" fill="#E53935" radius={[6, 6, 6, 6]} barSize={14} />
                                    <Bar dataKey="Student" name="Avg Score" fill="#F97316" radius={[6, 6, 6, 6]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Radial Chart - Students */}
                    <div className="animate-fade-in glass-panel card-hover" style={{
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                        display: 'flex', flexDirection: 'column',
                        gridColumn: 'span 4', animationDelay: '600ms', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #FFF0F1 0%, transparent 70%)', zIndex: 0 }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', zIndex: 1 }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Demographics
                                </h3>
                                <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '6px', fontWeight: 500 }}>Gender distribution</p>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/students')}
                                style={{ background: '#F8F9FD', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F5'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                            >
                                <ChevronRight size={20} color="#1A1D3B" />
                            </button>
                        </div>

                        <div style={{ height: '240px', width: '100%', position: 'relative', flex: 1, zIndex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="65%"
                                    outerRadius="100%"
                                    barSize={20}
                                    data={finalRadialData}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar background={{ fill: '#F4F5F9' }} dataKey="value" cornerRadius={12} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', textAlign: 'center',
                                background: 'white', padding: '20px', borderRadius: '50%',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                            }}>
                                <p style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                                <p style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{formatShort(stats?.students?.total || 0)}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px', zIndex: 1, background: '#F8F9FD', padding: '20px', borderRadius: '16px' }}>
                            {finalRadialData.map((item: any) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.fill}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.fill, flexShrink: 0, boxShadow: `0 0 10px ${item.fill}80` }} />
                                        </div>
                                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', textTransform: 'capitalize' }}>{item.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B' }}>{formatShort(item.value)}</span>
                                        <span style={{ fontSize: '13px', color: '#A1A5B7', marginLeft: '8px', fontWeight: 600, background: '#FFFFFF', padding: '4px 8px', borderRadius: '8px' }}>
                                            {((item.value / (stats?.students?.total || 1)) * 100 || 0).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '24px',
                }}>
                    {/* Star Students Table */}
                    <div className="animate-fade-in glass-panel" style={{
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                        gridColumn: 'span 8', animationDelay: '700ms'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ background: '#FFF4E5', padding: '12px', borderRadius: '14px', color: '#F97316' }}>
                                    <Award size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                        Star Performers
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '4px', fontWeight: 500 }}>Top students ranking globally</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/students')}
                                style={{
                                    background: '#F8F9FD', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: '#1A1D3B', fontWeight: 700, transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A1D3B'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F8F9FD'; (e.currentTarget as HTMLElement).style.color = '#1A1D3B'; }}
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
                                                padding: '16px 20px', textAlign: 'left',
                                                color: '#A1A5B7', fontWeight: 700, fontSize: '12px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
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

                    {/* Recent Activity Timeline */}
                    <div className="animate-fade-in glass-panel" style={{
                        borderRadius: '24px', padding: '32px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                        display: 'flex', flexDirection: 'column',
                        gridColumn: 'span 4', animationDelay: '800ms'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#FFF0F1', padding: '10px', borderRadius: '12px', color: '#E53935' }}>
                                    <Zap size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                        Live Feed
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '2px', fontWeight: 500 }}>System activity logs</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push('/admin/activity')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F0F5'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                                <MoreHorizontal size={22} color="#8F92A1" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: '8px' }}>
                            {recentActivity.length > 0 ? recentActivity.map((activity: any, i: number) => {
                                const getActivityConfig = (type: string) => {
                                    switch (type) {
                                        case 'enrollment': return { icon: GraduationCap, bg: '#FFF0F1', color: '#E53935', border: '#E53935' };
                                        case 'payment': return { icon: DollarSign, bg: '#ECFDF5', color: '#10B981', border: '#10B981' };
                                        case 'enquiry': return { icon: Users, bg: '#FFF4E5', color: '#F97316', border: '#F97316' };
                                        default: return { icon: BookOpen, bg: '#F8F9FD', color: '#5E6278', border: '#A1A5B7' };
                                    }
                                };
                                const config = getActivityConfig(activity.type);
                                const Icon = config.icon;
                                
                                return (
                                    <div key={i} className="activity-timeline-item" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', paddingBottom: '28px' }}>
                                        {/* Timeline Line */}
                                        <div className="timeline-line" style={{
                                            position: 'absolute', left: '22px', top: '44px', bottom: '-4px', width: '2px',
                                            background: '#F0F0F5', zIndex: 0
                                        }} />

                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%',
                                            background: '#FFFFFF', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: config.color, flexShrink: 0,
                                            boxShadow: `0 4px 12px ${config.color}20`,
                                            border: `2px solid ${config.bg}`, zIndex: 1
                                        }}>
                                            <Icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <div style={{ flex: 1, paddingTop: '2px', transition: 'transform 0.2s', cursor: 'pointer' }} 
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B', textTransform: 'capitalize', letterSpacing: '0.01em' }}>
                                                    {activity.type}
                                                </h4>
                                                <span style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 600, background: '#F8F9FD', padding: '4px 10px', borderRadius: '20px' }}>
                                                    {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#5E6278', lineHeight: 1.6, fontWeight: 500 }}>{activity.message}</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F9FD', borderRadius: '16px' }}>
                                    <Activity size={32} color="#A1A5B7" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 600 }}>No live activity logged yet.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => router.push('/admin/activity')}
                            style={{
                                width: '100%', padding: '16px', background: 'transparent', border: '1px dashed #D8D8E5',
                                color: '#1A1D3B', borderRadius: '16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = '#1A1D3B';
                                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                                (e.currentTarget as HTMLElement).style.borderStyle = 'solid';
                                (e.currentTarget as HTMLElement).style.borderColor = '#1A1D3B';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color = '#1A1D3B';
                                (e.currentTarget as HTMLElement).style.borderStyle = 'dashed';
                                (e.currentTarget as HTMLElement).style.borderColor = '#D8D8E5';
                            }}
                        >
                            Explore All Activities <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}

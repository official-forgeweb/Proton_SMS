'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    GraduationCap, Users, Phone, BookOpen, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, Star, UserCheck, BarChart3, Eye,
    ArrowUpRight, Activity, Zap, Target, Award
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface DashboardData {
    stats: any;
    funnel: any;
    recent_activity: any[];
    alerts: any[];
    charts: any;
}

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

    const statCards = [
        {
            label: 'Total Students', value: stats.students.total,
            sub: `${stats.students.active} Active`,
            icon: GraduationCap, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)',
            href: '/coordinator/students'
        },
        {
            label: 'Total Enquiries', value: stats.enquiries.total,
            sub: `${stats.enquiries.new} New`,
            icon: Phone, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)',
            href: '/coordinator/enquiries'
        },
        {
            label: 'Active Classes', value: stats.classes.active,
            sub: `${stats.classes.total} Total`,
            icon: BookOpen, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)',
        },
        {
            label: 'Teachers', value: stats.teachers.total,
            sub: `${stats.teachers.active} Active`,
            icon: Users, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)',
        },
    ];

    const alertIcon = (type: string) => {
        switch (type) {
            case 'danger': return <AlertTriangle size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'success': return <CheckCircle size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const alertColor = (type: string) => {
        switch (type) {
            case 'danger': return { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' };
            case 'warning': return { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' };
            case 'success': return { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' };
            default: return { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
        }
    };

    return (
        <div style={{ padding: '28px 0' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}>
                        <Target size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em' }}>
                            Coordinator Dashboard
                        </h1>
                        <p style={{ fontSize: '14px', color: '#A1A5B7', fontWeight: 500, margin: 0 }}>
                            Student management & enquiry operations overview
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px',
                marginBottom: '28px',
            }}>
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            onClick={() => card.href && router.push(card.href)}
                            style={{
                                background: '#FFFFFF', borderRadius: '20px', padding: '24px',
                                border: '1px solid #EEEEF5',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                cursor: card.href ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                position: 'relative', overflow: 'hidden',
                            }}
                            className="stat-card-hover"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#A1A5B7', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {card.label}
                                    </p>
                                    <p style={{ fontSize: '32px', fontWeight: 850, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em' }}>
                                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                    </p>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: card.color, marginTop: '6px' }}>
                                        {card.sub}
                                    </p>
                                </div>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px',
                                    background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={22} color={card.color} strokeWidth={2.5} />
                                </div>
                            </div>
                            {card.href && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <ArrowUpRight size={14} color="#D1D5DB" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                {/* Enquiry Funnel */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '20px', padding: '28px',
                    border: '1px solid #EEEEF5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                            Enquiry Conversion Funnel
                        </h3>
                        <span style={{
                            fontSize: '12px', fontWeight: 700, color: '#10B981',
                            background: 'rgba(16, 185, 129, 0.08)', padding: '4px 12px', borderRadius: '20px',
                        }}>
                            {funnel.conversion_rate}% Rate
                        </span>
                    </div>

                    {[
                        { label: 'Total Enquiries', value: funnel.enquiries, color: '#6366F1', pct: 100 },
                        { label: 'Contacted', value: funnel.contacted, color: '#3B82F6', pct: funnel.enquiries > 0 ? (funnel.contacted / funnel.enquiries) * 100 : 0 },
                        { label: 'Demo Scheduled', value: funnel.demo_scheduled, color: '#F59E0B', pct: funnel.enquiries > 0 ? (funnel.demo_scheduled / funnel.enquiries) * 100 : 0 },
                        { label: 'Demo Completed', value: funnel.demo_completed, color: '#F97316', pct: funnel.enquiries > 0 ? (funnel.demo_completed / funnel.enquiries) * 100 : 0 },
                        { label: 'Enrolled', value: funnel.enrolled, color: '#10B981', pct: funnel.enquiries > 0 ? (funnel.enrolled / funnel.enquiries) * 100 : 0 },
                    ].map((step, idx) => (
                        <div key={step.label} style={{ marginBottom: idx < 4 ? '16px' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>{step.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{step.value}</span>
                            </div>
                            <div style={{ height: '8px', background: '#F4F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${step.pct}%`, background: step.color,
                                    borderRadius: '4px', transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Smart Alerts */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '20px', padding: '28px',
                    border: '1px solid #EEEEF5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 20px 0' }}>
                        🔔 Smart Alerts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                        {alerts.map((alert: any, idx: number) => {
                            const ac = alertColor(alert.type);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => alert.action_link && router.push(alert.action_link.replace('/admin/', '/coordinator/'))}
                                    style={{
                                        padding: '14px 16px', borderRadius: '14px',
                                        background: ac.bg, border: `1px solid ${ac.border}`,
                                        cursor: alert.action_link ? 'pointer' : 'default',
                                        transition: 'transform 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <div style={{ color: ac.color, marginTop: '2px' }}>
                                            {alertIcon(alert.type)}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: ac.color, margin: '0 0 3px 0' }}>
                                                {alert.title}
                                            </p>
                                            <p style={{ fontSize: '12px', fontWeight: 500, color: ac.color, margin: 0, opacity: 0.85, lineHeight: 1.4 }}>
                                                {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Performance Charts + Top Performers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
                {/* Academic Performance Chart */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '20px', padding: '28px',
                    border: '1px solid #EEEEF5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 20px 0' }}>
                        📊 Academic Performance Insights
                    </h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {charts.performance?.map((month: any) => (
                            <div key={month.name} style={{ textAlign: 'center', flex: '1 0 50px', minWidth: '50px' }}>
                                <div style={{
                                    height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '4px'
                                }}>
                                    <div style={{
                                        width: '24px', borderRadius: '6px 6px 0 0',
                                        background: month.Attendance > 0 ? 'linear-gradient(180deg, #6366F1, #8B5CF6)' : '#F4F5F9',
                                        height: `${Math.max(month.Attendance || 0, 4)}px`,
                                        transition: 'height 0.4s ease',
                                    }} />
                                    <div style={{
                                        width: '24px', borderRadius: '6px 6px 0 0',
                                        background: month.Student > 0 ? 'linear-gradient(180deg, #E53935, #FF5252)' : '#F4F5F9',
                                        height: `${Math.max(month.Student || 0, 4)}px`,
                                        transition: 'height 0.4s ease',
                                    }} />
                                </div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#A1A5B7', marginTop: '6px' }}>{month.name}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, #E53935, #FF5252)' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>Performance</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>Attendance</span>
                        </div>
                    </div>
                </div>

                {/* Star Performers */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '20px', padding: '28px',
                    border: '1px solid #EEEEF5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 20px 0' }}>
                        ⭐ Star Performers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {charts.top_students?.length > 0 ? charts.top_students.map((s: any, idx: number) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px 12px', borderRadius: '12px', background: '#F8F9FD',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: idx === 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : idx === 1 ? 'linear-gradient(135deg, #9CA3AF, #6B7280)' : 'linear-gradient(135deg, #CD7F32, #A0522D)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '13px', fontWeight: 800,
                                }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>{s.name}</p>
                                    <p style={{ fontSize: '11px', color: '#A1A5B7', margin: 0 }}>{s.id}</p>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{s.percent}</span>
                            </div>
                        )) : (
                            <p style={{ fontSize: '13px', color: '#A1A5B7', textAlign: 'center', padding: '20px 0' }}>No data yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{
                background: '#FFFFFF', borderRadius: '20px', padding: '28px',
                border: '1px solid #EEEEF5', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 20px 0' }}>
                    🕐 Recent Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recent_activity?.length > 0 ? recent_activity.map((item: any, idx: number) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 16px', borderRadius: '12px', background: '#F8F9FD',
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: item.type === 'enrollment' ? '#10B981' : item.type === 'payment' ? '#3B82F6' : '#F59E0B',
                            }} />
                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#5E6278', flex: 1, margin: 0 }}>
                                {item.message}
                            </p>
                            <span style={{ fontSize: '11px', color: '#A1A5B7', whiteSpace: 'nowrap' }}>
                                {item.time ? new Date(item.time).toLocaleDateString() : ''}
                            </span>
                        </div>
                    )) : (
                        <p style={{ fontSize: '13px', color: '#A1A5B7', textAlign: 'center', padding: '20px 0' }}>No recent activity</p>
                    )}
                </div>
            </div>

            <style jsx>{`
                .stat-card-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
                }
            `}</style>
        </div>
    );
}

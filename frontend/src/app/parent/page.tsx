'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    GraduationCap, Calendar, ClipboardList, CreditCard,
    ChevronDown, ChevronUp, Eye, Award, Bell, Activity, ArrowRight, Wallet
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export default function ParentDashboard() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChild, setSelectedChild] = useState<number>(0);

    useEffect(() => {
        api.get('/dashboard/parent')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="parent">
                <div className="page-header"><div className="skeleton" style={{ width: '300px', height: '28px' }} /></div>
                <div className="page-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const parent = data?.parent;
    const children = (data?.children || []).filter(Boolean);
    const child = children[selectedChild];

    const performanceData = child?.charts?.performance || [];
    const attendanceTrend = child?.charts?.attendance || [];

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B' }}>
                            Hello, {parent?.first_name || 'Parent'}! 👋
                        </h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '4px', fontWeight: 500 }}>
                            Track and manage your children&apos;s academic activities.
                        </p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Children Selector */}
                {children.length > 1 && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', overflowX: 'auto', padding: '4px' }}>
                        {children.map((c: any, idx: number) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChild(idx)}
                                style={{
                                    minWidth: '240px', padding: '16px', borderRadius: '20px',
                                    border: selectedChild === idx ? '2px solid #4F60FF' : '1px solid #E6EAF0',
                                    background: selectedChild === idx ? '#F8F9FF' : '#FFFFFF',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: selectedChild === idx ? '0 8px 20px rgba(79, 96, 255, 0.15)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: selectedChild === idx ? 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)' : '#F4F5F9',
                                    color: selectedChild === idx ? 'white' : '#5E6278',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                }}>
                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B' }}>{c.first_name} {c.last_name}</p>
                                    <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px' }}>{c.PRO_ID}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {child ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                {[
                                    { label: 'Attendance', value: `${child.attendance_percentage}%`, icon: Calendar, color: '#10B981', bg: '#D1FAE5', desc: 'Active presence' },
                                    { label: 'Last Test', value: child.last_test ? `${child.last_test.marks_obtained}/${child.last_test.total_marks}` : '-', icon: Award, color: '#4F60FF', bg: '#DBEAFE', desc: child.last_test?.test_name || 'No tests yet' },
                                    { label: 'Balance', value: `₹${(child.fee?.pending || 0).toLocaleString()}`, icon: CreditCard, color: child.fee?.pending > 0 ? '#EF4444' : '#10B981', bg: child.fee?.pending > 0 ? '#FEE2E2' : '#D1FAE5', desc: child.fee?.status || 'Active account' }
                                ].map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <div key={i} className="card hover-lift" style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden', background: '#FFFFFF' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '20px' }}>
                                                <Icon size={24} />
                                            </div>
                                            <div style={{ fontSize: '30px', fontWeight: 800, color: '#1A1D3B' }}>{s.value}</div>
                                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#5E6278', marginTop: '4px' }}>{s.label}</div>
                                            <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '4px' }}>{s.desc}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Performance Chart */}
                            <div className="card" style={{ padding: '24px', borderRadius: '24px', background: '#FFFFFF' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Academic Progress</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4F60FF' }}></span>
                                        <span style={{ fontSize: '12px', color: '#5E6278', fontWeight: 600 }}>Avg Score</span>
                                    </div>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData}>
                                            <defs>
                                                <linearGradient id="scoreColorParent" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4F60FF" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#4F60FF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6EAF0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="value" stroke="#4F60FF" fillOpacity={1} fill="url(#scoreColorParent)" strokeWidth={3} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Attendance tracker */}
                            <div className="card" style={{ padding: '24px', borderRadius: '24px', background: '#FFFFFF' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Attendance Tracker</h3>
                                    <Activity size={18} color="#10B981" />
                                </div>
                                <p style={{ fontSize: '13px', color: '#8F92A1', marginBottom: '20px' }}>Last 30 session activity</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                    {attendanceTrend.length > 0 ? attendanceTrend.map((a: any, i: number) => (
                                        <div key={i} title={a.date} style={{ 
                                            height: '32px', borderRadius: '6px', 
                                            background: a.status === 1 ? '#D1FAE5' : '#FFEBEE',
                                            border: `1px solid ${a.status === 1 ? '#10B981' : '#E53935'}`,
                                            opacity: 0.8
                                        }} />
                                    )) : (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <div key={i} style={{ height: '32px', borderRadius: '6px', background: '#F4F5F9' }} />)
                                    )}
                                </div>
                            </div>

                            {/* Fee card */}
                            {child.fee && (
                                <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, #1A1D3B 0%, #2A2F5B 100%)', color: 'white', border: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Fee Summary</h3>
                                        <Wallet size={20} color="#4F60FF" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ fontSize: '14px', opacity: 0.7 }}>Total Amount</span>
                                            <span style={{ fontSize: '18px', fontWeight: 700 }}>₹{child.fee.total?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <span style={{ fontSize: '14px', opacity: 0.7 }}>Total Paid</span>
                                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>₹{child.fee.paid?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '14px', opacity: 0.7 }}>Due Balance</span>
                                            <span style={{ fontSize: '24px', fontWeight: 800, color: child.fee.pending > 0 ? '#EF4444' : '#10B981' }}>₹{child.fee.pending?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {child.fee.pending > 0 && (
                                        <button className="btn" style={{ width: '100%', marginTop: '20px', background: 'white', color: '#1A1D3B', fontWeight: 700, borderRadius: '14px', padding: '12px' }}>
                                            Pay Securely
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card empty-state" style={{ padding: '80px', textAlign: 'center', borderRadius: '32px', background: '#FFFFFF' }}>
                        <div style={{ width: '100px', height: '100px', background: '#F4F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <GraduationCap size={48} color="#A1A5B7" />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B' }}>No Student Linked</h3>
                        <p style={{ color: '#8F92A1', maxWidth: '300px', margin: '12px auto 0' }}>Please contact the administration to link your children to this account.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

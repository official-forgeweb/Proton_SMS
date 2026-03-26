'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Calendar, ClipboardList, Award, BookOpen, TrendingUp,
    CheckCircle, AlertTriangle, Clock, PenTool, CreditCard, Activity, Star
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
                <div className="page-header"><div className="skeleton" style={{ width: '300px', height: '28px' }} /></div>
                <div className="page-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)}
                    </div>
                </div>
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

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '28px', fontWeight: 800,
                        boxShadow: '0 8px 16px rgba(79, 96, 255, 0.25)'
                    }}>
                        {student?.first_name?.[0]}{student?.last_name?.[0]}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Welcome back, {student?.first_name || 'Student'}! 👋
                        </h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '4px', fontWeight: 500 }}>
                            {student?.PRO_ID} • {data?.classes?.[0]?.class_name || 'No class enrolled'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    {[
                        { 
                            label: 'Attendance', 
                            value: `${(attendance?.percentage || 0).toFixed(0)}%`, 
                            icon: Calendar, 
                            color: (attendance?.percentage || 0) >= 80 ? '#10B981' : '#F59E0B', 
                            bg: (attendance?.percentage || 0) >= 80 ? '#D1FAE5' : '#FEF3C7',
                            tag: (attendance?.percentage || 0) >= 80 ? 'Good' : 'Needs attention'
                        },
                        { 
                            label: 'Last Test Score', 
                            value: data?.recent_tests?.[0] ? `${data.recent_tests[0].marks_obtained}/${data.recent_tests[0].total_marks}` : '-', 
                            icon: ClipboardList, 
                            color: '#3B82F6', 
                            bg: '#DBEAFE',
                            tag: data?.recent_tests?.[0] ? `Rank #${data.recent_tests[0].rank_in_class}` : 'New student'
                        },
                        { 
                            label: 'Pending Fees', 
                            value: `₹${((data?.fee?.pending || 0) / 1000).toFixed(1)}K`, 
                            icon: CreditCard, 
                            color: data?.fee?.status === 'paid' ? '#10B981' : '#F97316', 
                            bg: data?.fee?.status === 'paid' ? '#D1FAE5' : '#FFEDD5',
                            tag: data?.fee?.status || 'Pending'
                        },
                        { 
                            label: 'Homework', 
                            value: data?.pending_homework?.length || 0, 
                            icon: PenTool, 
                            color: '#EC4899', 
                            bg: '#FCE7F3',
                            tag: 'Active tasks'
                        },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="card hover-lift" style={{ padding: '24px', borderRadius: '20px', border: 'none', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                        <Icon size={24} />
                                    </div>
                                    <Activity size={16} color="#A1A5B7" />
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A1D3B' }}>{s.value}</div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#5E6278', marginTop: '4px' }}>{s.label}</div>
                                <div style={{ 
                                    marginTop: '12px', display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', 
                                    fontSize: '11px', fontWeight: 700, background: s.bg, color: s.color
                                }}>
                                    {s.tag}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>My Score Trend</h3>
                            <span style={{ fontSize: '12px', color: '#4F60FF', fontWeight: 600 }}>12 Months Data</span>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F60FF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F60FF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6EAF0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} domain={[0, 100]} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke="#4F60FF" fillOpacity={1} fill="url(#scoreColor)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                                [1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: '32px', borderRadius: '6px', background: '#F4F5F9' }} />)
                            )}
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#D1FAE5', border: '1px solid #10B981' }} />
                                <span style={{ fontSize: '12px', color: '#5E6278', fontWeight: 500 }}>Present</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFEBEE', border: '1px solid #E53935' }} />
                                <span style={{ fontSize: '12px', color: '#5E6278', fontWeight: 500 }}>Absent</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Recent Tests */}
                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Award size={20} color="#4F60FF" /> Recent Tests
                            </h3>
                            <button style={{ background: 'none', border: 'none', color: '#4F60FF', fontSize: '13px', fontWeight: 600 }}>History</button>
                        </div>
                        {data?.recent_tests?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {data.recent_tests.map((test: any) => (
                                    <div key={test.test_id} className="hover-lift" style={{
                                        padding: '16px', borderRadius: '16px',
                                        border: '1px solid #F0F0F5', background: '#FFFFFF'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B' }}>{test.test_name}</p>
                                                <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '4px' }}>{formatDate(test.test_date)}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '20px', fontWeight: 800, color: test.pass_fail === 'pass' ? '#10B981' : '#E53935' }}>
                                                    {test.marks_obtained}/{test.total_marks}
                                                </p>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#F4F5F9', color: '#5E6278', fontWeight: 700 }}>RANK #{test.rank_in_class}</span>
                                                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#F4F5F9', color: '#5E6278', fontWeight: 700 }}>GRADE {test.grade}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: '6px', background: '#F0F0F5', borderRadius: '10px', marginTop: '16px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${test.percentage}%`,
                                                background: test.percentage >= 80 ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' : test.percentage >= 60 ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)' : 'linear-gradient(90deg, #E53935 0%, #EF5350 100%)',
                                                borderRadius: '10px'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '16px' }}>
                                <Star size={32} color="#A1A5B7" style={{ marginBottom: '12px' }} />
                                <p style={{ color: '#8F92A1', fontSize: '14px' }}>No test results available yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Pending Homework */}
                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <PenTool size={20} color="#EC4899" /> Active Tasks
                            </h3>
                        </div>
                        {data?.pending_homework?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {data.pending_homework.map((hw: any) => (
                                    <div key={hw.id} className="hover-lift" style={{
                                        padding: '16px', borderRadius: '16px',
                                        border: '1px solid #F0F0F5',
                                        borderLeft: '4px solid #F59E0B', background: '#FFFFFF'
                                    }}>
                                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B' }}>{hw.homework?.title || 'Homework'}</p>
                                        <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '6px' }}>
                                            Subject: <span style={{ color: '#5E6278', fontWeight: 600 }}>{hw.homework?.subject}</span> • Due: <span style={{ color: '#E53935', fontWeight: 600 }}>{formatDate(hw.homework?.due_date)}</span>
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                            <div style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={12} /> Pending Submission
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '50px', background: '#F8F9FD', borderRadius: '20px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CheckCircle size={32} color="#10B981" />
                                </div>
                                <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B' }}>All Caught Up!</h4>
                                <p style={{ color: '#8F92A1', fontSize: '14px', marginTop: '8px' }}>You have completed all your pending homework.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Users, ClipboardList, UserCheck, Calendar, Clock,
    ChevronRight, Phone, Target, CheckCircle, AlertCircle, Zap, TrendingUp, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export default function TeacherDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/teacher')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div className="page-header"><div className="skeleton" style={{ width: '300px', height: '28px' }} /></div>
                <div className="page-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '16px' }} />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const performanceData = data?.charts?.performance || [];
    const attendanceData = data?.charts?.attendance || [];

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {data?.teacher_name?.split(' ')[0] || 'Teacher'}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>
                            {dayName}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary btn-sm" style={{ height: '40px', padding: '0 16px', borderRadius: '10px' }}>
                            <Calendar size={16} style={{ marginRight: '8px' }} /> Schedule
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { icon: BookOpen, label: 'My Classes', value: data?.stats?.total_classes || 0, color: '#4F60FF', bg: '#EEF0FF', desc: 'Active sessions' },
                        { icon: Users, label: 'Total Students', value: data?.stats?.total_students || 0, color: '#10B981', bg: '#D1FAE5', desc: 'Enrolled in classes' },
                        { icon: ClipboardList, label: 'Pending Evaluations', value: data?.stats?.pending_evaluations || 0, color: '#F59E0B', bg: '#FEF3C7', desc: 'Tests to grade' },
                        { icon: Zap, label: 'Conversion', value: data?.stats?.assigned_enquiries || 0, color: '#E53935', bg: '#FFEBEE', desc: 'Active enquiries' },
                    ].map((s) => (
                        <div key={s.label} className="card hover-lift" style={{ border: 'none', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: '24px', borderRadius: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                    <s.icon size={22} />
                                </div>
                                <Activity size={16} color="#A1A5B7" />
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', marginBottom: '4px' }}>{s.value}</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#5E6278' }}>{s.label}</div>
                            <div style={{ fontSize: '11px', color: '#A1A5B7', marginTop: '4px' }}>{s.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Performance Benchmark</h3>
                            <button style={{ background: 'none', border: 'none', color: '#4F60FF', fontSize: '12px', fontWeight: 600 }}>This Year</button>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A5B7' }} />
                                    <Tooltip cursor={{ fill: '#F4F5F9' }} />
                                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={24}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4F60FF" />
                                                <stop offset="100%" stopColor="#7B5EA7" />
                                            </linearGradient>
                                        </defs>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Attendance Trend</h3>
                            <TrendingUp size={16} color="#10B981" />
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={attendanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F5" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="percentage" stroke="#10B981" fill="#D1FAE5" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                Average: <span style={{ color: '#10B981', fontWeight: 700 }}>
                                    {attendanceData.length > 0 ? (attendanceData.reduce((a: number, b: any) => a + b.percentage, 0) / attendanceData.length).toFixed(1) : 0}%
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                    {/* Today's Schedule */}
                    <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} color="#4F60FF" /> Today&apos;s Schedule
                            </h3>
                            {data?.today?.classes?.length > 0 && (
                                <span className="badge badge-info">{data.today.classes.length} Sessions</span>
                            )}
                        </div>
                        {data?.today?.classes?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data.today.classes.map((cls: any) => (
                                    <div key={cls.id} className="hover-lift" style={{
                                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                                        borderRadius: '16px', border: '1px solid #F0F0F5',
                                        background: '#FFFFFF',
                                    }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
                                            fontWeight: 700, flexShrink: 0,
                                        }}>
                                            <span style={{ fontSize: '11px', opacity: 0.8 }}>TIME</span>
                                            <span style={{ fontSize: '14px' }}>{cls.class_time_start || '4PM'}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B' }}>{cls.class_name}</p>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Users size={12} /> {cls.student_count || 0} Students
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> Room {cls.room_number || 'B1'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {cls.attendance_marked ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700, fontSize: '12px' }}>
                                                    <CheckCircle size={16} /> Marked
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => router.push(`/teacher/attendance`)}
                                                    style={{ 
                                                        background: '#4F60FF', color: 'white', border: 'none', 
                                                        padding: '8px 16px', borderRadius: '10px', fontSize: '12px', 
                                                        fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 96, 255, 0.2)'
                                                    }}
                                                >
                                                    Mark
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '16px' }}>
                                <AlertCircle size={32} color="#A1A5B7" style={{ marginBottom: '12px' }} />
                                <p style={{ color: '#8F92A1', fontSize: '14px' }}>No classes scheduled for today.</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Task Progress */}
                        <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Enquiry Pipeline</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {data?.enquiries?.slice(0, 3).map((enq: any) => (
                                    <div key={enq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Users size={16} color="#4F60FF" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>{enq.student_name}</p>
                                                <p style={{ fontSize: '11px', color: '#A1A5B7' }}>{enq.interested_course}</p>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '10px', 
                                            fontWeight: 700, textTransform: 'uppercase',
                                            background: enq.status === 'new' ? '#EEF0FF' : '#FFF3E0',
                                            color: enq.status === 'new' ? '#4F60FF' : '#F97316'
                                        }}>
                                            {enq.status || 'New'}
                                        </span>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => router.push('/teacher/enquiries')}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #F0F0F5', background: 'none', color: '#5E6278', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
                                >
                                    View All Enquiries
                                </button>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div style={{ 
                            padding: '24px', borderRadius: '18px', 
                            background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', 
                            color: 'white', position: 'relative', overflow: 'hidden' 
                        }}>
                             <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                             <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={18} /> Pro Tip
                             </h4>
                             <p style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.9 }}>
                                Marking attendance within 15 minutes of class start results in better compliance scores!
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

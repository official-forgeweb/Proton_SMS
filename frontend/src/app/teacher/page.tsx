'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Users, ClipboardList, UserCheck, Calendar, Clock,
    ChevronRight, Phone, Target, CheckCircle, AlertCircle, Zap
} from 'lucide-react';

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

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {data?.teacher_name || 'Teacher'}! 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {dayName}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {[
                        { icon: BookOpen, label: 'My Classes', value: data?.stats?.total_classes || 0, color: '#3B82F6', bg: '#DBEAFE' },
                        { icon: Users, label: 'Total Students', value: data?.stats?.total_students || 0, color: '#10B981', bg: '#D1FAE5' },
                        { icon: ClipboardList, label: 'Pending Evaluations', value: data?.stats?.pending_evaluations || 0, color: '#F59E0B', bg: '#FEF3C7' },
                        { icon: Phone, label: 'Assigned Enquiries', value: data?.stats?.assigned_enquiries || 0, color: '#F97316', bg: '#FFEDD5' },
                        { icon: Target, label: 'Pending Demos', value: data?.stats?.pending_demos || 0, color: '#EC4899', bg: '#FCE7F3' },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="stat-card hover-lift">
                                <div className="stat-icon" style={{ background: s.bg }}><Icon size={20} color={s.color} /></div>
                                <div><div className="stat-value" style={{ fontSize: '24px' }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
                            </div>
                        );
                    })}
                </div>

                {/* Today's Classes */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="var(--primary)" /> Today&apos;s Schedule
                    </h3>
                    {data?.today?.classes?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.today.classes.map((cls: any) => (
                                <div key={cls.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-secondary)',
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                        fontWeight: 700, fontSize: '14px', flexShrink: 0,
                                    }}>
                                        {cls.class_time_start || '4PM'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: '14px' }}>{cls.class_name}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                            Room {cls.room_number} • {cls.student_count || 0} students
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {cls.attendance_marked ? (
                                            <span className="badge badge-success"><CheckCircle size={12} /> Marked</span>
                                        ) : (
                                            <button className="btn btn-primary btn-sm" onClick={() => router.push('/teacher/attendance')}>
                                                <UserCheck size={14} /> Mark Attendance
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                            No classes scheduled for today
                        </p>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Recent Enquiries */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={18} color="var(--accent-orange)" /> My Enquiries
                        </h3>
                        {data?.enquiries?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.enquiries.map((enq: any) => (
                                    <div key={enq.id} style={{
                                        padding: '12px', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-primary)', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '13px' }}>{enq.student_name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{enq.interested_course} • {enq.phone}</p>
                                        </div>
                                        <span className="badge badge-info" style={{ fontSize: '10px' }}>{enq.status?.replace('_', ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No enquiries assigned</p>
                        )}
                    </div>

                    {/* Upcoming Demos */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={18} color="var(--secondary)" /> Upcoming Demos
                        </h3>
                        {data?.upcoming_demos?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.upcoming_demos.map((demo: any) => (
                                    <div key={demo.id} style={{
                                        padding: '12px', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-primary)', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '13px' }}>{demo.student_name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                Demo #{demo.demo_count} • {demo.demo_date} at {demo.demo_time}
                                            </p>
                                        </div>
                                        <span className="badge badge-warning" style={{ fontSize: '10px' }}>{demo.status}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No upcoming demos</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

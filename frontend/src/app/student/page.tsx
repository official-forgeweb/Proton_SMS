'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Calendar, ClipboardList, Award, BookOpen, TrendingUp,
    CheckCircle, AlertTriangle, Clock, PenTool, CreditCard
} from 'lucide-react';

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

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="avatar avatar-lg" style={{ background: 'var(--gradient-primary)' }}>
                        {student?.first_name?.[0]}{student?.last_name?.[0]}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                            Welcome back, {student?.first_name || 'Student'}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                            {student?.PRO_ID} • {data?.classes?.[0]?.class_name || 'No class'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {/* Attendance */}
                    <div className="card hover-lift" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px',
                            background: (attendance?.percentage || 0) >= 80 ? '#D1FAE5' : '#FEF3C7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Calendar size={24} color={(attendance?.percentage || 0) >= 80 ? '#10B981' : '#F59E0B'} />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {(attendance?.percentage || 0).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Attendance</div>
                        <span className={`badge ${(attendance?.percentage || 0) >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '8px' }}>
                            {(attendance?.percentage || 0) >= 80 ? '✅ Good' : '⚠️ Low'}
                        </span>
                    </div>

                    {/* Last Test */}
                    <div className="card hover-lift" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px',
                            background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ClipboardList size={24} color="#3B82F6" />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {data?.recent_tests?.[0]?.marks_obtained || '-'}/{data?.recent_tests?.[0]?.total_marks || '-'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Last Test</div>
                        {data?.recent_tests?.[0] && (
                            <span className="badge badge-info" style={{ marginTop: '8px' }}>
                                Rank #{data.recent_tests[0].rank_in_class}
                            </span>
                        )}
                    </div>

                    {/* Fee Status */}
                    <div className="card hover-lift" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px',
                            background: data?.fee?.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CreditCard size={24} color={data?.fee?.status === 'paid' ? '#10B981' : '#F59E0B'} />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            ₹{((data?.fee?.pending || 0) / 1000).toFixed(0)}K
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Fee Pending</div>
                        <span className={`badge ${data?.fee?.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '8px' }}>
                            {data?.fee?.status || 'pending'}
                        </span>
                    </div>

                    {/* Homework */}
                    <div className="card hover-lift" style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 12px',
                            background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PenTool size={24} color="#EC4899" />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {data?.pending_homework?.length || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pending HW</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Recent Tests */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} color="var(--primary)" /> Recent Tests
                        </h3>
                        {data?.recent_tests?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {data.recent_tests.map((test: any) => (
                                    <div key={test.test_id} style={{
                                        padding: '14px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '14px' }}>{test.test_name}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{test.test_date}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '18px', fontWeight: 800, color: test.pass_fail === 'pass' ? 'var(--success)' : 'var(--error)' }}>
                                                    {test.marks_obtained}/{test.total_marks}
                                                </p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Grade: {test.grade} • Rank #{test.rank_in_class}</p>
                                            </div>
                                        </div>
                                        <div className="progress-bar" style={{ marginTop: '8px' }}>
                                            <div className="progress-fill" style={{
                                                width: `${test.percentage}%`,
                                                background: test.percentage >= 80 ? 'var(--gradient-success)' : test.percentage >= 60 ? 'var(--gradient-warning)' : 'var(--gradient-error)',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>No test results yet</p>
                        )}
                    </div>

                    {/* Pending Homework */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PenTool size={18} color="#EC4899" /> Pending Homework
                        </h3>
                        {data?.pending_homework?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {data.pending_homework.map((hw: any) => (
                                    <div key={hw.id} style={{
                                        padding: '14px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)',
                                        borderLeft: '3px solid var(--warning)',
                                    }}>
                                        <p style={{ fontWeight: 600, fontSize: '14px' }}>{hw.homework?.title || 'Homework'}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                            Subject: {hw.homework?.subject} • Due: {hw.homework?.due_date}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                            <Clock size={12} color="var(--warning)" />
                                            <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 600 }}>Pending</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>
                                <CheckCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                <p style={{ fontSize: '13px' }}>All homework completed! 🎉</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

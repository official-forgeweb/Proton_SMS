'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    GraduationCap, Calendar, ClipboardList, CreditCard,
    ChevronDown, ChevronUp, Eye, Award, Bell
} from 'lucide-react';

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
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const parent = data?.parent;
    const children = data?.children || [];
    const child = children[selectedChild];

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                        Welcome, {parent?.first_name || 'Parent'}! 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Monitor your children&apos;s academic progress
                    </p>
                </div>
            </div>

            <div className="page-body">
                {/* Children Selector */}
                {children.length > 1 && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        {children.map((c: any, idx: number) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChild(idx)}
                                style={{
                                    padding: '12px 20px', borderRadius: 'var(--radius-lg)',
                                    border: selectedChild === idx ? '2px solid var(--primary)' : '1px solid var(--border-primary)',
                                    background: selectedChild === idx ? 'var(--primary-50)' : 'var(--bg-primary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div className="avatar" style={{
                                    background: selectedChild === idx ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                                    color: selectedChild === idx ? 'white' : 'var(--text-secondary)',
                                    width: '36px', height: '36px', fontSize: '14px',
                                }}>
                                    {c.first_name?.[0]}{c.last_name?.[0]}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{c.first_name} {c.last_name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{c.PRO_ID}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {child ? (
                    <>
                        {/* Child Profile Card */}
                        <div className="card" style={{
                            background: 'var(--gradient-primary)', color: 'white', marginBottom: '24px',
                            display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px',
                                borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                            }} />
                            <div className="avatar avatar-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                {child.first_name?.[0]}{child.last_name?.[0]}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{child.first_name} {child.last_name}</h2>
                                <p style={{ opacity: 0.8, fontSize: '14px', marginTop: '4px' }}>
                                    {child.PRO_ID} • {child.class_name || 'No class'}
                                </p>
                                <p style={{ opacity: 0.6, fontSize: '13px', marginTop: '2px' }}>
                                    {child.relationship === 'father' ? 'Son' : child.relationship === 'mother' ? 'Son/Daughter' : 'Ward'}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div className="card hover-lift" style={{ textAlign: 'center' }}>
                                <Calendar size={28} color={child.attendance_percentage >= 80 ? '#10B981' : '#F59E0B'} style={{ margin: '0 auto 10px' }} />
                                <div style={{ fontSize: '32px', fontWeight: 800 }}>{child.attendance_percentage}%</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Attendance</div>
                                <span className={`badge ${child.attendance_percentage >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '8px' }}>
                                    {child.attendance_percentage >= 80 ? 'Good' : 'Needs Improvement'}
                                </span>
                            </div>

                            <div className="card hover-lift" style={{ textAlign: 'center' }}>
                                <Award size={28} color="#3B82F6" style={{ margin: '0 auto 10px' }} />
                                <div style={{ fontSize: '32px', fontWeight: 800 }}>
                                    {child.last_test ? `${child.last_test.marks_obtained}/${child.last_test.total_marks}` : '-'}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Last Test Score</div>
                                {child.last_test && (
                                    <span className="badge badge-info" style={{ marginTop: '8px' }}>
                                        {child.last_test.test_name} • Rank #{child.last_test.rank_in_class}
                                    </span>
                                )}
                            </div>

                            <div className="card hover-lift" style={{ textAlign: 'center' }}>
                                <CreditCard size={28} color={child.fee?.status === 'paid' ? '#10B981' : '#EF4444'} style={{ margin: '0 auto 10px' }} />
                                <div style={{ fontSize: '32px', fontWeight: 800 }}>
                                    ₹{((child.fee?.pending || 0) / 1000).toFixed(0)}K
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Fee Balance</div>
                                <span className={`badge ${child.fee?.status === 'paid' ? 'badge-success' : 'badge-error'}`} style={{ marginTop: '8px' }}>
                                    {child.fee?.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        {/* Fee Overview */}
                        {child.fee && (
                            <div className="card">
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={18} color="var(--primary)" /> Fee Overview
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '14px' }}>
                                    <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#DBEAFE', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 600, marginBottom: '4px' }}>Total Fee</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#1E40AF' }}>₹{child.fee.total?.toLocaleString()}</p>
                                    </div>
                                    <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#D1FAE5', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: '#065F46', fontWeight: 600, marginBottom: '4px' }}>Paid</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: '#065F46' }}>₹{child.fee.paid?.toLocaleString()}</p>
                                    </div>
                                    <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: child.fee.pending > 0 ? '#FEE2E2' : '#D1FAE5', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: child.fee.pending > 0 ? '#991B1B' : '#065F46', fontWeight: 600, marginBottom: '4px' }}>Pending</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: child.fee.pending > 0 ? '#991B1B' : '#065F46' }}>₹{child.fee.pending?.toLocaleString()}</p>
                                    </div>
                                </div>
                                {child.fee.pending > 0 && (
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                                        💳 Pay Now - ₹{child.fee.pending?.toLocaleString()}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card empty-state">
                        <GraduationCap size={48} />
                        <h3>No Children Linked</h3>
                        <p>Contact the institution to link your children to your account.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

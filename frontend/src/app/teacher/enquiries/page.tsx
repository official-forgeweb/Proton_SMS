'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    Search, Plus, Phone, Clock, Calendar, ChevronRight, X,
    MessageSquare, User, Target, CheckCircle, AlertTriangle,
    Filter, Eye, ArrowRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EnquiriesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        fetchEnquiries();
        fetchStats();
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, [search, statusFilter]);

    const fetchEnquiries = async () => {
        try {
            const params: any = {};
            if (user?.id) params.assigned_to = user.id;
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/enquiries', { params });
            setEnquiries(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/enquiries/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };



    const updateStatus = async (id: string, status: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/enquiries/${id}`, { status });
            fetchEnquiries();
            fetchStats();
        } catch (error) {
            console.error(error);
        }
    };

    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        new: { color: '#3B82F6', bg: '#DBEAFE', label: 'New' },
        contacted: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Contacted' },
        demo_scheduled: { color: '#F59E0B', bg: '#FEF3C7', label: 'Demo Scheduled' },
        demo_completed: { color: '#F97316', bg: '#FFEDD5', label: 'Demo Completed' },
        enrolled: { color: '#10B981', bg: '#D1FAE5', label: 'Enrolled' },
        not_interested: { color: '#6B7280', bg: '#F3F4F6', label: 'Not Interested' },
        lost: { color: '#EF4444', bg: '#FEE2E2', label: 'Lost' },
    };

    const priorityConfig: Record<string, { color: string }> = {
        urgent: { color: '#EF4444' },
        high: { color: '#F97316' },
        medium: { color: '#F59E0B' },
        low: { color: '#10B981' },
    };

    return (
        <PermissionGuard permissionKey="enquiries">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Enquiry Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        {stats?.total || 0} total enquiries • {stats?.conversion_rate || 0}% conversion
                    </p>
                </div>

            </div>

            <div className="page-body">
                {/* Stats */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                            style={{
                                padding: '10px 18px', borderRadius: 'var(--radius-full)',
                                background: statusFilter === key ? config.color : config.bg,
                                color: statusFilter === key ? 'white' : config.color,
                                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                                whiteSpace: 'nowrap', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            {config.label}
                            <span style={{
                                background: statusFilter === key ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                            }}>
                                {stats?.by_status?.[key] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                    <Search size={16} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                    }} />
                    <input
                        className="input-field"
                        placeholder="Search enquiries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '38px' }}
                    />
                </div>

                {/* Enquiry Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  enquiries.length === 0 ? (
                        <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                            <Phone size={48} />
                            <h3>No Enquiries Found</h3>
                            <p>Start by creating a new enquiry or adjust your filters.</p>
                        </div>
                    ) : (
                        enquiries.map((enq, idx) => {
                            const sc = statusConfig[enq.status] || statusConfig.new;
                            const pc = priorityConfig[enq.priority] || priorityConfig.medium;
                            return (
                                <div
                                    key={enq.id}
                                    className="card hover-lift animate-fade-in"
                                    style={{ cursor: 'pointer', animationDelay: `${idx * 50}ms`, padding: '20px' }}
                                    onClick={() => router.push(`/teacher/enquiries/${enq.id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{
                                                fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)',
                                                fontWeight: 600,
                                            }}>
                                                {enq.enquiry_number}
                                            </span>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{enq.student_name}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%', background: pc.color,
                                            }} />
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                                background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 600,
                                            }}>
                                                {sc.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={13} /> {enq.phone}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Target size={13} /> {enq.interested_course}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={13} /> {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'contacted', e)}>
                                            Interested
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'new', e)}>
                                            Pending
                                        </button>
                                        <button className="btn btn-error btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'not_interested', e)}>
                                            Not Interested
                                        </button>
                                    </div>

                                    {enq.assigned_teacher_name && (
                                        <div style={{
                                            marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                Assigned: <strong style={{ color: 'var(--text-secondary)' }}>{enq.assigned_teacher_name}</strong>
                                            </span>
                                            <ChevronRight size={14} color="var(--text-tertiary)" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </DashboardLayout>
        </PermissionGuard>
    );
}

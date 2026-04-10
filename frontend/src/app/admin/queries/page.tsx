'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    MessageSquare, Clock, CheckCircle, AlertCircle, XCircle,
    Filter, User, Hash, ArrowRight, Phone, BookOpen,
    X, Trash2, BarChart3,
    Smartphone, PhoneCall, MessageCircle, FileText, Users, GraduationCap, Mail, HelpCircle
} from 'lucide-react';

const QUERY_TYPES = [
    { value: 'phone_change_student', label: 'Phone Change (Student)', icon: Smartphone },
    { value: 'phone_change_parent', label: 'Phone Change (Parent)', icon: PhoneCall },
    { value: 'whatsapp_student', label: 'WhatsApp (Student)', icon: MessageCircle },
    { value: 'whatsapp_parent', label: 'WhatsApp (Parent)', icon: MessageCircle },
    { value: 'old_assignment', label: 'Old Assignment', icon: FileText },
    { value: 'parent_meeting', label: 'Parent Meeting', icon: Users },
    { value: 'personal_session', label: 'Personal Session', icon: GraduationCap },
    { value: 'leave_application', label: 'Leave Application', icon: Mail },
    { value: 'other', label: 'Other', icon: HelpCircle },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    new: { label: 'New', color: '#3B82F6', bg: '#EFF6FF', icon: AlertCircle },
    processing: { label: 'Processing', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    resolved: { label: 'Resolved', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
    unresolved: { label: 'Unresolved', color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

export default function AdminQueriesPage() {
    const [queries, setQueries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState<any>(null);
    const [filters, setFilters] = useState({ status: '', query_type: '', raised_by: '' });
    const [statusUpdate, setStatusUpdate] = useState({ status: '', resolution_note: '' });

    const fetchQueries = useCallback(async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (filters.status) params.status = filters.status;
            if (filters.query_type) params.query_type = filters.query_type;
            if (filters.raised_by) params.raised_by = filters.raised_by;
            const [queryRes, statsRes] = await Promise.all([
                api.get('/queries', { params }),
                api.get('/queries/stats')
            ]);
            setQueries(queryRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchQueries(); }, [fetchQueries]);

    const handleUpdateStatus = async () => {
        if (!selectedQuery || !statusUpdate.status) return;
        try {
            await api.put(`/queries/${selectedQuery.id}`, statusUpdate);
            setShowDetailModal(false);
            setSelectedQuery(null);
            setStatusUpdate({ status: '', resolution_note: '' });
            fetchQueries();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this query permanently?')) return;
        try {
            await api.delete(`/queries/${id}`);
            setShowDetailModal(false);
            setSelectedQuery(null);
            fetchQueries();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    const openDetail = (query: any) => {
        setSelectedQuery(query);
        setStatusUpdate({ status: query.status, resolution_note: query.resolution_note || '' });
        setShowDetailModal(true);
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Query Reports</h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Monitor all student queries raised by teachers and students.</p>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
                        {[
                            { label: 'Total', value: stats.total, color: '#4F60FF', bg: '#EEF0FF', icon: BarChart3 },
                            { label: 'New', value: stats.new, color: '#3B82F6', bg: '#EFF6FF', icon: AlertCircle },
                            { label: 'Processing', value: stats.processing, color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
                            { label: 'Resolved', value: stats.resolved, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
                            { label: 'Unresolved', value: stats.unresolved, color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
                        ].map(s => (
                            <div key={s.label} className="card" style={{ padding: '20px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                    <s.icon size={20} color={s.color} />
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>{s.value}</div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Type Breakdown */}
                {stats?.by_type && stats.by_type.length > 0 && (
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '18px', marginBottom: '32px', border: '1px solid #E2E8F0' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', marginBottom: '16px' }}>Query Type Breakdown</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {stats.by_type.map((t: any) => {
                                const typeInfo = QUERY_TYPES.find(q => q.value === t.type);
                                const TypeIcon = typeInfo?.icon || HelpCircle;
                                return (
                                    <div key={t.type} style={{
                                        padding: '8px 14px', borderRadius: '10px', background: '#F8F9FD',
                                        border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={16} color="#4F60FF" /></span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>{typeInfo?.label || t.type}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{t.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '18px 24px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Filter size={18} color="#8F92A1" />
                    <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }}>
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="processing">Processing</option>
                        <option value="resolved">Resolved</option>
                        <option value="unresolved">Unresolved</option>
                    </select>
                    <select value={filters.query_type} onChange={e => setFilters({ ...filters, query_type: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }}>
                        <option value="">All Types</option>
                        {QUERY_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                    </select>
                    <select value={filters.raised_by} onChange={e => setFilters({ ...filters, raised_by: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }}>
                        <option value="">All Sources</option>
                        <option value="teacher">By Teacher</option>
                        <option value="student">By Student</option>
                    </select>
                </div>

                {/* Query List */}
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '85px', borderRadius: '16px' }} />)}
                    </div>
                ) : queries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <MessageSquare size={48} color="#A1A5B7" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No queries found</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>No queries match the current filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {queries.map(query => {
                            const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.new;
                            const StatusIcon = statusCfg.icon;
                            const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                            const TypeIcon = typeInfo?.icon || HelpCircle;

                            return (
                                <div key={query.id} onClick={() => openDetail(query)} className="card hover-lift" style={{
                                    padding: '18px 24px', borderRadius: '14px', background: '#FFFFFF',
                                    border: '1px solid #E2E8F0', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    borderLeft: `4px solid ${statusCfg.color}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={24} color="#4F60FF" /></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>
                                                    {typeInfo?.label || query.query_type}
                                                </h3>
                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <StatusIcon size={10} /> {statusCfg.label}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px', padding: '2px 7px', borderRadius: '5px', fontWeight: 700,
                                                    background: query.raised_by === 'student' ? '#F3E8FF' : '#FEF3C7',
                                                    color: query.raised_by === 'student' ? '#9333EA' : '#D97706'
                                                }}>
                                                    {query.raised_by === 'student' ? 'Student' : 'Teacher'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '12px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} color="#A1A5B7" /> {query.student?.first_name} {query.student?.last_name}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#A1A5B7' }}>{query.student?.PRO_ID}</span>
                                                <span style={{ fontSize: '12px', color: '#A1A5B7' }}>{query.query_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '12px', color: '#A1A5B7' }}>
                                            {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <ArrowRight size={16} color="#A1A5B7" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedQuery && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '560px', borderRadius: '24px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => { setShowDetailModal(false); setSelectedQuery(null); }}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                {(() => {
                                    const TypeIcon = QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.icon || HelpCircle;
                                    return <div style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={32} color="#1A1D3B" /></div>;
                                })()}
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                    {QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.label || selectedQuery.query_type}
                                </h2>
                                <span style={{ fontSize: '12px', color: '#A1A5B7' }}>{selectedQuery.query_number}</span>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div style={{ padding: '16px', borderRadius: '14px', background: '#F8F9FD', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                            <div style={{ fontWeight: 700, color: '#1A1D3B', fontSize: '15px', marginBottom: '8px' }}>
                                {selectedQuery.student?.first_name} {selectedQuery.student?.last_name}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5E6278', flexWrap: 'wrap' }}>
                                <span><Hash size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selectedQuery.student?.PRO_ID}</span>
                                <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selectedQuery.student?.phone || 'N/A'}</span>
                                <span><BookOpen size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selectedQuery.student?.class_enrollments?.[0]?.class?.class_name || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                            {selectedQuery.query_subtype && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Details</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{selectedQuery.query_subtype}</span>
                                </div>
                            )}
                            {selectedQuery.target_teacher && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Teacher</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{selectedQuery.target_teacher.first_name} {selectedQuery.target_teacher.last_name}</span>
                                </div>
                            )}
                            {selectedQuery.description && (
                                <div style={{ padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Description</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B' }}>{selectedQuery.description}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Raised By</span>
                                <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600, textTransform: 'capitalize' }}>{selectedQuery.raised_by}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Created</span>
                                <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>
                                    {new Date(selectedQuery.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Status Update */}
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '12px' }}>Update Status</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={key} onClick={() => setStatusUpdate({ ...statusUpdate, status: key })}
                                            style={{
                                                padding: '10px 6px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer',
                                                border: statusUpdate.status === key ? `2px solid ${cfg.color}` : '1.5px solid #E2E8F0',
                                                background: statusUpdate.status === key ? cfg.bg : '#FFF',
                                            }}>
                                            <Icon size={18} color={cfg.color} style={{ margin: '0 auto 4px' }} />
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: statusUpdate.status === key ? cfg.color : '#8F92A1' }}>{cfg.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <textarea placeholder="Resolution note (optional)"
                                value={statusUpdate.resolution_note}
                                onChange={e => setStatusUpdate({ ...statusUpdate, resolution_note: e.target.value })}
                                rows={2}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '14px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleUpdateStatus} className="btn-primary" style={{ flex: 1, padding: '14px' }}>
                                    Update Query
                                </button>
                                <button onClick={() => handleDelete(selectedQuery.id)}
                                    style={{ padding: '14px 18px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 700, fontSize: '13px' }}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

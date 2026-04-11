'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    MessageSquare, Plus, Search, X, ChevronDown, Clock, CheckCircle,
    AlertCircle, Filter, User, Phone, BookOpen, Hash, XCircle,
    ArrowRight, FileText, Users, Smartphone, PhoneCall, MessageCircle, GraduationCap, Mail, HelpCircle
} from 'lucide-react';

const QUERY_TYPES = [
    { value: 'phone_change_student', label: 'Phone Number Change (Student)', icon: Smartphone, needsSubtype: false },
    { value: 'phone_change_parent', label: 'Phone Number Change (Parent)', icon: PhoneCall, needsSubtype: false },
    { value: 'whatsapp_student', label: 'Not Added on WhatsApp Group (Student)', icon: MessageCircle, needsSubtype: false },
    { value: 'whatsapp_parent', label: 'Not Added on WhatsApp Group (Parent)', icon: MessageCircle, needsSubtype: false },
    { value: 'old_assignment', label: 'Want Old Assignment', icon: FileText, needsSubtype: true, subtypeLabel: 'Which Assignment?' },
    { value: 'parent_meeting', label: 'Parent Wants to Meet Teacher', icon: Users, needsSubtype: true, subtypeLabel: 'Which Teacher?', needsTeacher: true },
    { value: 'personal_session', label: 'Student Wants Personal Session', icon: GraduationCap, needsSubtype: true, subtypeLabel: 'Which Teacher?', needsTeacher: true },
    { value: 'leave_application', label: 'Application for Leave', icon: Mail, needsSubtype: false },
    { value: 'other', label: 'Other', icon: HelpCircle, needsSubtype: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    new: { label: 'New', color: '#3B82F6', bg: '#EFF6FF', icon: AlertCircle },
    processing: { label: 'Processing', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    resolved: { label: 'Resolved', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
    unresolved: { label: 'Unresolved', color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

export default function TeacherQueriesPage() {
    const [queries, setQueries] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState<any>(null);
    const [filters, setFilters] = useState({ status: '', query_type: '', raised_by: '' });

    // Status update
    const [statusUpdate, setStatusUpdate] = useState({ status: '', resolution_note: '' });

    const fetchQueries = useCallback(async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (filters.status) params.status = filters.status;
            if (filters.query_type) params.query_type = filters.query_type;
            if (filters.raised_by) params.raised_by = filters.raised_by;
            const res = await api.get('/queries', { params });
            setQueries(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchQueries();
        fetchTeachers();
    }, [fetchQueries]);

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

    const openDetail = (query: any) => {
        setSelectedQuery(query);
        setStatusUpdate({ status: query.status, resolution_note: query.resolution_note || '' });
        setShowDetailModal(true);
    };

    const stats = {
        total: queries.length,
        new: queries.filter(q => q.status === 'new').length,
        processing: queries.filter(q => q.status === 'processing').length,
        resolved: queries.filter(q => q.status === 'resolved').length,
    };

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Student Queries</h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Manage and resolve student support requests.</p>
                    </div>
                    <Link
                        href="/teacher/queries/add"
                        className="btn-primary hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <Plus size={20} strokeWidth={2.5} /> New Query
                    </Link>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Queries', value: stats.total, color: '#4F60FF', bg: '#EEF0FF', icon: MessageSquare },
                        { label: 'New', value: stats.new, color: '#3B82F6', bg: '#EFF6FF', icon: AlertCircle },
                        { label: 'Processing', value: stats.processing, color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
                        { label: 'Resolved', value: stats.resolved, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
                    ].map(s => (
                        <div key={s.label} className="card hover-lift" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <s.icon size={20} color={s.color} />
                                </div>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B' }}>{s.value}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278', marginTop: '4px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '16px' }} />)}
                    </div>
                ) : queries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <MessageSquare size={48} color="#A1A5B7" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No queries found</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>Create a new query to get started.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {queries.map(query => {
                            const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.new;
                            const StatusIcon = statusCfg.icon;
                            const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                            const TypeIcon = typeInfo?.icon || HelpCircle;

                            return (
                                <div key={query.id} onClick={() => openDetail(query)} className="card hover-lift" style={{
                                    padding: '20px 24px', borderRadius: '16px', background: '#FFFFFF',
                                    border: '1px solid #E2E8F0', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    borderLeft: `4px solid ${statusCfg.color}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={28} color="#4F60FF" /></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>
                                                    {typeInfo?.label || query.query_type}
                                                </h3>
                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <StatusIcon size={12} /> {statusCfg.label}
                                                </span>
                                                {query.raised_by === 'student' && (
                                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: '#F3E8FF', color: '#9333EA', fontWeight: 700 }}>
                                                        Student Raised
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <User size={13} color="#A1A5B7" /> {query.student?.first_name} {query.student?.last_name}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Hash size={13} color="#A1A5B7" /> {query.student?.PRO_ID}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#A1A5B7' }}>
                                                    {query.query_number}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', color: '#A1A5B7' }}>
                                            {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <ArrowRight size={16} color="#A1A5B7" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ──── Query Detail / Status Update Modal ──── */}
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

                        {/* Query Details */}
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                            {selectedQuery.query_subtype && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Details</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{selectedQuery.query_subtype}</span>
                                </div>
                            )}
                            {selectedQuery.target_teacher && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FAFAFA', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Target Teacher</span>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={key} onClick={() => setStatusUpdate({ ...statusUpdate, status: key })}
                                            style={{
                                                padding: '10px 8px', textAlign: 'center', borderRadius: '10px', cursor: 'pointer',
                                                border: statusUpdate.status === key ? `2px solid ${cfg.color}` : '1.5px solid #E2E8F0',
                                                background: statusUpdate.status === key ? cfg.bg : '#FFF',
                                            }}>
                                            <Icon size={18} color={cfg.color} style={{ margin: '0 auto 4px' }} />
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: statusUpdate.status === key ? cfg.color : '#8F92A1' }}>{cfg.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <textarea
                                placeholder="Resolution note (optional)"
                                value={statusUpdate.resolution_note}
                                onChange={e => setStatusUpdate({ ...statusUpdate, resolution_note: e.target.value })}
                                rows={2}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '16px' }}
                            />
                            <button onClick={handleUpdateStatus} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                                Update Query
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}


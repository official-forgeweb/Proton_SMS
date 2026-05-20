'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    MessageSquare, Plus, Search, X, ChevronDown, Clock, CheckCircle,
    AlertCircle, Filter, User, Phone, BookOpen, Hash, XCircle,
    ArrowRight, FileText, Users, Smartphone, PhoneCall, MessageCircle, GraduationCap, Mail, HelpCircle, Calendar
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
    new: { label: 'New', color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)', icon: AlertCircle },
    processing: { label: 'Processing', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)', icon: Clock },
    resolved: { label: 'Resolved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.06)', icon: CheckCircle },
    unresolved: { label: 'Unresolved', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.06)', icon: XCircle },
};

export default function TeacherQueriesPage() {
    const [queries, setQueries] = useState<any[]>([]);
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

    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
            border-radius: 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 36px rgba(229, 57, 53, 0.05);
            border-color: rgba(229, 57, 53, 0.15);
        }
        .bg-mesh {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(229,57,53,0.03) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(229,57,53,0.02) 0px, transparent 50%);
        }
        .gradient-btn {
            background: linear-gradient(135deg, #E53935 0%, #B71C1C 100%);
            box-shadow: 0 4px 14px rgba(229,57,53,0.25);
            transition: all 0.25s ease;
        }
        .gradient-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(229,57,53,0.35);
            opacity: 0.95;
        }
        .custom-select {
            padding: 10px 16px;
            border-radius: 12px;
            border: 1.5px solid rgba(226, 232, 240, 0.9);
            background: white;
            outline: none;
            font-size: 13px;
            font-weight: 600;
            color: #1A1D3B;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .custom-select:focus {
            border-color: #E53935;
            box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.08);
        }
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(13, 15, 33, 0.4);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            padding: 20px;
        }
        .ticket-item {
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ticket-item:hover {
            transform: scale(1.008);
        }
    `;

    return (
        <DashboardLayout requiredRole="teacher">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '120px' }}>
                
                {/* Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                <MessageSquare size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Student Queries & Tickets
                            </h1>
                        </div>
                        <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                            Review, monitor, and resolve support requests logged by students and administrators.
                        </p>
                    </div>
                    
                    <Link href="/teacher/queries/add" style={{ textDecoration: 'none' }}>
                        <button 
                            className="gradient-btn"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '14px', 
                                padding: '12px 24px', 
                                fontSize: '15px', 
                                fontWeight: 700, 
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> New Ticket
                        </button>
                    </Link>
                </div>

                {/* Quick Stats Grid */}
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Queries', value: stats.total, color: '#E53935', bg: 'rgba(229, 57, 53, 0.08)', icon: MessageSquare },
                        { label: 'New Tickets', value: stats.new, color: '#EF5350', bg: 'rgba(239, 83, 80, 0.08)', icon: AlertCircle },
                        { label: 'In Progress', value: stats.processing, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', icon: Clock },
                        { label: 'Resolved Tickets', value: stats.resolved, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', icon: CheckCircle },
                    ].map((s, idx) => (
                        <div key={idx} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                    <s.icon size={20} strokeWidth={2.2} />
                                </div>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>{s.value}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#8F92A1', marginTop: '4px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter Panel */}
                <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8F92A1', fontSize: '14px', fontWeight: 700 }}>
                        <Filter size={18} /> Filters
                    </div>
                    
                    <select 
                        value={filters.status} 
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className="custom-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="processing">Processing</option>
                        <option value="resolved">Resolved</option>
                        <option value="unresolved">Unresolved</option>
                    </select>

                    <select 
                        value={filters.query_type} 
                        onChange={e => setFilters({ ...filters, query_type: e.target.value })}
                        className="custom-select"
                        style={{ maxWidth: '280px' }}
                    >
                        <option value="">All Query Categories</option>
                        {QUERY_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                    </select>

                    <select 
                        value={filters.raised_by} 
                        onChange={e => setFilters({ ...filters, raised_by: e.target.value })}
                        className="custom-select"
                    >
                        <option value="">All Sources</option>
                        <option value="teacher">Created By Teacher</option>
                        <option value="student">Submitted By Student</option>
                    </select>
                </div>

                {/* Queries Tickets List */}
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card" style={{ height: '94px', opacity: 0.6 }} />
                        ))}
                    </div>
                ) : queries.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px', border: '2px dashed rgba(229, 57, 53, 0.15)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(229, 57, 53, 0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#E53935' }}>
                            <MessageSquare size={36} />
                        </div>
                        <h3 style={{ fontSize: '20px', color: '#1A1D3B', fontWeight: 800, marginBottom: '8px' }}>No Queries Found</h3>
                        <p style={{ color: '#8F92A1', fontSize: '15px', fontWeight: 500, maxWidth: '400px', margin: '0 auto' }}>
                            No support queries match your current filter settings. Try modifying filters or create a new ticket.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {queries.map((query, idx) => {
                            const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.new;
                            const StatusIcon = statusCfg.icon;
                            const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                            const TypeIcon = typeInfo?.icon || HelpCircle;

                            return (
                                <div 
                                    key={query.id} 
                                    onClick={() => openDetail(query)} 
                                    className="glass-card ticket-item" 
                                    style={{
                                        padding: '20px 24px',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        borderLeft: `5px solid ${statusCfg.color}`,
                                        gap: '20px',
                                        flexWrap: 'wrap'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(26, 29, 59, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1D3B', flexShrink: 0 }}>
                                            <TypeIcon size={22} strokeWidth={2} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                                    {typeInfo?.label || query.query_type}
                                                </h3>
                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <StatusIcon size={11} /> {statusCfg.label}
                                                </span>
                                                {query.raised_by === 'student' && (
                                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(147, 51, 234, 0.08)', color: '#9333EA', fontWeight: 800 }}>
                                                        Student
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <User size={13} color="#A1A5B7" /> {query.student?.first_name} {query.student?.last_name}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Hash size={13} color="#A1A5B7" /> {query.student?.PRO_ID}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>
                                                    {query.query_number}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Calendar size={13} />
                                            {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                            <ArrowRight size={14} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ──── Query Detail / Status Update Modal ──── */}
            {showDetailModal && selectedQuery && (
                <div className="modal-overlay">
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        {/* Close Trigger */}
                        <button 
                            onClick={() => { setShowDetailModal(false); setSelectedQuery(null); }}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#8F92A1', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#E53935'}
                            onMouseLeave={e => e.currentTarget.style.color = '#8F92A1'}
                        >
                            <X size={22} />
                        </button>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            {(() => {
                                const TypeIcon = QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.icon || HelpCircle;
                                return (
                                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(229, 57, 53, 0.08)', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <TypeIcon size={24} strokeWidth={2.2} />
                                    </div>
                                );
                            })()}
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.015em' }}>
                                    {QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.label || selectedQuery.query_type}
                                </h2>
                                <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 600 }}>Ticket Ref: {selectedQuery.query_number}</span>
                            </div>
                        </div>

                        {/* Student / Client Profile Segment */}
                        <div style={{ padding: '18px', borderRadius: '16px', background: 'rgba(26, 29, 59, 0.03)', border: '1px solid rgba(26, 29, 59, 0.05)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E53935' }} />
                                <span style={{ fontWeight: 800, color: '#1A1D3B', fontSize: '15px' }}>
                                    {selectedQuery.student?.first_name} {selectedQuery.student?.last_name}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '12px', color: '#5E6278', fontWeight: 600 }}>
                                <span><Hash size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Student ID: {selectedQuery.student?.PRO_ID}</span>
                                <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Contact: {selectedQuery.student?.phone || 'N/A'}</span>
                                <span style={{ gridColumn: '1 / -1' }}><BookOpen size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Enrollment Class: {selectedQuery.student?.class_enrollments?.[0]?.class?.class_name || 'Not Enrolled'}</span>
                            </div>
                        </div>

                        {/* Ticket Description details */}
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                            {selectedQuery.query_subtype && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 700 }}>Requested Target</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 700 }}>{selectedQuery.query_subtype}</span>
                                </div>
                            )}
                            {selectedQuery.target_teacher && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 700 }}>Addressed Teacher</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 700 }}>{selectedQuery.target_teacher.first_name} {selectedQuery.target_teacher.last_name}</span>
                                </div>
                            )}
                            {selectedQuery.description && (
                                <div style={{ padding: '14px 16px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Detailed Context</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', lineHeight: 1.6, display: 'block' }}>{selectedQuery.description}</span>
                                </div>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Raised By</div>
                                    <div style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 700, textTransform: 'capitalize' }}>{selectedQuery.raised_by}</div>
                                </div>
                                <div style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                    <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Created Date</div>
                                    <div style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 700 }}>
                                        {new Date(selectedQuery.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Update Form Controls */}
                        <div style={{ borderTop: '1.5px solid rgba(226, 232, 240, 0.8)', paddingTop: '20px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Update Resolution Status</label>
                            
                            {/* Clickable Card-based Selector grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    const isSelected = statusUpdate.status === key;
                                    return (
                                        <div 
                                            key={key} 
                                            onClick={() => setStatusUpdate({ ...statusUpdate, status: key })}
                                            style={{
                                                padding: '12px 8px', 
                                                textAlign: 'center', 
                                                borderRadius: '12px', 
                                                cursor: 'pointer',
                                                border: isSelected ? `2.5px solid ${cfg.color}` : '1.5px solid rgba(226, 232, 240, 0.8)',
                                                background: isSelected ? cfg.bg : 'white',
                                                boxShadow: isSelected ? `0 4px 12px ${cfg.color}15` : 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Icon size={20} color={cfg.color} style={{ margin: '0 auto 6px' }} />
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? cfg.color : '#8F92A1' }}>{cfg.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <textarea
                                placeholder="Write resolution details, notes, or next steps here..."
                                value={statusUpdate.resolution_note}
                                onChange={e => setStatusUpdate({ ...statusUpdate, resolution_note: e.target.value })}
                                rows={3}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    borderRadius: '14px', 
                                    border: '1.5px solid rgba(226, 232, 240, 0.9)', 
                                    outline: 'none', 
                                    resize: 'vertical', 
                                    fontFamily: 'inherit', 
                                    fontSize: '13px',
                                    marginBottom: '20px',
                                    transition: 'border-color 0.2s',
                                    background: 'rgba(248, 250, 252, 0.5)'
                                }}
                                onFocus={e => e.target.style.borderColor = '#E53935'}
                                onBlur={e => e.target.style.borderColor = 'rgba(226, 232, 240, 0.9)'}
                            />
                            
                            <button 
                                onClick={handleUpdateStatus} 
                                className="gradient-btn" 
                                style={{ 
                                    width: '100%', 
                                    padding: '14px', 
                                    borderRadius: '14px', 
                                    color: 'white', 
                                    border: 'none', 
                                    fontSize: '15px', 
                                    fontWeight: 700, 
                                    cursor: 'pointer' 
                                }}
                            >
                                Save Ticket Updates
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <ToolBottomBar />
        </DashboardLayout>
    );
}

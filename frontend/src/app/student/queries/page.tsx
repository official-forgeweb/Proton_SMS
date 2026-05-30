'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    MessageSquare, Plus, X, Clock, CheckCircle,
    AlertCircle, XCircle, ArrowRight, Hash,
    Smartphone, PhoneCall, MessageCircle, FileText, Users, GraduationCap, Mail, HelpCircle,
    Activity, ClipboardList, ExternalLink
} from 'lucide-react';

const QUERY_TYPES = [
    { value: 'phone_change_student', label: 'Phone Number Change (My Number)', icon: Smartphone, needsSubtype: false },
    { value: 'phone_change_parent', label: 'Phone Number Change (Parent)', icon: PhoneCall, needsSubtype: false },
    { value: 'whatsapp_student', label: 'Not Added on WhatsApp Group (Me)', icon: MessageCircle, needsSubtype: false },
    { value: 'whatsapp_parent', label: 'Not Added on WhatsApp Group (Parent)', icon: MessageCircle, needsSubtype: false },
    { value: 'old_assignment', label: 'Want Old Assignment', icon: FileText, needsSubtype: true, subtypeLabel: 'Which Assignment?' },
    { value: 'parent_meeting', label: 'Parent Wants to Meet Teacher', icon: Users, needsSubtype: true, subtypeLabel: 'Which Teacher?', needsTeacher: true },
    { value: 'personal_session', label: 'I Want a Personal Session', icon: GraduationCap, needsSubtype: true, subtypeLabel: 'With Which Teacher?', needsTeacher: true },
    { value: 'leave_application', label: 'Application for Leave', icon: Mail, needsSubtype: false },
    { value: 'other', label: 'Other', icon: HelpCircle, needsSubtype: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    new: { label: 'Submitted', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: AlertCircle },
    processing: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock },
    resolved: { label: 'Resolved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle },
    unresolved: { label: 'Unresolved', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
};

export default function StudentQueriesPage() {
    const [queries, setQueries] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState<any>(null);

    const [formData, setFormData] = useState({
        query_type: '',
        query_subtype: '',
        description: '',
        target_teacher_id: '',
        priority: 'medium'
    });

    const fetchQueries = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/queries');
            setQueries(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchQueries();
        fetchTeachers();
    }, []);

    const handleCreateQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/queries', formData);
            setShowCreateModal(false);
            setFormData({ query_type: '', query_subtype: '', description: '', target_teacher_id: '', priority: 'medium' });
            fetchQueries();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit query');
        }
    };

    const currentQueryType = QUERY_TYPES.find(q => q.value === formData.query_type);

    const activeQueries = queries.filter(q => q.status === 'new' || q.status === 'processing');
    const resolvedQueries = queries.filter(q => q.status === 'resolved' || q.status === 'unresolved');

    return (
        <DashboardLayout requiredRole="student">
            <style>{`
                .query-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.04);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .query-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.08);
                    border-color: rgba(229, 57, 53, 0.2);
                }
                .type-selector-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1.5px solid rgba(226, 232, 240, 0.8);
                }
                .type-selector-btn:hover {
                    transform: translateY(-2px);
                    border-color: rgba(229, 57, 53, 0.5);
                    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.06);
                }
                .modal-blur-overlay {
                    backdrop-filter: blur(20px);
                    background: rgba(13, 15, 33, 0.45);
                    animation: fadeIn 0.25s ease-out;
                }
                .modal-card {
                    animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .custom-input {
                    transition: all 0.2s ease;
                    border: 1.5px solid rgba(226, 232, 240, 0.8);
                    background: rgba(248, 249, 253, 0.7);
                    outline: none;
                }
                .custom-input:focus {
                    border-color: #E53935;
                    background: #FFFFFF;
                    box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.12);
                }
                .custom-select {
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231A1D3B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 16px;
                    padding-right: 40px !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 120px 20px' }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(13, 15, 33, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px'
                }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'radial-gradient(circle at 100% 0%, #E53935 0%, transparent 50%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <MessageSquare size={32} color="#E53935" /> Proton Support Hub
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Need assistance? File a direct ticket and check status resolutions in real-time.
                        </p>
                    </div>

                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="hover-lift"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            color: 'white', border: 'none', padding: '14px 28px',
                            borderRadius: '16px', fontWeight: 700, fontSize: '14px',
                            boxShadow: '0 6px 20px rgba(229, 57, 53, 0.35)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'pointer',
                            zIndex: 1
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(229, 57, 53, 0.5)';
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.35)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                    >
                        <Plus size={20} strokeWidth={2.5} /> Raise Support Ticket
                    </button>
                </div>

                {/* Quick Metrics Counter Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ padding: '20px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                            <Activity size={24} color="#F59E0B" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '12px', color: '#5E6278', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Tickets</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>{activeQueries.length}</span>
                        </div>
                    </div>
                    <div style={{ padding: '20px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={24} color="#10B981" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '12px', color: '#5E6278', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved / Past</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>{resolvedQueries.length}</span>
                        </div>
                    </div>
                    <div style={{ padding: '20px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(79, 96, 255, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                            <ClipboardList size={24} color="#4F60FF" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '12px', color: '#5E6278', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Inquiries</span>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>{queries.length}</span>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    {/* Active Queries */}
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Clock size={20} color="#F59E0B" /> In-Progress Queries
                            {activeQueries.length > 0 && (
                                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontWeight: 700 }}>
                                    {activeQueries.length} File{activeQueries.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>

                        {isLoading ? (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {[1, 2].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '20px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(226,232,240,0.5)' }} />
                                ))}
                            </div>
                        ) : activeQueries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.02)' }}>
                                <CheckCircle size={44} color="#10B981" style={{ marginBottom: '16px', filter: 'drop-shadow(0 4px 10px rgba(16, 185, 129, 0.2))' }} />
                                <h4 style={{ color: '#1A1D3B', fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>All Clear!</h4>
                                <p style={{ color: '#5E6278', fontSize: '14px', fontWeight: 500, margin: 0 }}>You don't have any outstanding support requests.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {activeQueries.map(query => {
                                    const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.new;
                                    const StatusIcon = statusCfg.icon;
                                    const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                                    const TypeIcon = typeInfo?.icon || HelpCircle;

                                    return (
                                        <div key={query.id} onClick={() => { setSelectedQuery(query); setShowDetailModal(true); }}
                                            className="query-card" style={{
                                                padding: '22px 28px', borderRadius: '20px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                borderLeft: `5px solid ${statusCfg.color}`,
                                                gap: '16px'
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <div style={{ 
                                                    width: '52px', height: '52px', borderRadius: '14px', 
                                                    background: 'rgba(79, 96, 255, 0.08)', color: '#4F60FF',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <TypeIcon size={26} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0, marginBottom: '6px' }}>
                                                        {typeInfo?.label || query.query_type}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <span style={{ 
                                                            fontSize: '11px', padding: '4px 10px', borderRadius: '8px', 
                                                            background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, 
                                                            display: 'flex', alignItems: 'center', gap: '6px' 
                                                        }}>
                                                            <StatusIcon size={12} /> {statusCfg.label}
                                                        </span>
                                                        <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>ID: {query.query_number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>
                                                    {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ArrowRight size={16} color="#4F60FF" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Resolved / Past Queries */}
                    {resolvedQueries.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle size={20} color="#10B981" /> Resolved & Past Tickets
                            </h3>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {resolvedQueries.map(query => {
                                    const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.resolved;
                                    const StatusIcon = statusCfg.icon;
                                    const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                                    const TypeIcon = typeInfo?.icon || HelpCircle;

                                    return (
                                        <div key={query.id} onClick={() => { setSelectedQuery(query); setShowDetailModal(true); }}
                                            className="query-card" style={{
                                                padding: '18px 24px', borderRadius: '18px', background: 'rgba(250, 250, 252, 0.7)',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                opacity: 0.9, gap: '16px'
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ 
                                                    width: '44px', height: '44px', borderRadius: '12px', 
                                                    background: 'rgba(143, 146, 161, 0.08)', color: '#8F92A1',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <TypeIcon size={20} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#5E6278', margin: 0, marginBottom: '4px' }}>
                                                        {typeInfo?.label || query.query_type}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 700 }}>
                                                            {statusCfg.label}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 500 }}>ID: {query.query_number}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500 }}>
                                                {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="modal-blur-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="modal-card custom-scrollbar" style={{ 
                        background: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(20px)',
                        width: '100%', 
                        maxWidth: '560px', 
                        borderRadius: '28px', 
                        padding: '36px', 
                        position: 'relative', 
                        maxHeight: '85vh', 
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(13, 15, 33, 0.25)'
                    }}>
                        <button onClick={() => setShowCreateModal(false)}
                            style={{ 
                                position: 'absolute', top: '24px', right: '24px', background: '#F4F5F9', border: 'none', cursor: 'pointer',
                                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', color: '#5E6278'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F4F5F9'}
                        >
                            <X size={18} />
                        </button>

                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px', letterSpacing: '-0.01em' }}>Create Support Ticket</h2>
                        <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '28px', fontWeight: 500 }}>Select the appropriate query category and fill in details below.</p>

                        <form onSubmit={handleCreateQuery}>
                            {/* Query Type Selector Grid */}
                            <div style={{ marginBottom: '22px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    Select Ticket Category *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '220px', overflowY: 'auto', padding: '4px', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#F8F9FD' }} className="custom-scrollbar">
                                    {QUERY_TYPES.map(q => {
                                        const isSelected = formData.query_type === q.value;
                                        return (
                                            <div key={q.value}
                                                onClick={() => setFormData({ ...formData, query_type: q.value, query_subtype: '', target_teacher_id: '' })}
                                                className="type-selector-btn"
                                                style={{
                                                    padding: '14px 12px', borderRadius: '12px', cursor: 'pointer',
                                                    border: isSelected ? '2px solid #E53935' : '1.5px solid rgba(226, 232, 240, 0.8)',
                                                    background: isSelected ? 'rgba(229, 57, 53, 0.05)' : '#FFFFFF',
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                }}>
                                                <div style={{ 
                                                    width: '32px', height: '32px', borderRadius: '8px', 
                                                    background: isSelected ? 'rgba(229, 57, 53, 0.1)' : 'rgba(143, 146, 161, 0.06)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isSelected ? '#E53935' : '#8F92A1'
                                                }}>
                                                    <q.icon size={18} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A1D3B', lineHeight: 1.2 }}>{q.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dynamic Subtype / Teacher Selection field */}
                            {currentQueryType?.needsSubtype && (
                                <div style={{ marginBottom: '22px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                        {currentQueryType.subtypeLabel} *
                                    </label>
                                    {currentQueryType.needsTeacher ? (
                                        <div style={{ position: 'relative' }}>
                                            <select required value={formData.target_teacher_id}
                                                onChange={e => setFormData({ ...formData, target_teacher_id: e.target.value, query_subtype: e.target.options[e.target.selectedIndex].text })}
                                                className="custom-input custom-select"
                                                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: '#1A1D3B' }}>
                                                <option value="">Select Target Instructor</option>
                                                {teachers.map((t: any) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.first_name} {t.last_name} ({t.email?.split('@')[0]})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <input type="text" required placeholder="Specify assignment details or details..."
                                            value={formData.query_subtype}
                                            onChange={e => setFormData({ ...formData, query_subtype: e.target.value })}
                                            className="custom-input"
                                            style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, boxSizing: 'border-box' }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Details Text Area */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    Provide Details / Context *
                                </label>
                                <textarea placeholder="Clearly describe your query or problem, including any specific files or dates so the admin can resolve it efficiently..."
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="custom-input"
                                    style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '14.5px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }}
                                />
                            </div>

                            <button disabled={!formData.query_type}
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                    background: formData.query_type ? 'linear-gradient(135deg, #E53935 0%, #C62828 100%)' : 'rgba(226, 232, 240, 0.9)',
                                    color: formData.query_type ? 'white' : '#A1A5B7',
                                    fontWeight: 700, fontSize: '15px', cursor: formData.query_type ? 'pointer' : 'not-allowed',
                                    boxShadow: formData.query_type ? '0 6px 20px rgba(229, 57, 53, 0.25)' : 'none',
                                    transition: 'all 0.3s'
                                }}>
                                Submit Support Ticket
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Details Modal */}
            {showDetailModal && selectedQuery && (
                <div className="modal-blur-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="modal-card custom-scrollbar" style={{ 
                        background: '#FFFFFF', 
                        width: '100%', 
                        maxWidth: '860px', 
                        borderRadius: '32px', 
                        padding: '32px', 
                        position: 'relative',
                        boxShadow: '0 30px 70px rgba(15, 23, 42, 0.12)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        {/* Glowing accent spot */}
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle at 100% 0%, rgba(229, 57, 53, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* Top Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {(() => {
                                    const TypeIcon = QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.icon || HelpCircle;
                                    return (
                                        <div style={{ 
                                            width: '52px', height: '52px', borderRadius: '16px', 
                                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: '#FFFFFF',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 16px rgba(26, 29, 59, 0.1)'
                                        }}>
                                            <TypeIcon size={24} />
                                        </div>
                                    );
                                })()}
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                                        {QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.label || selectedQuery.query_type}
                                    </h2>
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        Ticket ID: {selectedQuery.query_number}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => { setShowDetailModal(false); setSelectedQuery(null); }}
                                style={{ 
                                    background: '#F1F5F9', border: 'none', cursor: 'pointer',
                                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', color: '#64748B'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Two Column Responsive Split Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', alignItems: 'start' }}>
                            
                            {/* LEFT COLUMN: QUERY INFO */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Metadata Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '14px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Status</span>
                                        <span style={{ 
                                            fontSize: '11px', fontWeight: 800, color: STATUS_CONFIG[selectedQuery.status]?.color || '#333',
                                            background: STATUS_CONFIG[selectedQuery.status]?.bg, padding: '2px 8px', borderRadius: '6px', display: 'inline-block'
                                        }}>
                                            {STATUS_CONFIG[selectedQuery.status]?.label || selectedQuery.status}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Subject Info</span>
                                        <span style={{ fontSize: '12px', color: '#1A1D3B', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedQuery.query_subtype || 'N/A'}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted On</span>
                                        <span style={{ fontSize: '11px', color: '#1A1D3B', fontWeight: 700 }}>
                                            {new Date(selectedQuery.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Query Description</span>
                                    <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '16px', borderLeft: '4px solid #CBD5E1', borderTop: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                                        <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                            {selectedQuery.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: RESOLUTION & FILES */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {selectedQuery.resolution_note || (selectedQuery.attachments && selectedQuery.attachments.length > 0) ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {selectedQuery.resolution_note && (
                                            <div style={{ padding: '20px', background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)', borderRadius: '24px', border: '1px solid #A7F3D0', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.03)' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Resolution Summary</span>
                                                <p style={{ fontSize: '14px', color: '#064E3B', lineHeight: 1.6, display: 'block', fontWeight: 600, margin: 0 }}>
                                                    {selectedQuery.resolution_note}
                                                </p>
                                            </div>
                                        )}

                                        {selectedQuery.attachments && selectedQuery.attachments.length > 0 && (
                                            <div style={{ padding: '20px', background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F7FF 100%)', borderRadius: '24px', border: '1px solid #C7D2FE', boxShadow: '0 4px 15px rgba(79, 96, 255, 0.03)' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#4F60FF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>Resolution Attachments</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {selectedQuery.attachments.map((att: any) => {
                                                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
                                                        return (
                                                            <div key={att.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <a href={att.file_url} target="_blank" rel="noopener noreferrer" 
                                                                    style={{ 
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                                                        background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px 16px', 
                                                                        borderRadius: '12px', textDecoration: 'none', color: '#1E293B', 
                                                                        fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                                                        transition: 'all 0.2s ease' 
                                                                    }}
                                                                    onMouseEnter={e => {
                                                                        e.currentTarget.style.borderColor = '#4F60FF';
                                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                    }}
                                                                >
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <FileText size={16} color="#4F60FF" />
                                                                        {att.file_name}
                                                                    </span>
                                                                    <span style={{ color: '#4F60FF', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        View <ExternalLink size={12} />
                                                                    </span>
                                                                </a>
                                                                {isImage && (
                                                                    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #C7D2FE', marginTop: '4px', maxWidth: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', padding: '10px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)' }}>
                                                                        <img src={att.file_url} alt={att.file_name} 
                                                                            style={{ 
                                                                                maxWidth: '100%', 
                                                                                maxHeight: '200px', 
                                                                                borderRadius: '12px', 
                                                                                objectFit: 'contain',
                                                                                boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
                                                                            }} 
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '32px 24px', background: '#FAFBFD', borderRadius: '24px', border: '1.5px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '220px' }}>
                                        <Clock size={36} color="#94A3B8" style={{ marginBottom: '12px' }} />
                                        <h4 style={{ fontSize: '15px', color: '#475569', fontWeight: 700, margin: '0 0 6px 0' }}>Resolution Pending</h4>
                                        <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                                            The Proton support team is reviewing your ticket and will post the solution and files here shortly.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}


'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    MessageSquare, Plus, X, Clock, CheckCircle,
    AlertCircle, XCircle, ArrowRight, Hash,
    Smartphone, PhoneCall, MessageCircle, FileText, Users, GraduationCap, Mail, HelpCircle
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
    new: { label: 'Submitted', color: '#3B82F6', bg: '#EFF6FF', icon: AlertCircle },
    processing: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
    resolved: { label: 'Resolved', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
    unresolved: { label: 'Unresolved', color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
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
            <div className="page-header" style={{ marginBottom: '32px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>My Queries</h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Submit and track your support requests.</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="hover-lift"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                            color: 'white', border: 'none', padding: '12px 24px',
                            borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(229, 57, 53, 0.3)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(229, 57, 53, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(229, 57, 53, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                    >
                        <Plus size={20} strokeWidth={2.5} /> Raise Query
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Active Queries */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} color="#F59E0B" /> Active Queries
                        {activeQueries.length > 0 && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#FFFBEB', color: '#F59E0B', fontWeight: 700 }}>
                                {activeQueries.length}
                            </span>
                        )}
                    </h3>

                    {isLoading ? (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
                        </div>
                    ) : activeQueries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '20px' }}>
                            <CheckCircle size={36} color="#10B981" style={{ marginBottom: '12px' }} />
                            <p style={{ color: '#5E6278', fontSize: '14px', fontWeight: 500 }}>No active queries. Everything looks good!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {activeQueries.map(query => {
                                const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.new;
                                const StatusIcon = statusCfg.icon;
                                const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                                const TypeIcon = typeInfo?.icon || HelpCircle;

                                return (
                                    <div key={query.id} onClick={() => { setSelectedQuery(query); setShowDetailModal(true); }}
                                        className="card hover-lift" style={{
                                            padding: '20px 24px', borderRadius: '16px', background: '#FFFFFF',
                                            border: '1px solid #E2E8F0', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            borderLeft: `4px solid ${statusCfg.color}`
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={28} color="#4F60FF" /></div>
                                            <div>
                                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', margin: 0, marginBottom: '4px' }}>
                                                    {typeInfo?.label || query.query_type}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <StatusIcon size={11} /> {statusCfg.label}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#A1A5B7' }}>{query.query_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                {/* Past Queries */}
                {resolvedQueries.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18} color="#10B981" /> Past Queries
                        </h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {resolvedQueries.map(query => {
                                const statusCfg = STATUS_CONFIG[query.status] || STATUS_CONFIG.resolved;
                                const StatusIcon = statusCfg.icon;
                                const typeInfo = QUERY_TYPES.find(q => q.value === query.query_type);
                                const TypeIcon = typeInfo?.icon || HelpCircle;

                                return (
                                    <div key={query.id} onClick={() => { setSelectedQuery(query); setShowDetailModal(true); }}
                                        className="card" style={{
                                            padding: '16px 20px', borderRadius: '14px', background: '#FAFAFA',
                                            border: '1px solid #F0F0F5', cursor: 'pointer', opacity: 0.85,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}><TypeIcon size={22} color="#8F92A1" /></div>
                                            <div>
                                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#5E6278', margin: 0 }}>
                                                    {typeInfo?.label || query.query_type}
                                                </h3>
                                                <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 700 }}>
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#A1A5B7' }}>
                                            {new Date(query.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '540px', borderRadius: '24px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowCreateModal(false)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>

                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>Raise a Query</h2>
                        <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '28px' }}>Select the type of query and provide details.</p>

                        <form onSubmit={handleCreateQuery}>
                            {/* Query Type */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '10px', display: 'block' }}>
                                    What do you need help with? *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {QUERY_TYPES.map(q => (
                                        <div key={q.value}
                                            onClick={() => setFormData({ ...formData, query_type: q.value, query_subtype: '', target_teacher_id: '' })}
                                            style={{
                                                padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                                border: formData.query_type === q.value ? '2px solid #E53935' : '1.5px solid #E2E8F0',
                                                background: formData.query_type === q.value ? '#FFF5F5' : '#FFFFFF',
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                transition: 'all 0.2s'
                                            }}>
                                            <span style={{ display: 'flex', alignItems: 'center' }}><q.icon size={20} color={formData.query_type === q.value ? '#E53935' : '#8F92A1'} /></span>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1D3B' }}>{q.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subtype */}
                            {currentQueryType?.needsSubtype && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>
                                        {currentQueryType.subtypeLabel} *
                                    </label>
                                    {currentQueryType.needsTeacher ? (
                                        <select required value={formData.target_teacher_id}
                                            onChange={e => setFormData({ ...formData, target_teacher_id: e.target.value, query_subtype: e.target.options[e.target.selectedIndex].text })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}>
                                            <option value="">Select Teacher</option>
                                            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" required placeholder="Specify details..."
                                            value={formData.query_subtype}
                                            onChange={e => setFormData({ ...formData, query_subtype: e.target.value })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Additional Details</label>
                                <textarea placeholder="Describe your request..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>

                            <button disabled={!formData.query_type} className="btn-primary"
                                style={{ width: '100%', padding: '14px', opacity: !formData.query_type ? 0.5 : 1 }}>
                                Submit Query
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedQuery && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
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
                                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                    {QUERY_TYPES.find(q => q.value === selectedQuery.query_type)?.label || selectedQuery.query_type}
                                </h2>
                                <span style={{ fontSize: '12px', color: '#A1A5B7' }}>{selectedQuery.query_number}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8F9FD', borderRadius: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Status</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: STATUS_CONFIG[selectedQuery.status]?.color || '#333' }}>
                                    {STATUS_CONFIG[selectedQuery.status]?.label || selectedQuery.status}
                                </span>
                            </div>
                            {selectedQuery.query_subtype && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8F9FD', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Details</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{selectedQuery.query_subtype}</span>
                                </div>
                            )}
                            {selectedQuery.description && (
                                <div style={{ padding: '12px', background: '#F8F9FD', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Description</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B' }}>{selectedQuery.description}</span>
                                </div>
                            )}
                            {selectedQuery.resolution_note && (
                                <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                                    <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Resolution Note</span>
                                    <span style={{ fontSize: '13px', color: '#1A1D3B' }}>{selectedQuery.resolution_note}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8F9FD', borderRadius: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Submitted</span>
                                <span style={{ fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>
                                    {new Date(selectedQuery.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}


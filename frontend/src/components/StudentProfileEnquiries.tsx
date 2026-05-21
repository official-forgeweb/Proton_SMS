import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Clock, CheckCircle2, AlertCircle, Filter, Search, 
    Plus, Send, Paperclip, Trash2, Edit, UserCheck, RefreshCw, 
    FileText, X, AlertOctagon, User, BookOpen, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';

interface StudentProfileEnquiriesProps {
    studentId: string;
    role: 'admin' | 'teacher';
}

interface QueryReply {
    id: string;
    message: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        role: string;
        teacher?: { first_name: string; last_name: string };
        student?: { first_name: string; last_name: string };
    };
}

interface QueryInternalNote {
    id: string;
    note: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        role: string;
        teacher?: { first_name: string; last_name: string };
    };
}

interface QueryAttachment {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    created_at: string;
}

interface QueryAuditLog {
    id: string;
    action: string;
    details: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

interface StudentQuery {
    id: string;
    query_number: string;
    query_type: string;
    subject: string;
    description: string;
    status: 'new' | 'processing' | 'resolved' | 'unresolved';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    resolved_at?: string;
    target_teacher?: { id: string; first_name: string; last_name: string };
    target_teacher_id?: string;
    replies?: QueryReply[];
    internal_notes?: QueryInternalNote[];
    attachments?: QueryAttachment[];
    audit_logs?: QueryAuditLog[];
    student?: {
        id: string;
        PRO_ID: string;
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
        class_enrollments?: Array<{ class: { class_name: string } }>;
    };
}

interface Teacher {
    id: string;
    first_name: string;
    last_name: string;
}

export default function StudentProfileEnquiries({ studentId, role }: StudentProfileEnquiriesProps) {
    const [queries, setQueries] = useState<StudentQuery[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Active query in CRM Drawer
    const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
    const [detailQuery, setDetailQuery] = useState<StudentQuery | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form inputs in Drawer
    const [newReply, setNewReply] = useState('');
    const [newInternalNote, setNewInternalNote] = useState('');
    const [noteEditingId, setNoteEditingId] = useState<string | null>(null);
    const [editNoteText, setEditNoteText] = useState('');
    const [showAttachmentInput, setShowAttachmentInput] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileUrl, setNewFileUrl] = useState('');

    // Modal to create new enquiry
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newQuerySubject, setNewQuerySubject] = useState('');
    const [newQueryType, setNewQueryType] = useState('academic');
    const [newQueryPriority, setNewQueryPriority] = useState('medium');
    const [newQueryDesc, setNewQueryDesc] = useState('');
    const [newQueryTargetTeacher, setNewQueryTargetTeacher] = useState('');
    const [submittingQuery, setSubmittingQuery] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchQueries();
        fetchTeachers();
    }, [studentId]);

    useEffect(() => {
        if (selectedQueryId) {
            fetchQueryDetails(selectedQueryId);
        } else {
            setDetailQuery(null);
        }
    }, [selectedQueryId]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [detailQuery?.replies]);

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/queries?student_id=${studentId}`);
            if (response.data.success) {
                setQueries(response.data.data);
            } else {
                setError(response.data.message || 'Failed to load queries');
            }
        } catch (err: any) {
            console.error('Fetch queries error:', err);
            setError(err.response?.data?.message || 'Error fetching enquiries');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/teachers');
            if (response.data.success) {
                setTeachers(response.data.data);
            }
        } catch (err) {
            console.error('Fetch teachers error:', err);
        }
    };

    const fetchQueryDetails = async (id: string) => {
        try {
            setLoadingDetail(true);
            const response = await api.get(`/queries/${id}/details`);
            if (response.data.success) {
                setDetailQuery(response.data.data);
            }
        } catch (err: any) {
            console.error('Fetch query details error:', err);
            alert(err.response?.data?.message || 'Failed to fetch enquiry details');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCreateQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuerySubject.trim() || !newQueryDesc.trim()) {
            alert('Subject and description are required.');
            return;
        }

        try {
            setSubmittingQuery(true);
            const payload = {
                student_id: studentId,
                query_type: newQueryType,
                subject: newQuerySubject,
                description: newQueryDesc,
                priority: newQueryPriority,
                target_teacher_id: newQueryTargetTeacher || undefined
            };

            const response = await api.post('/queries', payload);
            if (response.data.success) {
                setShowCreateModal(false);
                // Clear inputs
                setNewQuerySubject('');
                setNewQueryDesc('');
                setNewQueryType('academic');
                setNewQueryPriority('medium');
                setNewQueryTargetTeacher('');
                fetchQueries();
            } else {
                alert(response.data.message || 'Failed to create enquiry');
            }
        } catch (err: any) {
            console.error('Create query error:', err);
            alert(err.response?.data?.message || 'Error creating enquiry');
        } finally {
            setSubmittingQuery(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim() || !selectedQueryId) return;

        try {
            const response = await api.post(`/queries/${selectedQueryId}/replies`, { message: newReply });
            if (response.data.success) {
                setNewReply('');
                fetchQueryDetails(selectedQueryId);
            }
        } catch (err: any) {
            console.error('Send reply error:', err);
            alert(err.response?.data?.message || 'Failed to send reply');
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInternalNote.trim() || !selectedQueryId) return;

        try {
            const response = await api.post(`/queries/${selectedQueryId}/notes`, { note: newInternalNote });
            if (response.data.success) {
                setNewInternalNote('');
                fetchQueryDetails(selectedQueryId);
            }
        } catch (err: any) {
            console.error('Add note error:', err);
            alert(err.response?.data?.message || 'Failed to add note');
        }
    };

    const handleUpdateNote = async (noteId: string) => {
        if (!editNoteText.trim() || !selectedQueryId) return;

        try {
            const response = await api.put(`/queries/${selectedQueryId}/notes/${noteId}`, { note: editNoteText });
            if (response.data.success) {
                setNoteEditingId(null);
                setEditNoteText('');
                fetchQueryDetails(selectedQueryId);
            }
        } catch (err: any) {
            console.error('Update note error:', err);
            alert(err.response?.data?.message || 'Failed to update note');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedQueryId || !confirm('Are you sure you want to delete this internal note?')) return;

        try {
            const response = await api.delete(`/queries/${selectedQueryId}/notes/${noteId}`);
            if (response.data.success) {
                fetchQueryDetails(selectedQueryId);
            }
        } catch (err: any) {
            console.error('Delete note error:', err);
            alert(err.response?.data?.message || 'Failed to delete note');
        }
    };

    const handleCRMUpdate = async (fields: { status?: string; priority?: string; target_teacher_id?: string | null }) => {
        if (!selectedQueryId) return;

        try {
            const response = await api.put(`/queries/${selectedQueryId}/crm`, fields);
            if (response.data.success) {
                fetchQueryDetails(selectedQueryId);
                fetchQueries();
            }
        } catch (err: any) {
            console.error('CRM update error:', err);
            alert(err.response?.data?.message || 'Failed to update query parameters');
        }
    };

    const handleAddAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileName.trim() || !newFileUrl.trim() || !selectedQueryId) return;

        try {
            const response = await api.post(`/queries/${selectedQueryId}/attachments`, {
                file_name: newFileName,
                file_url: newFileUrl,
                file_size: Math.floor(Math.random() * 5000000) + 100000 // Mock size
            });
            if (response.data.success) {
                setNewFileName('');
                setNewFileUrl('');
                setShowAttachmentInput(false);
                fetchQueryDetails(selectedQueryId);
            }
        } catch (err: any) {
            console.error('Add attachment error:', err);
            alert(err.response?.data?.message || 'Failed to attach file');
        }
    };

    // Filter calculations
    const filteredQueries = queries.filter(q => {
        const matchesSearch = 
            q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.query_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || q.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || q.query_type === categoryFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    // Stats
    const stats = {
        total: queries.length,
        unresolved: queries.filter(q => q.status !== 'resolved').length,
        resolved: queries.filter(q => q.status === 'resolved').length,
        urgent: queries.filter(q => q.priority === 'urgent' && q.status !== 'resolved').length
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <span className="badge badge-new"><Clock size={11} /> New</span>;
            case 'processing':
                return <span className="badge badge-processing"><RefreshCw size={11} className="spin" /> Processing</span>;
            case 'resolved':
                return <span className="badge badge-resolved"><CheckCircle2 size={11} /> Resolved</span>;
            default:
                return <span className="badge badge-unresolved"><AlertCircle size={11} /> Unresolved</span>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <span className="p-badge p-urgent"><AlertOctagon size={11} /> Urgent</span>;
            case 'high':
                return <span className="p-badge p-high">High</span>;
            case 'medium':
                return <span className="p-badge p-medium">Medium</span>;
            default:
                return <span className="p-badge p-low">Low</span>;
        }
    };

    const getCategoryLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <div style={{ animationDelay: '250ms' }} className="animate-in">
            {/* STYLES */}
            <style dangerouslySetInnerHTML={{ __html: `
                .queries-grid {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;
                }
                .query-stat-card {
                    background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px;
                    display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }
                .query-stat-icon {
                    width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                }
                .filter-bar {
                    background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 16px;
                    display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;
                }
                .search-input-wrapper {
                    position: relative; flex: 1; min-width: 200px;
                }
                .search-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94A3B8;
                }
                .search-input {
                    width: 100%; padding: 10px 14px 10px 42px; border: 1.5px solid #E2E8F0; border-radius: 10px;
                    font-size: 14px; outline: none; font-weight: 500; transition: border-color 0.2s;
                }
                .search-input:focus { border-color: #E53935; }
                .filter-select {
                    padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; font-size: 14px;
                    outline: none; font-weight: 600; color: #475569; background: white; cursor: pointer;
                }
                .filter-select:focus { border-color: #E53935; }
                .btn-primary-proton {
                    background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
                    color: white; border: none; padding: 11px 20px; border-radius: 10px;
                    font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;
                    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(229,57,53,0.25);
                }
                .btn-primary-proton:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(229,57,53,0.35); }
                .badge {
                    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
                }
                .badge-new { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; }
                .badge-processing { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
                .badge-resolved { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
                .badge-unresolved { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; }
                .p-badge {
                    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; text-transform: uppercase;
                }
                .p-low { background: #F1F5F9; color: #475569; }
                .p-medium { background: #FEF3C7; color: #D97706; }
                .p-high { background: #FFEDD5; color: #EA580C; }
                .p-urgent { background: #FEE2E2; color: #EF4444; border: 1px solid #FCA5A5; animation: pulseGlow 2s infinite; }
                
                .ticket-list {
                    display: flex; flex-direction: column; gap: 14px;
                }
                .ticket-card {
                    background: white; border: 1.5px solid #F1F5F9; border-radius: 16px; padding: 20px;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative; overflow: hidden;
                }
                .ticket-card:hover { transform: translateY(-3px); border-color: #E2E8F0; box-shadow: 0 10px 20px rgba(0,0,0,0.03); }
                .ticket-card.selected { border-color: #E53935; background: rgba(229,57,53,0.01); }
                .ticket-card::before {
                    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
                    background: transparent; transition: background 0.2s;
                }
                .ticket-card.priority-urgent::before { background: #EF4444; }
                .ticket-card.priority-high::before { background: #F97316; }
                
                /* CRM Drawer styling */
                .crm-drawer-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
                    z-index: 1000; display: flex; justify-content: flex-end;
                }
                .crm-drawer {
                    width: 70%; max-width: 900px; height: 100%; background: #F8FAFC; box-shadow: -10px 0 40px rgba(0,0,0,0.15);
                    display: flex; flex-direction: column; animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideInLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                
                .chat-bubble {
                    max-width: 75%; padding: 12px 16px; border-radius: 16px; margin-bottom: 8px; font-size: 13.5px;
                    line-height: 1.5; font-weight: 500;
                }
                .chat-bubble.student {
                    background: white; border: 1px solid #E2E8F0; align-self: flex-start;
                    border-bottom-left-radius: 4px; color: #1E293B;
                }
                .chat-bubble.staff {
                    background: #E53935; color: white; align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }
                .internal-note-item {
                    background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 10px 14px;
                    margin-bottom: 10px; font-size: 12.5px; font-weight: 500;
                }
                
                /* Modal */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
                    z-index: 1100; display: flex; align-items: center; justify-content: center;
                }
                .modal-content {
                    background: white; border-radius: 20px; width: 100%; max-width: 550px; padding: 28px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            ` }}

            {/* STATS OVERVIEW CARDS */}
            <div className="queries-grid">
                <div className="query-stat-card">
                    <div className="query-stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{stats.total}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Total Enquiries</div>
                    </div>
                </div>
                <div className="query-stat-card">
                    <div className="query-stat-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{stats.unresolved}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Unresolved</div>
                    </div>
                </div>
                <div className="query-stat-card">
                    <div className="query-stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{stats.resolved}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Resolved Logs</div>
                    </div>
                </div>
                <div className="query-stat-card">
                    <div className="query-stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{stats.urgent}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Urgent Escalations</div>
                    </div>
                </div>
            </div>

            {/* FILTER & ACTIONS BAR */}
            <div className="filter-bar">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search ticket no, description, keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="processing">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="unresolved">Unresolved</option>
                </select>
                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Categories</option>
                    <option value="academic">Academic</option>
                    <option value="fees">Fees</option>
                    <option value="facilities">Facilities</option>
                    <option value="admissions">Admissions</option>
                    <option value="operations">Operations</option>
                    <option value="other">Other</option>
                </select>
                
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary-proton"
                >
                    <Plus size={16} /> Raise Enquiry
                </button>
            </div>

            {/* QUERY/ENQUIRY CARDS LIST */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <RefreshCw size={32} className="spin" color="#E53935" />
                    <p style={{ color: '#64748B', fontWeight: 600, marginTop: '12px' }}>Loading student enquiries...</p>
                </div>
            ) : error ? (
                <div style={{ border: '1px solid #FCA5A5', background: '#FEF2F2', padding: '16px', borderRadius: '12px', color: '#DC2626', fontWeight: 600 }}>
                    {error}
                </div>
            ) : filteredQueries.length > 0 ? (
                <div className="ticket-list">
                    {filteredQueries.map(q => (
                        <div 
                            key={q.id}
                            onClick={() => setSelectedQueryId(q.id)}
                            className={`ticket-card priority-${q.priority} ${selectedQueryId === q.id ? 'selected' : ''}`}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#64748B' }}>
                                            {q.query_number}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', background: '#F1F5F9', color: '#475569', borderRadius: '6px' }}>
                                            {getCategoryLabel(q.query_type)}
                                        </span>
                                        {getPriorityBadge(q.priority)}
                                    </div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
                                        {q.subject}
                                    </h4>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500, margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {q.description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    {getStatusBadge(q.status)}
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                                        {new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <User size={13} color="#94A3B8" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                                        Assigned Teacher: {q.target_teacher ? `${q.target_teacher.first_name} ${q.target_teacher.last_name}` : 'Unassigned'}
                                    </span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#E53935', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Open CRM Ticket <ArrowUpRight size={14} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', background: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #E2E8F0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', marginBottom: '16px' }}>
                        <MessageSquare size={28} color="#94A3B8" />
                    </div>
                    <h5 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>No Enquiries Found</h5>
                    <p style={{ color: '#64748B', fontSize: '13.5px', fontWeight: 600, margin: 0 }}>No student logs match your filter configurations.</p>
                </div>
            )}

            {/* CRM SUPPORT TICKET DETAIL DRAWER */}
            {selectedQueryId && (
                <div className="crm-drawer-overlay" onClick={() => setSelectedQueryId(null)}>
                    <div className="crm-drawer" onClick={(e) => e.stopPropagation()}>
                        {/* Drawer Header */}
                        <div style={{ padding: '20px 24px', background: 'white', borderBottom: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', fontFamily: 'monospace' }}>
                                        {detailQuery?.query_number || 'Loading...'}
                                    </span>
                                    {detailQuery && getStatusBadge(detailQuery.status)}
                                    {detailQuery && getPriorityBadge(detailQuery.priority)}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                    {detailQuery?.subject}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedQueryId(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <RefreshCw size={32} className="spin" color="#E53935" />
                                <p style={{ color: '#64748B', fontWeight: 600, marginTop: '12px' }}>Loading ticket details...</p>
                            </div>
                        ) : detailQuery ? (
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', overflow: 'hidden' }}>
                                {/* Left Section - Timeline & Replies */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1.5px solid #E2E8F0', height: '100%', overflow: 'hidden' }}>
                                    
                                    {/* CRM Ticket Operations Quick Panel */}
                                    <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '130px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>Status</span>
                                            <select 
                                                value={detailQuery.status}
                                                onChange={(e) => handleCRMUpdate({ status: e.target.value })}
                                                className="filter-select"
                                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                            >
                                                <option value="new">New</option>
                                                <option value="processing">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="unresolved">Unresolved</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '130px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>Priority</span>
                                            <select 
                                                value={detailQuery.priority}
                                                onChange={(e) => handleCRMUpdate({ priority: e.target.value })}
                                                className="filter-select"
                                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                        
                                        {/* Reassignment: Admin only */}
                                        {role === 'admin' && (
                                            <div style={{ flex: 1.5, minWidth: '180px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>Assign Teacher</span>
                                                <select 
                                                    value={detailQuery.target_teacher_id || ''}
                                                    onChange={(e) => handleCRMUpdate({ target_teacher_id: e.target.value || null })}
                                                    className="filter-select"
                                                    style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.id}>{`${t.first_name} ${t.last_name}`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Timeline */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                        {/* Query description block */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: '12px', fontWeight: 700 }}>
                                                    S
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>{detailQuery.student ? `${detailQuery.student.first_name} ${detailQuery.student.last_name}` : 'Student'}</span>
                                                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 500 }}>Ticket Creator</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13.5px', color: '#334155', fontWeight: 500, margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {detailQuery.description}
                                            </p>
                                            <span style={{ display: 'block', textAlign: 'right', fontSize: '10.5px', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>
                                                {new Date(detailQuery.created_at).toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        {/* Reply timeline */}
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {detailQuery.replies?.map((r) => {
                                                const isStudent = r.user.role === 'student';
                                                const senderName = isStudent 
                                                    ? `${r.user.student?.first_name} ${r.user.student?.last_name}`
                                                    : r.user.teacher 
                                                        ? `${r.user.teacher.first_name} ${r.user.teacher.last_name}`
                                                        : r.user.email;

                                                return (
                                                    <div 
                                                        key={r.id} 
                                                        style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            alignSelf: isStudent ? 'flex-start' : 'flex-end',
                                                            width: '100%',
                                                            alignItems: isStudent ? 'flex-start' : 'flex-end',
                                                            marginBottom: '16px'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                                                            {senderName} ({r.user.role.toUpperCase()})
                                                        </span>
                                                        <div className={`chat-bubble ${isStudent ? 'student' : 'staff'}`}>
                                                            {r.message}
                                                        </div>
                                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                                                            {new Date(r.created_at).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            <div ref={chatEndRef} />
                                        </div>
                                    </div>

                                    {/* Quick Reply Form */}
                                    <form onSubmit={handleSendReply} style={{ padding: '16px 20px', background: 'white', borderTop: '1.5px solid #E2E8F0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Write a message to student..."
                                            value={newReply}
                                            onChange={(e) => setNewReply(e.target.value)}
                                            style={{ flex: 1, padding: '11px 16px', border: '1.5px solid #E2E8F0', borderRadius: '10px', outline: 'none', fontSize: '13.5px', fontWeight: 500 }}
                                        />
                                        <button 
                                            type="submit" 
                                            className="btn-primary-proton"
                                            style={{ padding: '11px 14px' }}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>

                                {/* Right Section - ERP Information Panels */}
                                <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    
                                    {/* Student Card Info */}
                                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                            Student Details
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                            <div>
                                                <span style={{ color: '#64748B', fontWeight: 600 }}>Name: </span>
                                                <span style={{ fontWeight: 800, color: '#1E293B' }}>{detailQuery.student ? `${detailQuery.student.first_name} ${detailQuery.student.last_name}` : 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#64748B', fontWeight: 600 }}>Proton ID: </span>
                                                <span style={{ fontWeight: 800, color: '#1E293B', fontFamily: 'monospace' }}>{detailQuery.student?.PRO_ID}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#64748B', fontWeight: 600 }}>Phone: </span>
                                                <span style={{ fontWeight: 700, color: '#1E293B' }}>{detailQuery.student?.phone || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#64748B', fontWeight: 600 }}>Email: </span>
                                                <span style={{ fontWeight: 700, color: '#1E293B' }}>{detailQuery.student?.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#64748B', fontWeight: 600 }}>Class: </span>
                                                <span style={{ fontWeight: 800, color: '#E53935' }}>
                                                    {detailQuery.student?.class_enrollments?.[0]?.class.class_name || 'Not Enrolled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Private Internal Notes (Staff only) */}
                                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                            Internal CRM Notes
                                        </h4>
                                        
                                        {/* Notes timeline */}
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '14px' }}>
                                            {detailQuery.internal_notes && detailQuery.internal_notes.length > 0 ? (
                                                detailQuery.internal_notes.map((n) => (
                                                    <div key={n.id} className="internal-note-item">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 800, color: '#B45309' }}>
                                                                {n.user.teacher ? `${n.user.teacher.first_name} ${n.user.teacher.last_name}` : n.user.email}
                                                            </span>
                                                            
                                                            {/* Note operations - admin only */}
                                                            {role === 'admin' && (
                                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setNoteEditingId(n.id);
                                                                            setEditNoteText(n.note);
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                                                                    >
                                                                        <Edit size={12} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteNote(n.id)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {noteEditingId === n.id ? (
                                                            <div>
                                                                <textarea 
                                                                    value={editNoteText}
                                                                    onChange={(e) => setEditNoteText(e.target.value)}
                                                                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #FDE68A', borderRadius: '4px', outline: 'none' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                                                    <button onClick={() => setNoteEditingId(null)} style={{ fontSize: '11px', padding: '2px 6px', background: '#F1F5F9', border: 'none', borderRadius: '4px' }}>Cancel</button>
                                                                    <button onClick={() => handleUpdateNote(n.id)} style={{ fontSize: '11px', padding: '2px 6px', background: '#D97706', color: 'white', border: 'none', borderRadius: '4px' }}>Save</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p style={{ margin: 0, color: '#451A03' }}>{n.note}</p>
                                                        )}
                                                        <span style={{ fontSize: '9px', color: '#D97706', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                                                            {new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No internal notes saved for this enquiry.</p>
                                            )}
                                        </div>

                                        {/* Add Note Form */}
                                        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '6px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Add internal staff note..."
                                                value={newInternalNote}
                                                onChange={(e) => setNewInternalNote(e.target.value)}
                                                style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
                                            />
                                            <button type="submit" className="btn-primary-proton" style={{ padding: '8px 12px', fontSize: '12px', background: '#475569' }}>
                                                Add
                                            </button>
                                        </form>
                                    </div>

                                    {/* Mock Attachments list */}
                                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                                Attachments
                                            </h4>
                                            <button 
                                                onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                                                style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Paperclip size={12} /> Add
                                            </button>
                                        </div>

                                        {showAttachmentInput && (
                                            <form onSubmit={handleAddAttachment} style={{ background: '#F8FAFC', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="File Name (e.g., fee_receipt.pdf)" 
                                                    value={newFileName} 
                                                    onChange={(e) => setNewFileName(e.target.value)}
                                                    style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                                                    required
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="URL (e.g., /uploads/receipt.pdf)" 
                                                    value={newFileUrl} 
                                                    onChange={(e) => setNewFileUrl(e.target.value)}
                                                    style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                                                    required
                                                />
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button type="button" onClick={() => setShowAttachmentInput(false)} style={{ fontSize: '11px', padding: '4px 8px', background: '#E2E8F0', border: 'none', borderRadius: '4px' }}>Cancel</button>
                                                    <button type="submit" style={{ fontSize: '11px', padding: '4px 8px', background: '#E53935', color: 'white', border: 'none', borderRadius: '4px' }}>Attach</button>
                                                </div>
                                            </form>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {detailQuery.attachments && detailQuery.attachments.length > 0 ? (
                                                detailQuery.attachments.map(att => (
                                                    <a 
                                                        key={att.id} 
                                                        href={att.file_url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#475569', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', transition: 'border-color 0.2s' }}
                                                    >
                                                        <FileText size={16} color="#E53935" />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>{att.file_name}</div>
                                                            <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>
                                                                {att.file_size ? `${Math.round(att.file_size / 1024)} KB` : 'Unknown size'}
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))
                                            ) : (
                                                <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No attached documents.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Audit History Timeline */}
                                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: '0 0 12px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                            Enquiry Audit Trail
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {detailQuery.audit_logs && detailQuery.audit_logs.length > 0 ? (
                                                detailQuery.audit_logs.map(log => (
                                                    <div key={log.id} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', marginTop: '4px' }} />
                                                            <div style={{ width: '1px', flex: 1, background: '#E2E8F0', minHeight: '16px' }} />
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{log.details}</p>
                                                            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                                                                {new Date(log.created_at).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No audit trails recorded.</p>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* CREATE ENQUIRY MODAL */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={20} color="#E53935" /> Raise New Enquiry
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateQuery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Subject / Issue Header</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter brief query subject..."
                                    value={newQuerySubject}
                                    onChange={(e) => setNewQuerySubject(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', outline: 'none', fontSize: '13.5px', fontWeight: 500 }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Category</label>
                                    <select 
                                        value={newQueryType}
                                        onChange={(e) => setNewQueryType(e.target.value)}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="academic">Academic</option>
                                        <option value="fees">Fees</option>
                                        <option value="facilities">Facilities</option>
                                        <option value="admissions">Admissions</option>
                                        <option value="operations">Operations</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Priority</label>
                                    <select 
                                        value={newQueryPriority}
                                        onChange={(e) => setNewQueryPriority(e.target.value)}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Target Teacher</label>
                                <select 
                                    value={newQueryTargetTeacher}
                                    onChange={(e) => setNewQueryTargetTeacher(e.target.value)}
                                    className="filter-select"
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Select Target Teacher (Optional)</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{`${t.first_name} ${t.last_name}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Detailed Description</label>
                                <textarea 
                                    placeholder="Provide detailed description about the query/complaint..."
                                    value={newQueryDesc}
                                    onChange={(e) => setNewQueryDesc(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px', outline: 'none', fontSize: '13.5px', fontWeight: 500, resize: 'none' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ background: '#F1F5F9', border: 'none', padding: '11px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submittingQuery}
                                    className="btn-primary-proton"
                                >
                                    {submittingQuery ? <RefreshCw className="spin" size={16} /> : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

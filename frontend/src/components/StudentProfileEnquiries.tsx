import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    MessageSquare, Clock, CheckCircle2, AlertCircle, Search, 
    Plus, Send, Paperclip, Trash2, Edit, RefreshCw, X, AlertOctagon, User, BookOpen, FileText, Check, ExternalLink, Info, AlertTriangle, XCircle
} from 'lucide-react';
import api from '@/lib/api';
import CustomSelect from '@/components/ui/CustomSelect';

interface StudentProfileEnquiriesProps {
    studentId?: string; // Optional: If provided, filters by student. If not provided or 'all', shows all queries.
    role: 'admin' | 'teacher' | 'coordinator';
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

interface QueryAttachment {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    created_at: string;
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
    resolved_by_user?: {
        email: string;
        role: string;
        teacher?: { first_name: string; last_name: string };
    };
    resolution_note?: string;
    target_teacher?: { id: string; first_name: string; last_name: string };
    target_teacher_id?: string;
    attachments?: QueryAttachment[];
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
    const [resolvedDateFilter, setResolvedDateFilter] = useState('all');

    // Solutions and staging attachments states
    const [solutions, setSolutions] = useState<Record<string, string>>({});
    const [stagedFiles, setStagedFiles] = useState<Record<string, Array<{ name: string; url: string }>>>({});
    const [attachingToId, setAttachingToId] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    // Modal to raise new enquiry
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedQueryForDetails, setSelectedQueryForDetails] = useState<StudentQuery | null>(null);
    const [newQuerySubject, setNewQuerySubject] = useState('');
    const [newQueryType, setNewQueryType] = useState('academic');
    const [newQueryPriority, setNewQueryPriority] = useState('medium');
    const [newQueryDesc, setNewQueryDesc] = useState('');
    const [newQueryTargetTeacher, setNewQueryTargetTeacher] = useState('');
    const [newQueryStudentId, setNewQueryStudentId] = useState(studentId && studentId !== 'all' ? studentId : '');
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [submittingQuery, setSubmittingQuery] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type, visible: true });
        toastTimerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000);
    }, []);

    useEffect(() => {
        fetchQueries();
        fetchTeachers();
        if (!studentId || studentId === 'all') {
            fetchStudents();
        }
    }, [studentId]);

    const fetchQueries = async () => {
        try {
            setLoading(true);
            const isSingleStudent = studentId && studentId !== 'all';
            const endpoint = isSingleStudent ? `/queries?student_id=${studentId}` : '/queries';
            const response = await api.get(endpoint);
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

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            if (response.data.success) {
                setStudentsList(response.data.data);
            }
        } catch (err) {
            console.error('Fetch students error:', err);
        }
    };

    const handleCreateQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        const activeStudentId = studentId && studentId !== 'all' ? studentId : newQueryStudentId;
        if (!activeStudentId) {
            showToast('Please select a student.', 'warning');
            return;
        }
        if (!newQuerySubject.trim() || !newQueryDesc.trim()) {
            showToast('Subject and description are required.', 'warning');
            return;
        }

        try {
            setSubmittingQuery(true);
            const payload = {
                student_id: activeStudentId,
                query_type: newQueryType,
                subject: newQuerySubject,
                description: newQueryDesc,
                priority: newQueryPriority,
                target_teacher_id: newQueryTargetTeacher || undefined
            };

            const response = await api.post('/queries', payload);
            if (response.data.success) {
                setShowCreateModal(false);
                setNewQuerySubject('');
                setNewQueryDesc('');
                setNewQueryType('academic');
                setNewQueryPriority('medium');
                setNewQueryTargetTeacher('');
                if (!studentId || studentId === 'all') {
                    setNewQueryStudentId('');
                }
                fetchQueries();
            } else {
                showToast(response.data.message || 'Failed to create enquiry', 'error');
            }
        } catch (err: any) {
            console.error('Create query error:', err);
            showToast(err.response?.data?.message || 'Error creating enquiry', 'error');
        } finally {
            setSubmittingQuery(false);
        }
    };

    const handleAddStagedAttachment = (queryId: string, fileName: string) => {
        const mockUrl = `/uploads/${encodeURIComponent(fileName.toLowerCase().replace(/[^a-z0-9.]/g, '_'))}`;
        const newFile = { name: fileName, url: mockUrl };
        setStagedFiles(prev => ({
            ...prev,
            [queryId]: [...(prev[queryId] || []), newFile]
        }));
        setAttachingToId(null);
    };

    const handleRemoveStagedAttachment = (queryId: string, index: number) => {
        setStagedFiles(prev => {
            const list = [...(prev[queryId] || [])];
            list.splice(index, 1);
            return {
                ...prev,
                [queryId]: list
            };
        });
    };

    const handleResolveQuery = async (queryId: string) => {
        const solutionText = solutions[queryId] || '';
        if (!solutionText.trim()) {
            showToast('Please write a solution before marking the query as resolved.', 'warning');
            return;
        }

        try {
            setResolvingId(queryId);
            
            // First, post any staged attachments if any were added
            const attachmentsToPost = stagedFiles[queryId] || [];
            for (const file of attachmentsToPost) {
                await api.post(`/queries/${queryId}/attachments`, {
                    file_name: file.name,
                    file_url: file.url,
                    file_size: Math.floor(Math.random() * 2000000) + 200000 // mock size
                });
            }

            // Next, update the status to resolved and log the resolution note
            const response = await api.put(`/queries/${queryId}/crm`, {
                status: 'resolved',
                resolution_note: solutionText
            });

            if (response.data.success) {
                // Clear local card state
                setSolutions(prev => {
                    const copy = { ...prev };
                    delete copy[queryId];
                    return copy;
                });
                setStagedFiles(prev => {
                    const copy = { ...prev };
                    delete copy[queryId];
                    return copy;
                });
                fetchQueries();
            } else {
                showToast(response.data.message || 'Failed to resolve enquiry', 'error');
            }
        } catch (err: any) {
            console.error('Resolve query error:', err);
            showToast(err.response?.data?.message || 'Error resolving enquiry', 'error');
        } finally {
            setResolvingId(null);
        }
    };

    // Filter calculations
    const filteredQueries = queries.filter(q => {
        const searchLower = searchQuery.toLowerCase();
        const studentName = q.student ? `${q.student.first_name} ${q.student.last_name}` : '';
        const matchesSearch = 
            (q.subject || '').toLowerCase().includes(searchLower) ||
            (q.query_number || '').toLowerCase().includes(searchLower) ||
            (q.description || '').toLowerCase().includes(searchLower) ||
            studentName.toLowerCase().includes(searchLower) ||
            (q.student?.PRO_ID || '').toLowerCase().includes(searchLower);

        return matchesSearch;
    });

    const activeQueries = filteredQueries.filter(q => q.status !== 'resolved');
    const resolvedQueries = filteredQueries.filter(q => q.status === 'resolved');

    const filteredResolvedQueries = resolvedQueries.filter(q => {
        if (resolvedDateFilter === 'all') return true;
        if (!q.resolved_at) return false;
        
        const resDate = new Date(q.resolved_at);
        const today = new Date();
        
        // Clear times for date comparison
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        if (resolvedDateFilter === 'today') {
            return resDate >= todayStart;
        }
        if (resolvedDateFilter === 'yesterday') {
            return resDate >= yesterdayStart && resDate < todayStart;
        }
        if (resolvedDateFilter === 'week') {
            return resDate >= weekStart;
        }
        if (resolvedDateFilter === 'month') {
            return resDate >= monthStart;
        }
        return true;
    });

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return { bg: '#FEE2E2', color: '#EF4444', border: '#FCA5A5' };
            case 'high':
                return { bg: '#FFEDD5', color: '#EA580C', border: '#FED7AA' };
            case 'medium':
                return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' };
            default:
                return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
        }
    };

    return (
        <div style={{ animationDelay: '200ms' }} className="animate-in">
            {/* CSS STYLES */}
            <style dangerouslySetInnerHTML={{ __html: `
                .crm-header-row {
                    display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
                }
                .crm-search-wrapper {
                    position: relative; flex: 1; min-width: 280px;
                }
                .crm-search-icon {
                    position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94A3B8;
                }
                .crm-search-input {
                    width: 100%; padding: 12px 14px 12px 42px; border: 1.5px solid #E2E8F0; border-radius: 14px;
                    font-size: 14px; outline: none; font-weight: 500; transition: border-color 0.2s; background: white;
                }
                .crm-search-input:focus { border-color: #E53935; }
                
                .btn-raise-enquiry {
                    background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
                    color: white; border: none; padding: 12px 24px; border-radius: 14px;
                    font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;
                    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(229,57,53,0.2);
                }
                .btn-raise-enquiry:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(229,57,53,0.3); }

                .crm-columns-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start;
                }
                @media (max-width: 1024px) {
                    .crm-columns-grid { grid-template-columns: 1fr; }
                }

                .crm-column {
                    background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 24px; padding: 24px; min-height: 600px;
                }
                .crm-column-header {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 12px;
                }
                .crm-column-title {
                    font-size: 18px; fontWeight: 800; color: #1E293B; margin: 0; display: flex; align-items: center; gap: 10px;
                }
                .crm-count-badge {
                    background: #E2E8F0; color: #475569; font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 8px;
                }
                .crm-count-badge.active {
                    background: #FEE2E2; color: #EF4444;
                }
                .crm-count-badge.resolved {
                    background: #D1FAE5; color: #065F46;
                }

                .crm-queries-list {
                    display: flex; flex-direction: column; gap: 20px;
                }

                /* Cards */
                .crm-card {
                    background: white; border: 1px solid #E2E8F0; border-radius: 20px; padding: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.01); transition: all 0.3s ease; position: relative;
                }
                .crm-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.03); }
                
                .crm-card.resolved-state {
                    background: #ECFDF5; border: 1.5px solid #A7F3D0;
                    padding: 14px 18px; border-radius: 16px;
                }
                .crm-card.resolved-state .card-header-row {
                    margin-bottom: 8px;
                }
                .crm-card.resolved-state .resolved-body-text {
                    font-size: 13px; margin-bottom: 10px; color: #064E3B; font-weight: 500; line-height: 1.4;
                }
                .crm-card.resolved-state .solution-block-compact {
                    background: white; border: 1px solid #A7F3D0; border-radius: 12px; padding: 10px 14px; margin-bottom: 10px;
                }
                
                .badge-pill {
                    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;
                }

                .card-header-row {
                    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;
                }
                .student-details {
                    display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; font-weight: 600;
                }
                
                .query-body-text {
                    font-size: 14px; color: #334155; font-weight: 500; line-height: 1.5; margin: 0 0 16px 0; white-space: pre-wrap;
                }
                .resolved-body-text {
                    font-size: 14px; color: #064E3B; font-weight: 500; line-height: 1.5; margin: 0 0 16px 0; white-space: pre-wrap;
                }

                /* Attachment list */
                .attachment-preview-box {
                    display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;
                }
                .attachment-item {
                    display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px;
                    background: #F1F5F9; border: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #475569;
                    cursor: pointer; text-decoration: none; transition: background 0.15s;
                }
                .attachment-item:hover { background: #E2E8F0; }
                .attachment-item.resolved-theme {
                    background: #D1FAE5; border: 1px solid #A7F3D0; color: #065F46;
                }
                .attachment-item.resolved-theme:hover { background: #A7F3D0; }

                /* Solution input */
                .solution-box {
                    background: #FAFBFD; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px; margin-top: 14px;
                }
                .solution-textarea {
                    width: 100%; border: none; background: transparent; outline: none; resize: none;
                    font-size: 13.5px; font-weight: 500; color: #1E293B; line-height: 1.5; height: 75px;
                }
                .solution-actions {
                    display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0;
                    padding-top: 10px; margin-top: 8px; flex-wrap: wrap; gap: 10px;
                }
                
                .btn-action-outline {
                    background: transparent; color: #64748B; border: 1.5px solid #E2E8F0; border-radius: 10px;
                    padding: 8px 14px; font-size: 12.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;
                    cursor: pointer; transition: all 0.2s;
                }
                .btn-action-outline:hover { background: #F1F5F9; color: #1E293B; border-color: #CBD5E1; }

                .btn-resolve-query {
                    background: #059669; color: white; border: none; border-radius: 10px;
                    padding: 8px 16px; font-size: 12.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;
                    cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(5,150,105,0.2);
                }
                .btn-resolve-query:hover { background: #047857; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(5,150,105,0.3); }

                /* Raised Query Modal */
                .modal-overlay-new {
                    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
                    z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 20px;
                }
                .modal-content-new {
                    background: white; border-radius: 24px; width: 100%; max-width: 550px; padding: 28px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid #E2E8F0;
                }
                
                .attachment-quick-selector {
                    background: #FAFBFD; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 12px; margin-top: 10px;
                    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
                }
                .quick-file-btn {
                    background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 10px;
                    font-size: 11.5px; font-weight: 600; text-align: left; color: #475569; cursor: pointer;
                    display: flex; align-items: center; gap: 6px; transition: background 0.15s;
                }
                .quick-file-btn:hover { background: #F1F5F9; }

                /* Toast Notification */
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .toast-notification {
                    position: fixed; bottom: 32px; right: 32px; z-index: 9999;
                    display: flex; align-items: center; gap: 12px;
                    padding: 16px 24px; border-radius: 16px;
                    font-size: 14px; font-weight: 600;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                    backdrop-filter: blur(10px);
                    max-width: 440px; min-width: 300px;
                    pointer-events: auto;
                }
                .toast-notification.toast-enter {
                    animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .toast-notification.toast-exit {
                    animation: toastSlideOut 0.3s ease-in forwards;
                }
                .toast-notification.toast-success {
                    background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
                    border: 1.5px solid #6EE7B7; color: #065F46;
                }
                .toast-notification.toast-error {
                    background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
                    border: 1.5px solid #FCA5A5; color: #991B1B;
                }
                .toast-notification.toast-warning {
                    background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
                    border: 1.5px solid #FCD34D; color: #92400E;
                }
                .toast-close-btn {
                    background: none; border: none; cursor: pointer; padding: 2px;
                    color: inherit; opacity: 0.6; transition: opacity 0.15s; flex-shrink: 0;
                }
                .toast-close-btn:hover { opacity: 1; }
            ` }} />

            {/* HEADER SEARCH AND ACTION ROW */}
            <div className="crm-header-row">
                <div className="crm-search-wrapper">
                    <Search className="crm-search-icon" size={16} />
                    <input 
                        type="text" 
                        placeholder={studentId && studentId !== 'all' ? "Search this student's enquiries..." : "Search all student queries..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="crm-search-input"
                    />
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="btn-raise-enquiry"
                >
                    <Plus size={16} /> Raise Student Query
                </button>
            </div>

            {/* MAIN TWO-COLUMN CRM SPLIT PANEL */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <RefreshCw size={36} className="spin" color="#E53935" />
                    <p style={{ color: '#64748B', fontWeight: 600, marginTop: '14px' }}>Loading support CRM dashboard...</p>
                </div>
            ) : error ? (
                <div style={{ border: '1px solid #FCA5A5', background: '#FEF2F2', padding: '16px', borderRadius: '14px', color: '#DC2626', fontWeight: 600 }}>
                    {error}
                </div>
            ) : (
                <div className="crm-columns-grid">
                    
                    {/* LEFT COLUMN: ACTIVE QUERIES */}
                    <div className="crm-column">
                        <div className="crm-column-header">
                            <h3 className="crm-column-title">
                                <AlertCircle size={20} color="#EF4444" /> Active Queries
                            </h3>
                            <span className="crm-count-badge active">{activeQueries.length} Tickets</span>
                        </div>

                        <div className="crm-queries-list">
                            {activeQueries.length > 0 ? (
                                activeQueries.map(q => {
                                    const prio = getPriorityStyle(q.priority);
                                    const draftSol = solutions[q.id] || '';
                                    const staged = stagedFiles[q.id] || [];

                                    return (
                                        <div key={q.id} className="crm-card">
                                            <div className="card-header-row">
                                                <div>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color: '#64748B', display: 'block', marginBottom: '2px' }}>
                                                        {q.query_number}
                                                    </span>
                                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                                        {q.subject}
                                                    </h4>
                                                </div>
                                                <span className="badge-pill" style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
                                                    {q.priority}
                                                </span>
                                            </div>

                                            <p className="query-body-text">{q.description}</p>

                                            {/* Original Query Attachments */}
                                            {q.attachments && q.attachments.length > 0 && (
                                                <div className="attachment-preview-box">
                                                    {q.attachments.map(att => (
                                                        <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" className="attachment-item">
                                                            <FileText size={13} /> {att.file_name} <ExternalLink size={10} />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Card Footer Detail Row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '10px' }}>
                                                <div className="student-details">
                                                    <User size={13} />
                                                    <span>
                                                        {q.student ? `${q.student.first_name} ${q.student.last_name}` : 'Student'} ({q.student?.PRO_ID || 'PRO'})
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                                                    {new Date(q.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* CRM SOLUTION WRITER WORKSPACE */}
                                            <div className="solution-box">
                                                <textarea 
                                                    placeholder="Type the solution / reply details here..."
                                                    value={draftSol}
                                                    onChange={(e) => setSolutions(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                    className="solution-textarea"
                                                />

                                                {/* Staged Uploads Row */}
                                                {staged.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 12px 0' }}>
                                                        {staged.map((file, i) => (
                                                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
                                                                <FileText size={11} /> {file.name}
                                                                <button onClick={() => handleRemoveStagedAttachment(q.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontWeight: 800, padding: 0 }}>&times;</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="solution-actions">
                                                    <div style={{ position: 'relative' }}>
                                                        <button 
                                                            onClick={() => setAttachingToId(attachingToId === q.id ? null : q.id)}
                                                            className="btn-action-outline"
                                                        >
                                                            <Paperclip size={13} /> Attach File
                                                        </button>
                                                        
                                                        {/* Simulated File Selection Dropdown */}
                                                        {attachingToId === q.id && (
                                                            <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, width: '220px' }}>
                                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.03em' }}>Select Mock File</span>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {[
                                                                        'screenshot_error.png',
                                                                        'correction_doc.pdf',
                                                                        'receipt_payment.pdf',
                                                                        'syllabus_note.docx'
                                                                    ].map(fname => (
                                                                        <button key={fname} onClick={() => handleAddStagedAttachment(q.id, fname)} className="quick-file-btn">
                                                                            <FileText size={11} /> {fname}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button 
                                                        onClick={() => handleResolveQuery(q.id)}
                                                        disabled={resolvingId === q.id}
                                                        className="btn-resolve-query"
                                                    >
                                                        {resolvingId === q.id ? (
                                                            <>
                                                                <RefreshCw size={13} className="spin" /> Resolving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={13} strokeWidth={3} /> Mark as Resolved
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '20px', border: '1px dashed #E2E8F0' }}>
                                    <MessageSquare size={36} color="#94A3B8" style={{ marginBottom: '12px' }} />
                                    <h4 style={{ fontSize: '15px', color: '#1E293B', fontWeight: 700, margin: '0 0 4px 0' }}>No Active Queries</h4>
                                    <p style={{ color: '#64748B', fontSize: '12.5px', margin: 0 }}>All queries for this view have been solved.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RESOLVED QUERIES */}
                    <div className="crm-column">
                        <div className="crm-column-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                            <h3 className="crm-column-title">
                                <CheckCircle2 size={20} color="#059669" /> Resolved Queries
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ minWidth: '150px' }}>
                                    <CustomSelect
                                        value={resolvedDateFilter}
                                        onChange={val => setResolvedDateFilter(val)}
                                        options={[
                                            { value: 'all', label: 'All Dates' },
                                            { value: 'today', label: 'Resolved Today' },
                                            { value: 'yesterday', label: 'Resolved Yesterday' },
                                            { value: 'week', label: 'Past 7 Days' },
                                            { value: 'month', label: 'This Month' }
                                        ]}
                                    />
                                </div>
                                <span className="crm-count-badge resolved">{filteredResolvedQueries.length}</span>
                            </div>
                        </div>

                        <div className="crm-queries-list">
                            {filteredResolvedQueries.length > 0 ? (
                                filteredResolvedQueries.map(q => {
                                    return (
                                        <div key={q.id} onClick={() => setSelectedQueryForDetails(q)} style={{ cursor: 'pointer' }} className="crm-card resolved-state animate-in">
                                            <div className="card-header-row">
                                                <div>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', color: '#047857', display: 'block', marginBottom: '2px' }}>
                                                        {q.query_number}
                                                    </span>
                                                    <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                                                        {q.subject}
                                                    </h4>
                                                </div>
                                                <span className="badge-pill" style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 6px', fontSize: '9.5px' }}>
                                                    Resolved
                                                </span>
                                            </div>

                                            <p className="resolved-body-text">{q.description}</p>

                                            {/* Solution Block */}
                                            <div className="solution-block-compact">
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Solution Provided</span>
                                                <p style={{ fontSize: '12px', color: '#064E3B', fontWeight: 600, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                    {q.resolution_note || 'Resolved successfully.'}
                                                </p>
                                            </div>

                                            {/* Resolution File / Attachments Preview */}
                                            {q.attachments && q.attachments.length > 0 && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Attachments</span>
                                                    <div className="attachment-preview-box" style={{ gap: '4px', marginBottom: '8px' }}>
                                                           {q.attachments.map(att => (
                                                            <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="attachment-item resolved-theme" style={{ padding: '4px 8px', fontSize: '10.5px' }}>
                                                                <FileText size={11} /> {att.file_name} <ExternalLink size={8} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Card Footer Detail Row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #A7F3D0', paddingTop: '8px', marginTop: '8px' }}>
                                                <div className="student-details" style={{ color: '#065F46', fontSize: '11.5px' }}>
                                                    <User size={11} />
                                                    <span>
                                                        {q.student ? `${q.student.first_name} ${q.student.last_name}` : 'Student'}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#047857', fontWeight: 600 }}>
                                                    Resolved: {q.resolved_at ? new Date(q.resolved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recently'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(236,253,245,0.3)', borderRadius: '20px', border: '1px dashed #A7F3D0' }}>
                                    <CheckCircle2 size={36} color="#A7F3D0" style={{ marginBottom: '12px' }} />
                                    <h4 style={{ fontSize: '15px', color: '#064E3B', fontWeight: 700, margin: '0 0 4px 0' }}>No Resolved Queries</h4>
                                    <p style={{ color: '#047857', fontSize: '12.5px', margin: 0 }}>Resolved student logs will accumulate in this column.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* MODAL TO RAISE NEW STUDENT QUERY */}
            {showCreateModal && (
                <div className="modal-overlay-new" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content-new" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Raise Support Ticket</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateQuery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Student Selector if in Global CRM view */}
                            {(!studentId || studentId === 'all') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Select Student</label>
                                    <CustomSelect
                                        value={newQueryStudentId}
                                        onChange={val => setNewQueryStudentId(val)}
                                        placeholder="-- Choose Student --"
                                        required
                                        options={studentsList.map(s => ({
                                            value: s.id,
                                            label: `${s.first_name} ${s.last_name} (${s.PRO_ID})`
                                        }))}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Query Category</label>
                                <CustomSelect
                                    value={newQueryType}
                                    onChange={val => setNewQueryType(val)}
                                    options={[
                                        { value: 'academic', label: 'Academic' },
                                        { value: 'fees', label: 'Fees' },
                                        { value: 'facilities', label: 'Facilities' },
                                        { value: 'admissions', label: 'Admissions' },
                                        { value: 'operations', label: 'Operations' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Urgency Priority</label>
                                <CustomSelect
                                    value={newQueryPriority}
                                    onChange={val => setNewQueryPriority(val)}
                                    options={[
                                        { value: 'low', label: 'Low' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'high', label: 'High' },
                                        { value: 'urgent', label: 'Urgent' }
                                    ]}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Subject Heading</label>
                                <input
                                    type="text"
                                    placeholder="Brief subject (e.g. Leave application request)"
                                    value={newQuerySubject}
                                    onChange={(e) => setNewQuerySubject(e.target.value)}
                                    style={{ padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', outline: 'none', fontWeight: 500 }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Detailed Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe the enquiry issue details here..."
                                    value={newQueryDesc}
                                    onChange={(e) => setNewQueryDesc(e.target.value)}
                                    style={{ padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', outline: 'none', resize: 'none', fontFamily: 'inherit', fontWeight: 500 }}
                                    required
                                />
                            </div>

                             {/* Reassignment: Admin or Coordinator */}
                            {(role === 'admin' || role === 'coordinator') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Assign Teacher (Optional)</label>
                                    <CustomSelect
                                        value={newQueryTargetTeacher}
                                        onChange={val => setNewQueryTargetTeacher(val)}
                                        placeholder="Unassigned"
                                        options={teachers.map(t => ({
                                            value: t.id,
                                            label: `${t.first_name} ${t.last_name}`
                                        }))}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submittingQuery}
                                style={{
                                    background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                                    color: 'white', border: 'none', borderRadius: '12px', padding: '12px',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    marginTop: '8px'
                                }}
                            >
                                {submittingQuery ? (
                                    <>
                                        <RefreshCw size={16} className="spin" /> Submitting Ticket...
                                    </>
                                ) : (
                                    <>
                                        Raise Query
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            )}

            {/* RESOLVED QUERY DETAILS MODAL */}
            {selectedQueryForDetails && (
                <div className="modal-overlay-new" onClick={() => setSelectedQueryForDetails(null)}>
                    <div className="modal-content-new custom-scrollbar" onClick={(e) => e.stopPropagation()} style={{ 
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
                            <div>
                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, fontFamily: 'monospace', display: 'block', marginBottom: '4px' }}>
                                    Ticket ID: {selectedQueryForDetails.query_number}
                                </span>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Ticket Details</h3>
                            </div>
                            <button onClick={() => setSelectedQueryForDetails(null)} 
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

                        {/* Two Column Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', alignItems: 'start' }}>
                            
                            {/* LEFT COLUMN: QUERY DETAILS & STUDENT INFO */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Student info card */}
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: '#E2E8F0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
                                        <User size={18} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: '2px', letterSpacing: '0.05em' }}>Student Info</span>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedQueryForDetails.student ? `${selectedQueryForDetails.student.first_name} ${selectedQueryForDetails.student.last_name}` : 'Student'}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            PRO ID: {selectedQueryForDetails.student?.PRO_ID || 'N/A'} | Phone: {selectedQueryForDetails.student?.phone || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Status</span>
                                        <span style={{ 
                                            fontSize: '10px', fontWeight: 800, color: selectedQueryForDetails.status === 'resolved' ? '#059669' : '#EF4444',
                                            background: selectedQueryForDetails.status === 'resolved' ? '#ECFDF5' : '#FEF2F2', padding: '2px 6px', borderRadius: '6px', display: 'inline-block', textTransform: 'uppercase'
                                        }}>
                                            {selectedQueryForDetails.status}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Category</span>
                                        <span style={{ fontSize: '11px', color: '#1A1D3B', fontWeight: 700, textTransform: 'capitalize', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {selectedQueryForDetails.query_type}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Date</span>
                                        <span style={{ fontSize: '11px', color: '#1A1D3B', fontWeight: 700, display: 'block' }}>
                                            {selectedQueryForDetails.created_at ? new Date(selectedQueryForDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Query subject & description */}
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Category Subject & Text</span>
                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>{selectedQueryForDetails.subject}</h4>
                                    <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '16px', borderLeft: '4px solid #CBD5E1', borderTop: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                                        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                                            {selectedQueryForDetails.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: RESOLUTION SUMMARY & ATTACHMENTS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {selectedQueryForDetails.resolution_note && (
                                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)', borderRadius: '24px', border: '1px solid #A7F3D0', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.03)' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 950, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Resolution Provided</span>
                                        <p style={{ fontSize: '14px', color: '#064E3B', fontWeight: 600, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {selectedQueryForDetails.resolution_note}
                                        </p>
                                        <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600, display: 'block', marginTop: '12px' }}>
                                            Resolved: {selectedQueryForDetails.resolved_at ? new Date(selectedQueryForDetails.resolved_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                        </span>
                                    </div>
                                )}

                                {selectedQueryForDetails.attachments && selectedQueryForDetails.attachments.length > 0 && (
                                    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F7FF 100%)', borderRadius: '24px', border: '1px solid #C7D2FE', boxShadow: '0 4px 15px rgba(79, 96, 255, 0.03)' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 950, color: '#4F60FF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>Resolution Attachments</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {selectedQueryForDetails.attachments.map((att) => {
                                                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
                                                return (
                                                    <div key={att.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <a href={att.file_url} target="_blank" rel="noopener noreferrer" 
                                                            className="attachment-item resolved-theme" 
                                                            style={{ 
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                                                padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', 
                                                                fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                                                transition: 'all 0.2s ease',
                                                                color: '#4F60FF',
                                                                background: '#FFFFFF',
                                                                borderColor: '#C7D2FE'
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B' }}>
                                                                <FileText size={16} color="#4F60FF" />
                                                                {att.file_name}
                                                            </span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4F60FF', fontWeight: 800 }}>
                                                                Open File <ExternalLink size={12} />
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

                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toast.message && (
                <div 
                    className={`toast-notification toast-${toast.type} ${toast.visible ? 'toast-enter' : 'toast-exit'}`}
                    onAnimationEnd={() => { if (!toast.visible) setToast(prev => ({ ...prev, message: '' })); }}
                >
                    {toast.type === 'success' && <CheckCircle2 size={20} style={{ flexShrink: 0 }} />}
                    {toast.type === 'error' && <XCircle size={20} style={{ flexShrink: 0 }} />}
                    {toast.type === 'warning' && <AlertTriangle size={20} style={{ flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button className="toast-close-btn" onClick={() => setToast(prev => ({ ...prev, visible: false }))}>
                        <X size={16} />
                    </button>
                </div>
            )}

        </div>
    );
}

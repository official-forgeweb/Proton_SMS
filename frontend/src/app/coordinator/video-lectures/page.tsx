'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  Video, Trash2, Search, AlertTriangle, Database, 
  RefreshCw, Settings, FileSpreadsheet, CheckCircle, 
  XCircle, Clock, Calendar, ExternalLink, Plus, Edit3, X, Info
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { customAlert, customConfirm } from '@/utils/dialog';

export default function CoordinatorVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    
    // UI states
    const [activeTab, setActiveTab] = useState<'lectures' | 'sources' | 'logs'>('lectures');
    const [isLoading, setIsLoading] = useState(true);
    const [isLogsLoading, setIsLogsLoading] = useState(true);
    const [isSourcesLoading, setIsSourcesLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
    const [isSavingSource, setIsSavingSource] = useState(false);

    const [filters, setFilters] = useState({ class_id: '', subject: '', date: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

    // Details Modal
    const [selectedLecture, setSelectedLecture] = useState<any | null>(null);

    // Source Form
    const [showSourceForm, setShowSourceForm] = useState(false);
    const [editingSource, setEditingSource] = useState<any | null>(null);

    // Excel Upload states (Legacy backup support)
    const [isUploading, setIsUploading] = useState(false);
    const [uploadReport, setUploadReport] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const defaultMapping = {
        date: 'Date',
        time: 'Time',
        class: 'Class',
        subject: 'Subject',
        video_url: 'Link',
        title: 'Title',
        teacher_name: 'Teacher',
        description: 'Description',
        topic: 'Topic',
        chapter: 'Chapter',
        notes: 'Notes',
        id: 'ID'
    };

    const [sourceForm, setSourceForm] = useState({
        name: '',
        spreadsheet_id: '',
        sheet_name: 'Videos',
        is_enabled: true,
        column_mapping: defaultMapping
    });

    useEffect(() => {
        fetchClasses();
        fetchSources();
        fetchSyncLogs();
    }, []);

    useEffect(() => {
        fetchLectures();
    }, [filters]);

    const fetchSources = async () => {
        try {
            setIsSourcesLoading(true);
            const res = await api.get('/video-lectures/sources');
            setSources(res.data.data);
        } catch (error) {
            console.error('Failed to fetch sources', error);
        } finally {
            setIsSourcesLoading(false);
        }
    };

    const fetchSyncLogs = async () => {
        try {
            setIsLogsLoading(true);
            const res = await api.get('/video-lectures/sync-logs');
            setSyncLogs(res.data.data);
        } catch (error) {
            console.error('Failed to fetch sync logs', error);
        } finally {
            setIsLogsLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchLectures = async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (filters.class_id) params.class_id = filters.class_id;
            if (filters.subject) params.subject = filters.subject;
            if (filters.date) params.date = filters.date;

            const res = await api.get('/video-lectures', { params });
            setLectures(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncAll = async () => {
        try {
            setIsSyncing(true);
            const res = await api.post('/video-lectures/sync');
            const summary = res.data;
            let msg = 'Sync Completed Successfully!\n';
            if (summary.results && Array.isArray(summary.results)) {
                summary.results.forEach((r: any) => {
                    msg += `\n• Source: ${r.sourceName}\n  - Processed: ${r.processed}\n  - Created: ${r.created}\n  - Updated: ${r.updated}\n  - Deleted: ${r.deleted}\n  - Failed: ${r.failed}`;
                });
            } else {
                msg += '\nSync task triggered successfully.';
            }
            customAlert(msg, 'Synchronization Complete');
            fetchLectures();
            fetchSyncLogs();
            fetchSources();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Manual synchronization failed.';
            customAlert(msg, 'Sync Failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncSource = async (id: string) => {
        try {
            setSyncingSourceId(id);
            const res = await api.post(`/video-lectures/sources/${id}/sync`);
            const result = res.data;
            const msg = `Sync Complete!\n\n• Processed: ${result.processed}\n• Created: ${result.created}\n• Updated: ${result.updated}\n• Deleted: ${result.deleted}\n• Failed: ${result.failed}`;
            customAlert(msg, 'Sync Status');
            fetchLectures();
            fetchSyncLogs();
            fetchSources();
        } catch (error: any) {
            console.error(error);
            customAlert(error.response?.data?.message || 'Synchronization failed.', 'Sync Error');
        } finally {
            setSyncingSourceId(null);
        }
    };

    const handleOpenAddSource = () => {
        setEditingSource(null);
        setSourceForm({
            name: '',
            spreadsheet_id: '',
            sheet_name: 'Videos',
            is_enabled: true,
            column_mapping: defaultMapping
        });
        setShowSourceForm(true);
    };

    const handleOpenEditSource = (source: any) => {
        setEditingSource(source);
        setSourceForm({
            name: source.name,
            spreadsheet_id: source.spreadsheet_id,
            sheet_name: source.sheet_name || 'Videos',
            is_enabled: source.is_enabled,
            column_mapping: { ...defaultMapping, ...(source.column_mapping || {}) }
        });
        setShowSourceForm(true);
    };

    const handleSaveSource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSavingSource(true);
            if (editingSource) {
                await api.put(`/video-lectures/sources/${editingSource.id}`, sourceForm);
            } else {
                await api.post('/video-lectures/sources', sourceForm);
            }
            setShowSourceForm(false);
            setEditingSource(null);
            fetchSources();
            customAlert('Source configuration saved successfully!', 'Success');
        } catch (error: any) {
            console.error(error);
            customAlert(error.response?.data?.message || 'Failed to save source configuration.', 'Error');
        } finally {
            setIsSavingSource(false);
        }
    };

    const handleDeleteSource = async (id: string) => {
        if (!await customConfirm('Are you sure you want to delete this source configuration? Synced lectures will remain in the database but will no longer auto-sync.', 'Confirm Deletion')) return;
        try {
            await api.delete(`/video-lectures/sources/${id}`);
            fetchSources();
        } catch (error) {
            console.error(error);
            customAlert('Failed to delete source.', 'Error');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!await customConfirm(`Are you sure you want to delete ${selectedIds.size} lectures manually? Note: They will be re-created if they still exist in the Google Sheet.`, 'Confirm Bulk Deletion')) return;

        try {
            await api.delete('/video-lectures/bulk', { data: { ids: Array.from(selectedIds) } });
            setSelectedIds(new Set());
            fetchLectures();
        } catch (error) {
            await customAlert('Delete failed', 'Error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await customConfirm('Are you sure you want to delete this lecture? Note: It will be re-created if it still exists in the Google Sheet.', 'Confirm Deletion')) return;
        try {
            await api.delete(`/video-lectures/${id}`);
            fetchLectures();
        } catch (error) {
            await customAlert('Delete failed', 'Error');
        }
    };

    // Audit logs deletions
    const handleClearAllLogs = async () => {
        if (!await customConfirm('Are you sure you want to clear all sync logs? This does not delete any video lecture records.', 'Clear Logs')) return;
        try {
            await api.delete('/video-lectures/sync-logs/all');
            fetchSyncLogs();
        } catch (error) {
            customAlert('Failed to clear logs.', 'Error');
        }
    };

    const handleClearFailedLogs = async () => {
        if (!await customConfirm('Are you sure you want to clear failed sync logs?', 'Clear Failed Logs')) return;
        try {
            await api.delete('/video-lectures/sync-logs/failed');
            fetchSyncLogs();
        } catch (error) {
            customAlert('Failed to clear failed logs.', 'Error');
        }
    };

    const handleClearSuccessLogs = async () => {
        if (!await customConfirm('Are you sure you want to clear successful sync logs?', 'Clear Success Logs')) return;
        try {
            await api.delete('/video-lectures/sync-logs/success');
            fetchSyncLogs();
        } catch (error) {
            customAlert('Failed to clear successful logs.', 'Error');
        }
    };

    const handleBulkDeleteLogs = async () => {
        if (selectedLogIds.size === 0) return;
        if (!await customConfirm(`Are you sure you want to delete ${selectedLogIds.size} sync logs?`, 'Bulk Delete Logs')) return;
        try {
            await api.delete('/video-lectures/sync-logs/bulk', { data: { ids: Array.from(selectedLogIds) } });
            setSelectedLogIds(new Set());
            fetchSyncLogs();
        } catch (error) {
            customAlert('Failed to delete selected logs.', 'Error');
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!await customConfirm('Are you sure you want to delete this sync log?', 'Delete Log')) return;
        try {
            await api.delete(`/video-lectures/sync-logs/${id}`);
            fetchSyncLogs();
        } catch (error) {
            customAlert('Failed to delete log.', 'Error');
        }
    };

    // Legacy backup manual Excel upload support
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('preview', 'true'); 

        try {
            setIsUploading(true);
            setUploadReport(null);
            const res = await api.post('/video-lectures/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.data.previewRecords) {
                setPreviewData(res.data.data);
            }
        } catch (error: any) {
            await customAlert(error.response?.data?.message || 'Upload failed', 'Upload Error');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirmUpload = async () => {
        if (!previewData?.previewRecords) return;
        try {
            setIsUploading(true);
            const res = await api.post('/video-lectures/confirm-upload', { records: previewData.previewRecords });
            setPreviewData(null);
            setUploadReport({ 
                ...previewData, 
                inserted: res.data.data.inserted, 
                skipped: res.data.data.skipped, 
                errors: [...previewData.errors, ...res.data.data.errors] 
            });
            fetchLectures();
        } catch (error: any) {
            await customAlert('Failed to confirm upload', 'Upload Confirmation Error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCancelUpload = () => {
        setPreviewData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === lectures.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(lectures.map(l => l.id)));
    };

    const toggleSelectLog = (id: string) => {
        const newSet = new Set(selectedLogIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedLogIds(newSet);
    };

    const toggleSelectAllLogs = () => {
        if (selectedLogIds.size === syncLogs.length) setSelectedLogIds(new Set());
        else setSelectedLogIds(new Set(syncLogs.map(l => l.id)));
    };

    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ paddingBottom: '40px' }}>
                
                {/* 1. Page Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Poppins, sans-serif' }}>
                            <Video size={28} color="#4F60FF" /> Content Sync Center
                        </h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Automate student video lectures by synchronizing dynamic data models directly from Google Sheets.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: '#FFFFFF', color: '#1A1D3B', border: '1.5px solid #E2E8F0',
                                padding: '12px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <FileSpreadsheet size={18} /> Upload Excel Backup
                        </button>

                        <button 
                            onClick={handleSyncAll}
                            disabled={isSyncing || sources.filter(s => s.is_enabled).length === 0}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: isSyncing ? '#A1A5B7' : 'linear-gradient(135deg, #4F60FF 0%, #3144E5 100%)',
                                color: 'white', border: 'none', padding: '12px 24px',
                                borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                boxShadow: isSyncing ? 'none' : '0 4px 15px rgba(79, 96, 255, 0.3)',
                                transition: 'all 0.2s', cursor: (isSyncing || sources.filter(s => s.is_enabled).length === 0) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <RefreshCw size={18} className={isSyncing ? 'spin' : ''} style={{ animation: isSyncing ? 'spin 1.5s linear infinite' : 'none' }} />
                            {isSyncing ? 'Syncing...' : 'Sync All Sources'}
                        </button>
                    </div>
                </div>

                {uploadReport && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#1A1D3B' }}>Excel Upload Report</h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: uploadReport.errors.length > 0 ? '20px' : '0' }}>
                            <div style={{ background: '#ECFDF5', color: '#10B981', padding: '12px 20px', borderRadius: '12px', fontWeight: 700 }}>
                                <span style={{ fontSize: '24px' }}>{uploadReport.inserted}</span> Inserted
                            </div>
                            <div style={{ background: '#FFFBEB', color: '#F59E0B', padding: '12px 20px', borderRadius: '12px', fontWeight: 700 }}>
                                <span style={{ fontSize: '24px' }}>{uploadReport.skipped}</span> Skipped
                            </div>
                            <div style={{ background: '#EEF0FF', color: '#4F60FF', padding: '12px 20px', borderRadius: '12px', fontWeight: 700 }}>
                                <span style={{ fontSize: '24px' }}>{uploadReport.total}</span> Total Processed
                            </div>
                        </div>
                        {uploadReport.errors.length > 0 && (
                            <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '16px', border: '1px solid #FEE2E2', maxHeight: '200px', overflowY: 'auto' }}>
                                <div style={{ color: '#EF4444', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} /> Row Errors ({uploadReport.errors.length})</div>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#B91C1C' }}>
                                    {uploadReport.errors.map((e: any, i: number) => (
                                        <li key={i}>Row {e.row}: {e.reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {previewData && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                        <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '800px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>Preview Excel Upload</h2>
                            <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '24px' }}>Verify parsed records before updating system nodes.</p>

                            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '24px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Class</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Subject</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.previewRecords.map((r: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #F1F1F4' }}>
                                                <td style={{ padding: '12px', fontWeight: 700 }}>{r.class_name || 'N/A'}</td>
                                                <td style={{ padding: '12px', color: '#4F60FF' }}>{r.subject}</td>
                                                <td style={{ padding: '12px' }}>{r.date}</td>
                                                <td style={{ padding: '12px' }}>{r.time}</td>
                                                <td style={{ padding: '12px', color: '#8F92A1', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.video_url}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={handleCancelUpload} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}>Cancel</button>
                                <button onClick={handleConfirmUpload} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, background: '#4F60FF', border: 'none', color: 'white', cursor: 'pointer' }}>Confirm & Write Records</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Controls */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '0px', marginBottom: '24px' }}>
                    <button 
                        onClick={() => setActiveTab('lectures')}
                        style={{
                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                            background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                            color: activeTab === 'lectures' ? '#4F60FF' : '#5E6278',
                            borderBottom: activeTab === 'lectures' ? '3px solid #4F60FF' : '3px solid transparent',
                            transition: 'all 0.2s', paddingBottom: '14px'
                        }}
                    >
                        Live Lectures ({lectures.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('sources')}
                        style={{
                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                            background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                            color: activeTab === 'sources' ? '#4F60FF' : '#5E6278',
                            borderBottom: activeTab === 'sources' ? '3px solid #4F60FF' : '3px solid transparent',
                            transition: 'all 0.2s', paddingBottom: '14px'
                        }}
                    >
                        Sync Sources ({sources.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        style={{
                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                            background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
                            color: activeTab === 'logs' ? '#4F60FF' : '#5E6278',
                            borderBottom: activeTab === 'logs' ? '3px solid #4F60FF' : '3px solid transparent',
                            transition: 'all 0.2s', paddingBottom: '14px'
                        }}
                    >
                        Audit History ({syncLogs.length})
                    </button>
                </div>

                {/* TAB 1: LECTURES LIST */}
                {activeTab === 'lectures' && (
                    <>
                        {/* Filter Panel */}
                        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px', background: '#FFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', padding: '0 16px' }}>
                                <Search size={20} color="#8F92A1" />
                                <input 
                                    type="text" 
                                    list="subject-options"
                                    placeholder="Search or Select Subject..." 
                                    value={filters.subject} 
                                    onChange={e => setFilters({ ...filters, subject: e.target.value })}
                                    style={{ padding: '12px 12px', border: 'none', outline: 'none', fontSize: '14px', flex: 1, background: 'transparent' }}
                                />
                                <datalist id="subject-options">
                                    {Array.from(new Set(classes.flatMap(c => (filters.class_id && c.id !== filters.class_id) ? [] : (c.schedule?.map((s: any) => s.subject).filter(Boolean) || [])))).map((subj: any, i) => (
                                        <option key={i} value={subj} />
                                    ))}
                                </datalist>
                            </div>
                            
                            <select 
                                value={filters.class_id} 
                                onChange={e => setFilters({ ...filters, class_id: e.target.value, subject: '' })}
                                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, minWidth: '150px' }}
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                            
                            <div style={{ flexShrink: 0, width: '180px' }}>
                                <DatePicker
                                    selected={filters.date ? new Date(filters.date) : null}
                                    onChange={(date: Date | null) => setFilters({ ...filters, date: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="MMMM d, yyyy"
                                    placeholderText="Filter by Date..."
                                    customInput={<input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />}
                                    isClearable={true}
                                    showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                />
                            </div>

                            {selectedIds.size > 0 && (
                                <button 
                                    onClick={handleBulkDelete} 
                                    style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Trash2 size={16} /> Delete ({selectedIds.size})
                                </button>
                            )}
                        </div>

                        {/* Live Records Table */}
                        <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                            {isLoading ? (
                                <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />)}</div>
                            ) : lectures.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <Video size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                                    <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '18px' }}>No Lectures Found</h3>
                                    <p style={{ margin: 0, color: '#8F92A1', fontSize: '14px' }}>
                                        Create a Google Sheet Source in the next tab and run synchronization.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #F1F1F4' }}>
                                                <th style={{ padding: '16px 12px', textAlign: 'left', width: '40px' }}>
                                                    <input type="checkbox" checked={selectedIds.size === lectures.length && lectures.length > 0} onChange={toggleSelectAll} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                                </th>
                                                <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Class</th>
                                                <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Subject</th>
                                                <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Lecture Details</th>
                                                <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Video Preview</th>
                                                <th style={{ padding: '16px 12px', textAlign: 'right', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lectures.map(lecture => (
                                                <tr key={lecture.id} style={{ borderBottom: '1px solid #F1F1F4' }}>
                                                    <td style={{ padding: '16px 12px' }}>
                                                        <input type="checkbox" checked={selectedIds.has(lecture.id)} onChange={() => toggleSelect(lecture.id)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                                    </td>
                                                    <td style={{ padding: '16px 12px', fontWeight: 700, color: '#1A1D3B', fontSize: '14px' }}>
                                                        {lecture.class_name || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px 12px', fontWeight: 600, color: '#4F60FF', fontSize: '14px' }}>
                                                        {lecture.subject}
                                                    </td>
                                                    <td style={{ padding: '16px 12px', color: '#5E6278', fontSize: '14px' }}>
                                                        <div style={{ fontWeight: 700, color: '#1A1D3B' }}>{lecture.title}</div>
                                                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '12px' }}>
                                                            <span><strong>Date:</strong> {lecture.date}</span>
                                                            <span><strong>Time:</strong> {lecture.time}</span>
                                                            {lecture.teacher_name && <span><strong>Teacher:</strong> {lecture.teacher_name}</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 12px' }}>
                                                        {(() => {
                                                            const videoId = getYouTubeId(lecture.video_url);
                                                            return (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div 
                                                                        onClick={() => setSelectedLecture(lecture)}
                                                                        style={{ position: 'relative', width: '100px', aspectRatio: '16/9', background: '#F1F1F4', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #E2E8F0' }}
                                                                    >
                                                                        {videoId ? (
                                                                            <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        ) : (
                                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} color="#A1A5B7" /></div>
                                                                        )}
                                                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <div style={{ background: '#E53935', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                <Video size={10} color="#FFF" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setSelectedLecture(lecture)}
                                                                        style={{ background: 'none', border: 'none', color: '#4F60FF', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    >
                                                                        View Details <Info size={14} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                        <button 
                                                            onClick={() => handleDelete(lecture.id)} 
                                                            style={{ background: '#FEF2F2', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#EF4444' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* TAB 2: Google Sheets Sources */}
                {activeTab === 'sources' && (
                    <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Google Sheet Integration Sources</h3>
                                <p style={{ fontSize: '13px', color: '#5E6278', marginTop: '4px', fontWeight: 500 }}>
                                    Setup spreadsheet sources. The sync job automatically resolves names to internal UUIDs.
                                </p>
                            </div>
                            <button 
                                onClick={handleOpenAddSource}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', background: '#4F60FF', color: 'white',
                                    border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
                                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(79, 96, 255, 0.2)'
                                }}
                            >
                                <Plus size={16} /> Add Source
                            </button>
                        </div>

                        {isSourcesLoading ? (
                            <div style={{ display: 'grid', gap: '12px' }}>{[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />)}</div>
                        ) : sources.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '16px', color: '#A1A5B7' }}>
                                No sheet sources configured. Click &quot;Add Source&quot; to configure your first Google Sheet synchronization.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {sources.map(source => (
                                    <div 
                                        key={source.id}
                                        style={{
                                            border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '20px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '300px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1A1D3B' }}>{source.name}</h4>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px',
                                                    background: source.is_enabled ? '#ECFDF5' : '#FEF2F2', color: source.is_enabled ? '#10B981' : '#EF4444'
                                                }}>
                                                    {source.is_enabled ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#5E6278', marginTop: '6px', wordBreak: 'break-all' }}>
                                                <strong>Spreadsheet ID:</strong> {source.spreadsheet_id}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#8F92A1' }}>
                                                <span><strong>Tab Name:</strong> {source.sheet_name || 'Videos'}</span>
                                                <span><strong>Last Synced:</strong> {source.last_sync ? formatDateTime(source.last_sync) : 'Never'}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleSyncSource(source.id)}
                                                disabled={syncingSourceId === source.id}
                                                style={{
                                                    background: '#F0F2FF', color: '#4F60FF', border: 'none',
                                                    padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                                    cursor: syncingSourceId === source.id ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {syncingSourceId === source.id ? 'Syncing...' : 'Sync Source'}
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditSource(source)}
                                                style={{
                                                    background: '#F8F9FD', border: '1px solid #E2E8F0', color: '#1A1D3B',
                                                    padding: '10px', borderRadius: '10px', cursor: 'pointer'
                                                }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSource(source.id)}
                                                style={{
                                                    background: '#FFF5F5', border: '1px solid #FEE2E2', color: '#EF4444',
                                                    padding: '10px', borderRadius: '10px', cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: AUDIT HISTORY */}
                {activeTab === 'logs' && (
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Sync Log Audit Records</h3>
                                <p style={{ fontSize: '13px', color: '#5E6278', marginTop: '4px', fontWeight: 500 }}>
                                    View logs to track synced row success and warning messages. Actual records are preserved on log clean.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button onClick={handleClearAllLogs} style={{ background: '#FFF5F5', color: '#EF4444', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Clear All Logs</button>
                                <button onClick={handleClearFailedLogs} style={{ background: '#FFF5F5', color: '#EF4444', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Clear Failed</button>
                                <button onClick={handleClearSuccessLogs} style={{ background: '#ECFDF5', color: '#10B981', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Clear Successful</button>
                                {selectedLogIds.size > 0 && (
                                    <button onClick={handleBulkDeleteLogs} style={{ background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #EF4444', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                                        Delete Selected ({selectedLogIds.size})
                                    </button>
                                )}
                            </div>
                        </div>

                        {isLogsLoading ? (
                            <div className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
                        ) : syncLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#A1A5B7', background: '#F8F9FD', borderRadius: '12px' }}>
                                No sync logs registered.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #F0F0F5', textAlign: 'left', color: '#A1A5B7' }}>
                                            <th style={{ padding: '12px 8px', width: '40px' }}>
                                                <input type="checkbox" checked={selectedLogIds.size === syncLogs.length && syncLogs.length > 0} onChange={toggleSelectAllLogs} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                            </th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600 }}>Source</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date & Time</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Processed</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center', color: '#10B981' }}>Created</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center', color: '#F59E0B' }}>Updated</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center', color: '#EF4444' }}>Deleted</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600 }}>Errors / Warnings</th>
                                            <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {syncLogs.map((log) => {
                                            const isFailed = log.status === 'failed';
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #F8F9FD' }}>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <input type="checkbox" checked={selectedLogIds.has(log.id)} onChange={() => toggleSelectLog(log.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                                    </td>
                                                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#1A1D3B' }}>{log.source?.name || 'Manual Upload'}</td>
                                                    <td style={{ padding: '12px 8px', fontWeight: 500, color: '#5E6278' }}>{formatDateTime(log.start_time)}</td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <span style={{ 
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                                            background: isFailed ? '#FEF2F2' : '#ECFDF5', color: isFailed ? '#EF4444' : '#10B981'
                                                        }}>
                                                            {isFailed ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                                            {log.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#1A1D3B' }}>{log.rows_processed}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>+{log.rows_created}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#F59E0B' }}>~{log.rows_updated}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#EF4444' }}>-{log.rows_deleted}</td>
                                                    <td style={{ padding: '12px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isFailed ? '#EF4444' : '#5E6278' }}>
                                                        {log.error_message || 'OK'}
                                                    </td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                                        <button 
                                                            onClick={() => handleDeleteLog(log.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* A. Dynamic Source Form Modal */}
            {showSourceForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '650px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowSourceForm(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>
                            {editingSource ? 'Edit Google Sheet Source' : 'Add Google Sheet Source'}
                        </h2>
                        <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '24px' }}>Configure target spreadsheet and dynamic columns mapping rules.</p>

                        <form onSubmit={handleSaveSource} style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Source Name</label>
                                <input 
                                    type="text" required
                                    placeholder="e.g. Grades 7-8 Math Sheet" 
                                    value={sourceForm.name} 
                                    onChange={e => setSourceForm({ ...sourceForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Spreadsheet ID</label>
                                    <input 
                                        type="text" required
                                        placeholder="Google Sheet Spreadsheet ID" 
                                        value={sourceForm.spreadsheet_id} 
                                        onChange={e => setSourceForm({ ...sourceForm, spreadsheet_id: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Tab Name</label>
                                    <input 
                                        type="text" required
                                        placeholder="Videos" 
                                        value={sourceForm.sheet_name} 
                                        onChange={e => setSourceForm({ ...sourceForm, sheet_name: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                                <input 
                                    type="checkbox" id="is_enabled_src"
                                    checked={sourceForm.is_enabled}
                                    onChange={e => setSourceForm({ ...sourceForm, is_enabled: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="is_enabled_src" style={{ fontSize: '14px', fontWeight: 600, color: '#1A1D3B', cursor: 'pointer' }}>Enable auto synchronization</label>
                            </div>

                            <div style={{ borderTop: '1.5px solid #F1F1F4', paddingTop: '16px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>Column Mapping Configuration</h4>
                                <p style={{ fontSize: '12px', color: '#8F92A1', marginBottom: '14px' }}>Specify target spreadsheet column header names exactly as they appear in Google Sheet.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {Object.keys(defaultMapping).map((key) => (
                                        <div key={key}>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 700, color: '#5E6278', textTransform: 'capitalize' }}>
                                                {key.replace('_', ' ')} Column
                                            </label>
                                            <input 
                                                type="text" 
                                                value={(sourceForm.column_mapping as any)[key] || ''}
                                                onChange={e => setSourceForm({
                                                    ...sourceForm,
                                                    column_mapping: {
                                                        ...sourceForm.column_mapping,
                                                        [key]: e.target.value
                                                    }
                                                })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowSourceForm(false)} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}>Cancel</button>
                                <button type="submit" disabled={isSavingSource} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, background: '#4F60FF', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    {isSavingSource ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* B. Lecture Details Modal */}
            {selectedLecture && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '750px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedLecture(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>
                        
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', marginBottom: '4px', paddingRight: '40px' }}>
                            {selectedLecture.title}
                        </h2>
                        
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: '#ECF2FF', color: '#4F60FF', padding: '4px 10px', borderRadius: '6px' }}>
                                Class: {selectedLecture.class_name || 'N/A'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, background: '#ECF2FF', color: '#4F60FF', padding: '4px 10px', borderRadius: '6px' }}>
                                Subject: {selectedLecture.subject}
                            </span>
                        </div>

                        {/* Video Player */}
                        {(() => {
                            const videoId = getYouTubeId(selectedLecture.video_url);
                            if (!videoId) return null;
                            return (
                                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                                    <iframe 
                                        style={{ width: '100%', height: '100%', border: 0 }}
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={selectedLecture.title}
                                    />
                                </div>
                            );
                        })()}

                        {/* Metadata Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderBottom: '1px solid #F1F1F4', paddingBottom: '20px', marginBottom: '20px' }}>
                            {selectedLecture.teacher_name && (
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Teacher</span>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1D3B', marginTop: '2px' }}>{selectedLecture.teacher_name}</div>
                                </div>
                            )}
                            {selectedLecture.chapter && (
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Chapter</span>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1D3B', marginTop: '2px' }}>{selectedLecture.chapter}</div>
                                </div>
                            )}
                            {selectedLecture.topic && (
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Topic</span>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1D3B', marginTop: '2px' }}>{selectedLecture.topic}</div>
                                </div>
                            )}
                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Scheduled Date/Time</span>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1D3B', marginTop: '2px' }}>{selectedLecture.date} at {selectedLecture.time}</div>
                            </div>
                        </div>

                        {selectedLecture.description && (
                            <div style={{ marginBottom: '20px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Description</span>
                                <p style={{ fontSize: '14px', color: '#5E6278', margin: '4px 0 0 0', lineHeight: 1.6 }}>{selectedLecture.description}</p>
                            </div>
                        )}

                        {selectedLecture.notes && (
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase' }}>Study Notes & Resources</span>
                                <div style={{ fontSize: '14px', color: '#1A1D3B', fontWeight: 600, marginTop: '4px' }}>
                                    {selectedLecture.notes.startsWith('http') ? (
                                        <a href={selectedLecture.notes} target="_blank" rel="noreferrer" style={{ color: '#4F60FF', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Access Resource Link <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        <span style={{ color: '#5E6278', fontWeight: 500 }}>{selectedLecture.notes}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button onClick={() => setSelectedLecture(null)} style={{ background: '#F4F5F9', color: '#1A1D3B', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Close Details</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Animation and Loader Styles */}
            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1.2s linear infinite;
                }
            `}</style>
        </DashboardLayout>
    );
}

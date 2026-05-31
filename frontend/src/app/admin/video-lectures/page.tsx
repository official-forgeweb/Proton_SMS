'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  Video, Trash2, Search, AlertTriangle, Database, 
  RefreshCw, Settings, FileSpreadsheet, CheckCircle, 
  XCircle, Clock, Calendar, ExternalLink 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { customAlert, customConfirm } from '@/utils/dialog';

export default function AdminVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isLogsLoading, setIsLogsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [filters, setFilters] = useState({ class_id: '', subject: '', date: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchClasses();
        fetchSettings();
        fetchSyncLogs();
    }, []);

    useEffect(() => {
        fetchLectures();
    }, [filters]);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to fetch system settings', error);
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

    const handleManualSync = async () => {
        try {
            setIsSyncing(true);
            const res = await api.post('/video-lectures/sync');
            const summary = res.data.summary;
            const message = `Sync Completed Successfully!\n\n• Processed: ${summary.processed}\n• Created: ${summary.created}\n• Updated: ${summary.updated}\n• Deleted: ${summary.deleted}`;
            customAlert(message, 'Synchronization Complete');
            fetchLectures();
            fetchSyncLogs();
            fetchSettings();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Manual synchronization failed.';
            customAlert(msg, 'Sync Failed');
        } finally {
            setIsSyncing(false);
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
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '40px' }}>
                
                {/* 1. Page Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Poppins, sans-serif' }}>
                            <Video size={28} color="#4F60FF" /> Content Source Dashboard
                        </h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Automate student video lectures by synchronizing dynamic data models directly from Google Sheets.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a 
                            href="/admin/settings"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#FFFFFF', color: '#1A1D3B', border: '1.5px solid #E2E8F0',
                                padding: '12px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <Settings size={18} /> Configure Sheets
                        </a>
                        <button 
                            onClick={handleManualSync}
                            disabled={isSyncing || !settings?.google_spreadsheet_id}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: isSyncing ? '#A1A5B7' : 'linear-gradient(135deg, #4F60FF 0%, #3144E5 100%)',
                                color: 'white', border: 'none', padding: '12px 24px',
                                borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                boxShadow: isSyncing ? 'none' : '0 4px 15px rgba(79, 96, 255, 0.3)',
                                transition: 'all 0.2s', cursor: (isSyncing || !settings?.google_spreadsheet_id) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <RefreshCw size={18} className={isSyncing ? 'spin' : ''} style={{ animation: isSyncing ? 'spin 1.5s linear infinite' : 'none' }} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>

                {/* 2. Source Status Board */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    
                    {/* Connection Panel */}
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ background: settings?.google_sheets_enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', color: settings?.google_sheets_enabled ? '#10B981' : '#EF4444', padding: '14px', borderRadius: '16px' }}>
                            <Database size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Integration Status</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', marginTop: '4px' }}>
                                {settings?.google_sheets_enabled ? 'Auto-Sync Active' : 'Integration Disabled'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#5E6278', marginTop: '4px', fontWeight: 500 }}>
                                {settings?.google_sheets_enabled ? `Syncing every ${settings?.google_sync_interval_minutes || 5} min` : 'Enable in System Settings'}
                            </div>
                        </div>
                    </div>

                    {/* Datasheet Reference */}
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ background: 'rgba(79, 96, 255, 0.08)', color: '#4F60FF', padding: '14px', borderRadius: '16px' }}>
                            <FileSpreadsheet size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Spreadsheet</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {settings?.google_sheet_name || 'Videos'}
                            </div>
                            {settings?.google_spreadsheet_id ? (
                                <a 
                                    href={`https://docs.google.com/spreadsheets/d/${settings.google_spreadsheet_id}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ fontSize: '13px', color: '#4F60FF', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                >
                                    Open Google Sheet <ExternalLink size={12} />
                                </a>
                            ) : (
                                <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '4px', fontWeight: 500 }}>Not Configured</div>
                            )}
                        </div>
                    </div>

                    {/* Total Synced Lectures */}
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.08)', color: '#0F172A', padding: '14px', borderRadius: '16px' }}>
                            <Video size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Videos</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>
                                {lectures.length}
                            </div>
                            <div style={{ fontSize: '13px', color: '#5E6278', marginTop: '2px', fontWeight: 500 }}>
                                Live database records
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Sync Audit Logs Drawer/Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} /> Sync Audit History
                        </h3>
                        {isLogsLoading ? (
                            <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
                        ) : syncLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#A1A5B7', fontSize: '14px', background: '#F8F9FD', borderRadius: '12px' }}>
                                No sync logs registered. Trigger a sync to generate logs.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #F0F0F5', textAlign: 'left', color: '#A1A5B7' }}>
                                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Sync ID</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Date & Time</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Processed</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', color: '#10B981' }}>Created</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', color: '#F59E0B' }}>Updated</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', color: '#EF4444' }}>Deleted</th>
                                            <th style={{ padding: '10px 8px', fontWeight: 600 }}>Audit/Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {syncLogs.slice(0, 5).map((log) => {
                                            const isFailed = log.status === 'failed';
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #F8F9FD' }}>
                                                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#8F92A1' }}>{log.id.substring(0, 8)}</td>
                                                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1A1D3B' }}>{formatDateTime(log.start_time)}</td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <span style={{ 
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                                            background: isFailed ? '#FEF2F2' : '#ECFDF5', color: isFailed ? '#EF4444' : '#10B981'
                                                        }}>
                                                            {isFailed ? <XCircle size={12} /> : <CheckCircle size={12} />}
                                                            {log.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600, color: '#1A1D3B' }}>{log.rows_processed}</td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>+{log.rows_created}</td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#F59E0B' }}>~{log.rows_updated}</td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#EF4444' }}>-{log.rows_deleted}</td>
                                                    <td style={{ padding: '10px 8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isFailed ? '#EF4444' : '#5E6278' }}>
                                                        {log.error_message || 'OK'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Filter Panel */}
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

                {/* 5. Live Records Table */}
                <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />)}</div>
                    ) : lectures.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Video size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                            <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '18px' }}>No Lectures Found</h3>
                            <p style={{ margin: 0, color: '#8F92A1', fontSize: '14px' }}>
                                Connect your Google Sheet via System Settings and sync.
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
                                        <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Date & Time</th>
                                        <th style={{ padding: '16px 12px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '13px' }}>Video Link</th>
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
                                                <div style={{ fontWeight: 600, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} color="#8F92A1" /> {lecture.date}
                                                </div>
                                                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <Clock size={12} color="#8F92A1" /> {lecture.time}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 12px' }}>
                                                {(() => {
                                                    const videoId = getYouTubeId(lecture.video_url);
                                                    return (
                                                        <a href={lecture.video_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ position: 'relative', width: '100px', aspectRatio: '16/9', background: '#F1F1F4', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                                                                {videoId ? (
                                                                    <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} color="#A1A5B7" /></div>
                                                                )}
                                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <div style={{ background: '#E53935', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(229,57,53,0.4)' }}>
                                                                        <Video size={12} color="#FFF" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span style={{ color: '#E53935', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>Watch <ExternalLink size={12} /></span>
                                                        </a>
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

            </div>
            
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

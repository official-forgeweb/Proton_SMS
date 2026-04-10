'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Video, Upload, Trash2, Search, Edit3, X, FileSpreadsheet, Plus, AlertTriangle } from 'lucide-react';

export default function AdminVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadReport, setUploadReport] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState({ class_id: '', subject: '', date: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Edit modal
    const [editEntry, setEditEntry] = useState<any>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchLectures();
    }, [filters]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsUploading(true);
            setUploadReport(null);
            const res = await api.post('/video-lectures/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadReport(res.data.data);
            fetchLectures();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} lectures?`)) return;

        try {
            await api.delete('/video-lectures/bulk', { data: { ids: Array.from(selectedIds) } });
            setSelectedIds(new Set());
            fetchLectures();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this lecture?')) return;
        try {
            await api.delete(`/video-lectures/${id}`);
            fetchLectures();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleUpdate = async () => {
        if (!editEntry) return;
        try {
            await api.put(`/video-lectures/${editEntry.id}`, editEntry);
            setEditEntry(null);
            fetchLectures();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Update failed');
        }
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

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Video size={28} color="#4F60FF" /> Video Lectures
                    </h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Upload and manage Excel-based video lecture schedules.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="btn-primary" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUploading ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Uploading...</> : <><FileSpreadsheet size={18} /> Upload Excel</>}
                    </button>
                    {selectedIds.size > 0 && (
                        <button onClick={handleBulkDelete} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '14px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Trash2 size={18} /> Delete Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {uploadReport && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#1A1D3B' }}>Upload Report</h3>
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

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Search size={20} color="#8F92A1" />
                <input type="text" placeholder="Search Subject..." value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', flex: 1, minWidth: '200px' }}
                />
                <select value={filters.class_id} onChange={e => setFilters({ ...filters, class_id: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, minWidth: '150px' }}>
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
                <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                />
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />)}</div>
                ) : lectures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Video size={48} color="#A1A5B7" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '18px' }}>No Lectures Found</h3>
                        <p style={{ margin: 0, color: '#8F92A1', fontSize: '14px' }}>Upload an Excel file to get started.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
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
                                        <td style={{ padding: '16px 12px', fontWeight: 700, color: '#1A1D3B', fontSize: '14px' }}>{lecture.class_name || 'N/A'}</td>
                                        <td style={{ padding: '16px 12px', fontWeight: 600, color: '#4F60FF', fontSize: '14px' }}>{lecture.subject}</td>
                                        <td style={{ padding: '16px 12px', color: '#5E6278', fontSize: '14px' }}>
                                            <div style={{ fontWeight: 600, color: '#1A1D3B' }}>{lecture.date}</div>
                                            <div style={{ fontSize: '12px' }}>{lecture.time}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <a href={lecture.video_url} target="_blank" rel="noreferrer" style={{ color: '#E53935', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Video size={14} /> Open Video
                                            </a>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setEditEntry({ ...lecture })} style={{ background: '#F8F9FD', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#4F60FF' }}><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(lecture.id)} style={{ background: '#FEF2F2', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editEntry && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#FFF', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1A1D3B' }}>Edit Lecture</h2>
                            <button onClick={() => setEditEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#A1A5B7" /></button>
                        </div>
                        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Date</label>
                                <input type="date" value={editEntry.date} onChange={e => setEditEntry({...editEntry, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Time</label>
                                <input type="time" value={editEntry.time} onChange={e => setEditEntry({...editEntry, time: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Subject</label>
                                <input type="text" value={editEntry.subject} onChange={e => setEditEntry({...editEntry, subject: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Video URL</label>
                                <input type="text" value={editEntry.video_url} onChange={e => setEditEntry({...editEntry, video_url: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Class</label>
                                <select value={editEntry.class_id} onChange={e => setEditEntry({...editEntry, class_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleUpdate} className="btn-primary" style={{ width: '100%', padding: '14px' }}>Save Changes</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

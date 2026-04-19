'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Video, Upload, Trash2, Search, Edit3, X, FileSpreadsheet, Plus, AlertTriangle } from 'lucide-react';
import ToolBottomBar from '@/components/ToolBottomBar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { customAlert, customConfirm } from '@/utils/dialog';

export default function AdminVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadReport, setUploadReport] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
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

    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

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

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!await customConfirm(`Are you sure you want to delete ${selectedIds.size} lectures?`, 'Confirm Bulk Deletion')) return;

        try {
            await api.delete('/video-lectures/bulk', { data: { ids: Array.from(selectedIds) } });
            setSelectedIds(new Set());
            fetchLectures();
        } catch (error) {
            await customAlert('Delete failed', 'Error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await customConfirm('Are you sure you want to delete this lecture?', 'Confirm Deletion')) return;
        try {
            await api.delete(`/video-lectures/${id}`);
            fetchLectures();
        } catch (error) {
            await customAlert('Delete failed', 'Error');
        }
    };

    const handleUpdate = async () => {
        if (!editEntry) return;
        try {
            await api.put(`/video-lectures/${editEntry.id}`, editEntry);
            setEditEntry(null);
            fetchLectures();
        } catch (error: any) {
            await customAlert(error.response?.data?.message || 'Update failed', 'Error');
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
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading} 
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
                        {isUploading ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Uploading...</> : <><FileSpreadsheet size={20} strokeWidth={2.5} /> Upload Excel</>}
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
                <select value={filters.class_id} onChange={e => setFilters({ ...filters, class_id: e.target.value, subject: '' })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, minWidth: '150px' }}>
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
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />)}</div>
                ) : lectures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Video size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
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
                                            {(() => {
                                                const videoId = getYouTubeId(lecture.video_url);
                                                return (
                                                    <a href={lecture.video_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', group: 'true' }}>
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
                                                        <span style={{ color: '#E53935', fontSize: '13px', fontWeight: 700 }}>Watch</span>
                                                    </a>
                                                );
                                            })()}
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
                                <DatePicker
                                    required
                                    selected={editEntry.date ? new Date(editEntry.date) : null}
                                    onChange={(date: Date | null) => setEditEntry({ ...editEntry, date: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="MMMM d, yyyy"
                                    customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>Time</label>
                                <DatePicker
                                    required
                                    selected={editEntry.time ? new Date(`2000-01-01T${editEntry.time}:00`) : null}
                                    onChange={(date: Date | null) => { if (date) { setEditEntry({ ...editEntry, time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                    showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa"
                                    customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                />
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

            {/* Preview Confirm Modal */}
            {previewData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FD' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1A1D3B' }}>Confirm Video Upload</h2>
                                <p style={{ margin: '4px 0 0 0', color: '#5E6278', fontSize: '14px' }}>Please verify the thumbnails and data to ensure accurate upload.</p>
                            </div>
                            <button onClick={handleCancelUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: '#A1A5B7', transition: '0.2s hover' }}><X size={24} /></button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                            {previewData.previewRecords.map((record: any, idx: number) => {
                                const videoId = getYouTubeId(record.video_url);
                                return (
                                    <div key={idx} style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                        {videoId ? (
                                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                                                <iframe
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                                    src={`https://www.youtube.com/embed/${videoId}?controls=0&mute=1`}
                                                    allowFullScreen
                                                    title={record.title}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <AlertTriangle size={28} color="#EF4444" />
                                            </div>
                                        )}
                                        <div style={{ padding: '16px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>{record.title}</h4>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                <span>Subject: <b>{record.subject}</b></span>
                                                <span>{record.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div style={{ padding: '20px 32px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: '#5E6278', fontSize: '14px', fontWeight: 600 }}>
                                Found <span style={{ color: '#4F60FF', fontWeight: 800 }}>{previewData.previewRecords.length}</span> valid videos ready for insertion. 
                                {previewData.errors?.length > 0 && <span style={{ color: '#EF4444' }}> ({previewData.errors.length} skipped)</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={handleCancelUpload} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#5E6278', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleConfirmUpload} disabled={isUploading} style={{ background: '#00C07F', color: '#FFFFFF', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(0,192,127,0.2)' }}>
                                    {isUploading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : <Upload size={18} />}
                                    Confirm & Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}

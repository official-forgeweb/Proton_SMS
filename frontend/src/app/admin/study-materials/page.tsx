'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import axios from 'axios';
import { BookOpen, Upload, Trash2, Search, FileText, Eye, X, BookMarked, Download } from 'lucide-react';
import ToolBottomBar from '@/components/ToolBottomBar';
import { customAlert, customConfirm } from '@/utils/dialog';

export default function AdminStudyMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [filters, setFilters] = useState({ class_id: '', subject: '' });
    
    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadData, setUploadData] = useState({ title: '', class_id: '', subject: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchClasses();
        fetchMaterials();
    }, [filters]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filters.class_id) params.append('class_id', filters.class_id);
            if (filters.subject) params.append('subject', filters.subject);
            
            const res = await api.get(`/study-materials?${params.toString()}`);
            setMaterials(res.data.data);
        } catch (error) {
            console.error('Failed to fetch study materials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!await customConfirm(`Are you sure you want to permanently delete "${title}"?`, 'Confirm Deletion')) return;
        try {
            await api.delete(`/study-materials/${id}`);
            fetchMaterials();
        } catch (error) {
            await customAlert('Failed to delete study material.', 'Error');
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            await customAlert('Please select a valid PDF file.', 'Missing Target');
            return;
        }
        if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit guard
            await customAlert('File exceeds 100MB max limit.', 'File Too Large');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(10);
            
            // 1. Get Authentication Signature from our Node.js Backend strictly securely
            const sigRes = await api.get('/study-materials/signature');
            const { signature, timestamp, folder, cloudName, apiKey } = sigRes.data.data;
            
            if (!cloudName || !apiKey) {
                throw new Error("Missing Cloudinary configuration variables in the server.");
            }

            setUploadProgress(20);

            // 2. Direct Upload from Frontend Browser to Cloudinary CDN
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', folder);
            
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

            const cloudinaryRes = await axios.post(cloudinaryUrl, formData, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        // Scale the percentage between 20% and 90%
                        setUploadProgress(20 + 0.7 * percentCompleted);
                    }
                }
            });

            const pdfSecureUrl = cloudinaryRes.data.secure_url;
            setUploadProgress(95);

            // 3. Register newly uploaded external URL entry to Backend Database
            await api.post('/study-materials', {
                title: uploadData.title,
                class_id: uploadData.class_id,
                subject: uploadData.subject,
                pdf_url: pdfSecureUrl
            });

            setUploadProgress(100);
            setTimeout(() => {
                setShowUploadModal(false);
                setIsUploading(false);
                setUploadProgress(0);
                setSelectedFile(null);
                setUploadData({ title: '', class_id: '', subject: '' });
                fetchMaterials();
            }, 600);

        } catch (error: any) {
            console.error('Upload Process Failed:', error?.response?.data || error);
            setIsUploading(false);
            setUploadProgress(0);
            const errorMsg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to complete upload.';
            await customAlert(errorMsg, 'Upload Disruption');
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BookOpen size={28} color="#4F60FF" /> Study Materials
                    </h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                        Manage PDF assignments, comprehensive notes, and core reading records.
                    </p>
                </div>
                <div>
                    <button 
                        onClick={() => setShowUploadModal(true)} 
                        className="hover-lift"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)',
                            color: 'white', border: 'none', padding: '12px 24px',
                            borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(26, 29, 59, 0.3)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(26, 29, 59, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(26, 29, 59, 0.3)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                    >
                        <Upload size={20} strokeWidth={2.5} /> Upload Material
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
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
            </div>

            {/* Content List */}
            <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />)}</div>
                ) : materials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ display: 'inline-flex', padding: '20px', background: '#F8F9FD', borderRadius: '50%', marginBottom: '16px' }}>
                            <BookMarked size={48} color="#A1A5B7" />
                        </div>
                        <h3 style={{ color: '#1A1D3B', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>No Materials Found</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>There are no PDF materials uploaded matching the selected filters.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 20px', color: '#8F92A1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F4F9' }}>Title / Subject</th>
                                    <th style={{ textAlign: 'left', padding: '16px 20px', color: '#8F92A1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F4F9' }}>Class Details</th>
                                    <th style={{ textAlign: 'left', padding: '16px 20px', color: '#8F92A1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F4F9' }}>Uploaded By</th>
                                    <th style={{ textAlign: 'left', padding: '16px 20px', color: '#8F92A1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F4F9' }}>Uploaded On</th>
                                    <th style={{ textAlign: 'right', padding: '16px 20px', color: '#8F92A1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F4F9' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((item) => (
                                    <tr key={item.id} className="hover-bg-light" style={{ transition: 'background 0.2s', borderBottom: '1px solid #F1F4F9' }}>
                                        <td style={{ padding: '20px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>{item.title}</h4>
                                                    <span style={{ padding: '4px 10px', background: '#F4F5F9', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#5E6278', letterSpacing: '0.02em' }}>{item.subject}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px', verticalAlign: 'middle' }}>
                                            <span style={{ padding: '6px 12px', background: '#EEF0FF', color: '#4F60FF', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}>
                                                {item.class_ref?.class_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1D3B' }}>{item.uploader?.email?.split('@')[0] || 'Unknown'}</span>
                                                <span style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 500, textTransform: 'capitalize' }}>{item.uploader?.role}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px', verticalAlign: 'middle', color: '#5E6278', fontSize: '14px', fontWeight: 600 }}>
                                            {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '20px', verticalAlign: 'middle', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" title="View PDF" style={{ display: 'flex', padding: '10px', borderRadius: '10px', background: '#F8F9FD', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#1A1D3B' }}>
                                                    <Eye size={18} />
                                                </a>
                                                <a href={item.pdf_url} download title="Download PDF" style={{ display: 'flex', padding: '10px', borderRadius: '10px', background: '#F8F9FD', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#4F60FF' }}>
                                                    <Download size={18} />
                                                </a>
                                                <button onClick={() => handleDelete(item.id, item.title)} title="Delete Matrix" style={{ display: 'flex', padding: '10px', borderRadius: '10px', background: '#FFF5F5', border: '1px solid #FEE2E2', cursor: 'pointer', color: '#E53935' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '520px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
                        {!isUploading && (
                            <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <X size={24} color="#A1A5B7" />
                            </button>
                        )}
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>
                            Upload Study Material
                        </h2>
                        <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>Upload large PDF documents directly into the CDN node.</p>

                        <form onSubmit={handleUploadSubmit}>
                            <div style={{ display: 'grid', gap: '20px', marginBottom: '28px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Material Title</label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="e.g. Physics Final Notes Chapter 1"
                                        value={uploadData.title}
                                        onChange={e => setUploadData({...uploadData, title: e.target.value})}
                                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 500 }} 
                                        disabled={isUploading}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Target Class</label>
                                        <select 
                                            required 
                                            value={uploadData.class_id}
                                            onChange={e => setUploadData({...uploadData, class_id: e.target.value, subject: ''})}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 500 }}
                                            disabled={isUploading}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Subject Subject</label>
                                        <select 
                                            required 
                                            value={uploadData.subject}
                                            onChange={e => setUploadData({...uploadData, subject: e.target.value})}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 500, background: !uploadData.class_id ? '#F8F9FD' : '#FFF' }}
                                            disabled={isUploading || !uploadData.class_id}
                                        >
                                            <option value="">{uploadData.class_id ? "Select Subject" : "Select Class First"}</option>
                                            {uploadData.class_id && Array.from(new Set([
                                                classes.find(c => c.id === uploadData.class_id)?.subject,
                                                ...(classes.find(c => c.id === uploadData.class_id)?.schedule || []).map((s: any) => s.subject)
                                            ].filter(Boolean))).map((subj: any) => (
                                                <option key={subj} value={subj}>{subj}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>Upload Target (PDF)</label>
                                    <div style={{ 
                                        border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '32px 20px', 
                                        textAlign: 'center', background: '#F8F9FD', cursor: isUploading ? 'not-allowed' : 'pointer',
                                        transition: '0.2s', position: 'relative', overflow: 'hidden'
                                    }}>
                                        <input 
                                            type="file" 
                                            accept=".pdf" 
                                            required 
                                            onChange={e => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelectedFile(e.target.files[0]);
                                                }
                                            }}
                                            disabled={isUploading}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                                        />
                                        <FileText size={40} color={selectedFile ? '#4F60FF' : '#A1A5B7'} style={{ marginBottom: '12px' }} />
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>
                                            {selectedFile ? selectedFile.name : 'Click or drag PDF to upload'}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>
                                            {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready` : 'Max configuration size: 100MB'}
                                        </p>
                                    </div>
                                    {isUploading && (
                                        <div style={{ marginTop: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>
                                                <span color="#1A1D3B">Uploading to CDN...</span>
                                                <span color="#4F60FF">{uploadProgress}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#F1F4F9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#4F60FF', borderRadius: '10px', transition: 'width 0.3s ease' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button 
                                disabled={isUploading || !selectedFile} 
                                className="btn-primary" 
                                style={{ 
                                    width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    fontSize: '15px', background: isUploading ? '#A1A5B7' : '#4F60FF', boxShadow: isUploading ? 'none' : '0 4px 15px rgba(79, 96, 255, 0.3)'
                                }}
                            >
                                {isUploading ? (
                                    <><span className="spinner" style={{ width: '18px', height: '18px' }} /> Initializing Sector Transfer...</>
                                ) : (
                                    <><Upload size={20} /> Transmit Target Payload</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}

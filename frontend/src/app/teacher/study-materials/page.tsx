'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import axios from 'axios';
import { BookOpen, Upload, Trash2, Search, FileText, Eye, X, BookMarked, Download, Sparkles } from 'lucide-react';
import { customAlert, customConfirm } from '@/utils/dialog';
import ClassSubjectSelector from '@/components/ClassSubjectSelector';
import { useAuthStore } from '@/stores/authStore';
import CustomSelect from '@/components/ui/CustomSelect';

export default function TeacherStudyMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    
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

    const handleDelete = async (id: string, title: string, uploaderId: string) => {
        if (user?.id !== uploaderId) {
            await customAlert('You can only delete materials that you have uploaded.', 'Access Denied');
            return;
        }
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
            
            // 1. Get Authentication Signature
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
                        setUploadProgress(20 + 0.7 * percentCompleted);
                    }
                }
            });

            const pdfSecureUrl = cloudinaryRes.data.secure_url;
            setUploadProgress(95);

            // 3. Register Reference in DB
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

    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
            border-radius: 24px;
        }
        .bg-mesh {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(229,57,53,0.03) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(229,57,53,0.02) 0px, transparent 50%);
        }
        .table-row {
            transition: all 0.2s;
            border-bottom: 1px solid rgba(241, 245, 249, 0.9);
        }
        .table-row:hover {
            background: rgba(229, 57, 53, 0.02) !important;
        }
    `;

    return (
        <DashboardLayout requiredRole="teacher">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '100px' }}>
                
                {/* Header */}
                <div className="animate-fade-in" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                <BookOpen size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Study Materials
                            </h1>
                        </div>
                        <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                            Upload, organize and manage learning handouts and assignments.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setShowUploadModal(true)} 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            color: 'white', border: 'none', padding: '12px 24px',
                            borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(229, 57, 53, 0.25)',
                            transition: 'all 0.25s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.35)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(229, 57, 53, 0.25)';
                        }}
                    >
                        <Upload size={18} strokeWidth={2.5} /> Upload Material
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="glass-panel animate-fade-in" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px', background: '#FFF', borderRadius: '12px', border: '1.5px solid rgba(226, 232, 240, 0.8)', padding: '0 14px', transition: 'all 0.2s' }}>
                        <Search size={18} color="#94A3B8" />
                        <input 
                            type="text" 
                            list="subject-options"
                            placeholder="Search by Subject..." 
                            value={filters.subject} 
                            onChange={e => setFilters({ ...filters, subject: e.target.value })}
                            style={{ padding: '10px 10px', border: 'none', outline: 'none', fontSize: '14px', flex: 1, background: 'transparent', fontWeight: 600, color: '#1E293B' }}
                        />
                        <datalist id="subject-options">
                            {Array.from(new Set(classes.flatMap(c => (filters.class_id && c.id !== filters.class_id) ? [] : (c.schedule?.map((s: any) => s.subject).filter(Boolean) || [])))).map((subj: any, i) => (
                                <option key={i} value={subj} />
                            ))}
                        </datalist>
                    </div>
                    <div style={{ minWidth: '160px' }}>
                        <CustomSelect
                            value={filters.class_id}
                            onChange={val => setFilters({ ...filters, class_id: val, subject: '' })}
                            placeholder="All Classes"
                            options={[
                                { value: '', label: 'All Classes' },
                                ...classes.map(c => ({ value: c.id, label: c.class_name }))
                            ]}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: '70px', borderRadius: '16px', background: 'white', border: '1px solid #E2E8F0', opacity: 0.6, animation: 'pulse 2s infinite' }} />)}
                        </div>
                    ) : materials.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{ display: 'inline-flex', padding: '20px', background: '#F8F9FD', borderRadius: '50%', marginBottom: '16px' }}>
                                <BookMarked size={40} color="#94A3B8" />
                            </div>
                            <h3 style={{ color: '#1A1D3B', fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>No Materials Found</h3>
                            <p style={{ color: '#5E6278', fontSize: '14px', margin: 0 }}>There are no PDF handouts uploaded matching the selected filters.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px 20px', color: '#94A3B8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(241, 245, 249, 0.9)' }}>Title / Subject</th>
                                        <th style={{ textAlign: 'left', padding: '16px 20px', color: '#94A3B8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(241, 245, 249, 0.9)' }}>Class</th>
                                        <th style={{ textAlign: 'left', padding: '16px 20px', color: '#94A3B8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(241, 245, 249, 0.9)' }}>Uploader</th>
                                        <th style={{ textAlign: 'left', padding: '16px 20px', color: '#94A3B8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(241, 245, 249, 0.9)' }}>Date</th>
                                        <th style={{ textAlign: 'right', padding: '16px 20px', color: '#94A3B8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid rgba(241, 245, 249, 0.9)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map((item) => (
                                        <tr key={item.id} className="table-row" style={{ background: 'transparent' }}>
                                            <td style={{ padding: '18px 20px', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(229, 57, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>{item.title}</h4>
                                                        <span style={{ padding: '3px 8px', background: 'rgba(229, 57, 53, 0.06)', borderRadius: '6px', fontSize: '11px', fontWeight: 800, color: '#E53935' }}>{item.subject}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 20px', verticalAlign: 'middle' }}>
                                                <span style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                                                    {item.class_ref?.class_name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 20px', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                                        {item.uploader?.email?.split('@')[0] || 'Teacher'}
                                                        {user?.id === item.uploaded_by && " (You)"}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>Instructor</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 20px', verticalAlign: 'middle', color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
                                                {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '18px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" title="View PDF" style={{ display: 'flex', padding: '8px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid rgba(226, 232, 240, 0.8)', cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
                                                       onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                                       onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                                                        <Eye size={16} />
                                                    </a>
                                                    <a href={item.pdf_url} download title="Download PDF" style={{ display: 'flex', padding: '8px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid rgba(226, 232, 240, 0.8)', cursor: 'pointer', color: '#E53935', transition: 'all 0.2s' }}
                                                       onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 57, 53, 0.08)'}
                                                       onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}>
                                                        <Download size={16} />
                                                    </a>
                                                    {user?.id === item.uploaded_by && (
                                                        <button onClick={() => handleDelete(item.id, item.title, item.uploaded_by)} title="Delete" style={{ display: 'flex', padding: '8px', borderRadius: '8px', background: '#FFF5F5', border: '1px solid #FEE2E2', cursor: 'pointer', color: '#EF4444', transition: 'all 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                                                onMouseLeave={e => e.currentTarget.style.background = '#FFF5F5'}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
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
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                        <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '520px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)', border: '1px solid rgba(229, 57, 53, 0.1)' }}>
                            {!isUploading && (
                                <button onClick={() => setShowUploadModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                    <X size={20} color="#94A3B8" />
                                </button>
                            )}
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }}>
                                Upload Handout
                            </h2>
                            <p style={{ color: '#5E6278', fontSize: '13px', marginBottom: '24px', fontWeight: 500 }}>Publish PDF hand-outs directly to class channels.</p>

                            <form onSubmit={handleUploadSubmit}>
                                <div style={{ display: 'grid', gap: '18px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</label>
                                        <input 
                                            required 
                                            type="text" 
                                            placeholder="e.g., Chapter 1 Dynamics Notes"
                                            value={uploadData.title}
                                            onChange={e => setUploadData({...uploadData, title: e.target.value})}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid rgba(226, 232, 240, 0.8)', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#1E293B' }} 
                                            disabled={isUploading}
                                            onFocus={e => e.currentTarget.style.borderColor = '#E53935'}
                                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class</label>
                                            <CustomSelect
                                                required
                                                value={uploadData.class_id}
                                                onChange={val => setUploadData({...uploadData, class_id: val, subject: ''})}
                                                placeholder="Select Class"
                                                options={classes.map(c => ({ value: c.id, label: c.class_name }))}
                                                disabled={isUploading}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</label>
                                            <ClassSubjectSelector 
                                                classId={uploadData.class_id}
                                                value={uploadData.subject} 
                                                onChange={val => setUploadData({...uploadData, subject: val})} 
                                                placeholder="Select subject..."
                                                required
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upload Target (PDF)</label>
                                        <div style={{ 
                                            border: '2px dashed rgba(229, 57, 53, 0.25)', borderRadius: '16px', padding: '24px 16px', 
                                            textAlign: 'center', background: 'rgba(229, 57, 53, 0.01)', cursor: isUploading ? 'not-allowed' : 'pointer',
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
                                            <FileText size={36} color={selectedFile ? '#E53935' : '#94A3B8'} style={{ marginBottom: '10px', marginLeft: 'auto', marginRight: 'auto' }} />
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>
                                                {selectedFile ? selectedFile.name : 'Choose file or drag & drop'}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                                                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF format only, up to 100MB'}
                                            </p>
                                        </div>
                                        {isUploading && (
                                            <div style={{ marginTop: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: 800 }}>
                                                    <span style={{ color: '#475569' }}>Uploading to Cloud CDN...</span>
                                                    <span style={{ color: '#E53935' }}>{uploadProgress}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #E53935 0%, #EF5350 100%)', borderRadius: '10px', transition: 'width 0.3s ease' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    disabled={isUploading || !selectedFile} 
                                    style={{ 
                                        width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                        fontSize: '14px', fontWeight: 700, borderRadius: '12px', border: 'none', color: 'white',
                                        background: isUploading ? '#94A3B8' : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', 
                                        boxShadow: isUploading ? 'none' : '0 4px 15px rgba(229, 57, 53, 0.25)',
                                        cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isUploading ? (
                                        <>Deploying Handout Payload...</>
                                    ) : (
                                        <><Upload size={16} /> Transmit Document</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

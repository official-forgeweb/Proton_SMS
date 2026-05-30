'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { BookOpen, FileText, Eye, Download, Search, BookMarked, MonitorPlay, X, Loader2, User, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function StudentStudyMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = async (url: string, title: string) => {
        try {
            setDownloading(url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab
            window.open(url, '_blank');
        } finally {
            setDownloading(null);
        }
    };

    const handlePreview = (url: string, title: string) => {
        setPreviewUrl(url);
        setPreviewTitle(title);
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/study-materials');
            setMaterials(res.data.data);
        } catch (error) {
            console.error('Failed to fetch study materials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMaterials = materials.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout requiredRole="student">
            <style>{`
                .materials-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.03);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .materials-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 40px rgba(31, 38, 135, 0.08);
                    border-color: rgba(229, 57, 53, 0.2);
                }
                .glass-search-container {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1.5px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    transition: all 0.2s ease;
                }
                .glass-search-container:focus-within {
                    border-color: #E53935;
                    box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.12);
                    background: #FFFFFF;
                }
                .preview-modal-overlay {
                    backdrop-filter: blur(24px);
                    background: rgba(13, 15, 33, 0.6);
                    animation: fadeIn 0.25s ease-out;
                }
                .preview-modal-card {
                    animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 120px 20px' }}>
                
                {/* Modern Slate Header Panel */}
                <div style={{
                    background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                    borderRadius: '24px',
                    padding: '36px',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(13, 15, 33, 0.08)'
                }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: 'radial-gradient(circle at 100% 100%, #E53935 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <BookOpen size={32} color="#E53935" /> Academic Resource Lounge
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', marginTop: '8px', fontWeight: 500 }}>
                            Review high-fidelity lecture notes, PDF worksheets, and textbook references uploaded by your professors.
                        </p>
                    </div>
                </div>

                {/* Filter and Search Section */}
                <div className="glass-search-container" style={{ padding: '4px 18px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={22} color="#8F92A1" />
                    <input 
                        type="text" 
                        placeholder="Filter study resources by topic, subject, uploader or keyword..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '16px 4px', border: 'none', outline: 'none', fontSize: '15px', fontWeight: 600, flex: 1, color: '#1A1D3B', background: 'transparent' }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ background: 'rgba(143, 146, 161, 0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5E6278' }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Main Body */}
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '24px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(226,232,240,0.5)' }} />
                        ))}
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        <div style={{ display: 'inline-flex', padding: '24px', background: 'rgba(248, 249, 253, 0.8)', borderRadius: '50%', marginBottom: '24px' }}>
                            <BookMarked size={48} color="#A1A5B7" />
                        </div>
                        <h3 style={{ color: '#1A1D3B', fontWeight: 800, fontSize: '20px', marginBottom: '8px', letterSpacing: '-0.01em' }}>No Academic Resources Found</h3>
                        <p style={{ color: '#5E6278', fontSize: '15px', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5, fontWeight: 500 }}>
                            There are currently no notes uploaded for this section, or your filter parameters didn't return any matches.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                        {filteredMaterials.map((item) => (
                            <div key={item.id} className="materials-card" style={{ 
                                borderRadius: '24px', padding: '28px',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(229, 57, 53, 0.08)', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={28} />
                                    </div>
                                    <span style={{ padding: '6px 14px', background: 'rgba(26, 29, 59, 0.05)', borderRadius: '10px', fontSize: '12px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {item.subject}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 800, color: '#1A1D3B', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                                    {item.title}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                        <User size={14} color="#8F92A1" />
                                        <span>Professor: {item.uploader?.email?.split('@')[0] || 'Administrator'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                        <Calendar size={14} color="#8F92A1" />
                                        <span>Released: {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button 
                                        onClick={() => handlePreview(item.pdf_url, item.title)}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '13px', background: '#F8F9FD', border: '1.5px solid rgba(226, 232, 240, 0.8)', borderRadius: '14px',
                                            color: '#1A1D3B', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#1A1D3B'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FD'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; }}
                                    >
                                        <Eye size={17} /> Preview
                                    </button>
                                    <button 
                                        onClick={() => handleDownload(item.pdf_url, item.title)}
                                        disabled={downloading === item.pdf_url}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '13px', background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', border: 'none', borderRadius: '14px',
                                            color: '#FFFFFF', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.2s',
                                            opacity: downloading === item.pdf_url ? 0.7 : 1,
                                            boxShadow: '0 4px 12px rgba(13, 15, 33, 0.15)'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 15, 33, 0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 15, 33, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {downloading === item.pdf_url ? <Loader2 size={17} className="spin-animation" /> : <Download size={17} />}
                                        {downloading === item.pdf_url ? 'Loading...' : 'Download'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PDF Premium Preview Modal */}
                {previewUrl && (
                    <div className="preview-modal-overlay" style={{ 
                        position: 'fixed', inset: 0, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        zIndex: 2000, padding: '24px'
                    }}>
                        <div className="preview-modal-card" style={{ 
                            width: '100%', maxWidth: '980px', height: '90vh', 
                            background: '#FFFFFF', borderRadius: '28px', 
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            boxShadow: '0 30px 70px rgba(13, 15, 33, 0.35)'
                        }}>
                            <div style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '22px 28px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                background: '#FFFFFF'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.01em' }}>
                                    {previewTitle}
                                </h3>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => handleDownload(previewUrl, previewTitle)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', border: 'none',
                                            borderRadius: '12px', color: '#FFFFFF', fontWeight: 700,
                                            fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.2)'
                                        }}
                                    >
                                        <Download size={15} /> Download PDF
                                    </button>
                                    <button 
                                        onClick={() => { setPreviewUrl(null); setPreviewTitle(''); }}
                                        style={{ 
                                            background: '#F4F5F9', border: 'none', borderRadius: '12px',
                                            width: '42px', height: '42px', display: 'flex', alignItems: 'center', 
                                            justifyContent: 'center', cursor: 'pointer', color: '#5E6278',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#F4F5F9'}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ flex: 1, background: '#F0F0F5', position: 'relative' }}>
                                <iframe 
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="PDF Preview"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

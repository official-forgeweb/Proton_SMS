'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { BookOpen, FileText, Eye, Download, Search, BookMarked, MonitorPlay } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ToolBottomBar from '@/components/ToolBottomBar';

export default function StudentStudyMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/study-materials');
            setMaterials(res.data.data);
        } catch (error) {
            console.error('Failed to fetch study materials');
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
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BookOpen size={28} color="#4F60FF" /> Study Materials & Notes
                    </h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                        Access your high-definition PDF study notes uploaded by your teachers.
                    </p>
                </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '200px', background: '#F8F9FD', borderRadius: '12px', border: '1.5px solid transparent', padding: '0 16px' }}>
                    <Search size={20} color="#8F92A1" />
                    <input 
                        type="text" 
                        placeholder="Search notes by topic or subject..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '14px 12px', border: 'none', outline: 'none', fontSize: '14px', flex: 1, background: 'transparent' }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '24px' }} />)}
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'inline-flex', padding: '24px', background: '#F8F9FD', borderRadius: '50%', marginBottom: '20px' }}>
                        <BookMarked size={52} color="#A1A5B7" />
                    </div>
                    <h3 style={{ color: '#1A1D3B', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>No Study Material Uploaded</h3>
                    <p style={{ color: '#5E6278', fontSize: '15px' }}>Your teachers haven't uploaded any PDF notes yet, or none match your search!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {filteredMaterials.map((item) => (
                        <div key={item.id} className="hover-lift" style={{ 
                            background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '24px',
                            display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF4E5', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={28} />
                                </div>
                                <span style={{ padding: '6px 12px', background: '#F4F5F9', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#5E6278' }}>
                                    {item.subject}
                                </span>
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#1A1D3B', lineHeight: 1.4 }}>
                                {item.title}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                <span>Uploaded by {item.uploader?.email?.split('@')[0] || 'Unknown'}</span>
                                <span>•</span>
                                <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <a 
                                    href={item.pdf_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '12px', background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '12px',
                                        color: '#1A1D3B', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'background 0.2s'
                                    }}
                                >
                                    <Eye size={18} /> Preview
                                </a>
                                <a 
                                    href={item.pdf_url} 
                                    download 
                                    style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '12px', background: '#EEF0FF', border: '1px solid #EEF0FF', borderRadius: '12px',
                                        color: '#4F60FF', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'background 0.2s'
                                    }}
                                >
                                    <Download size={18} /> Download
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}

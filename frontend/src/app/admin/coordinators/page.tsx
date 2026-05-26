'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Shield, Search, Plus, Mail, Phone, ChevronRight, Download, Edit, Trash2, UserCheck } from 'lucide-react';

export default function CoordinatorsPage() {
    const router = useRouter();
    const [coordinators, setCoordinators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        try {
            await api.delete(`/coordinators/${id}`);
            fetchCoordinators();
        } catch (error) {
            console.error('Error deleting coordinator:', error);
            alert('Failed to delete coordinator');
        }
    };

    useEffect(() => {
        fetchCoordinators();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchCoordinators = async () => {
        try {
            const res = await api.get('/coordinators', { params: { search } });
            setCoordinators(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.85);
                }
                .card-hover {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .card-hover:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.06);
                }
                .bg-mesh {
                    background-color: #f7f8fc;
                    background-image: radial-gradient(at 40% 20%, hsla(270,100%,74%,0.12) 0px, transparent 50%),
                                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.12) 0px, transparent 50%),
                                      radial-gradient(at 0% 50%, hsla(355,100%,93%,0.12) 0px, transparent 50%);
                }
            `}} />

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Shield size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Coordinator Management
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#7C3AED', fontWeight: 700 }}>Coordinators</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{
                            background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '12px 20px', fontSize: '14px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                            onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                        >
                            <Download size={16} strokeWidth={2.5} /> Export
                        </button>
                        <button
                            onClick={() => router.push('/admin/coordinators/add')}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '12px 24px', fontSize: '15px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(124,58,237,0.4)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(124,58,237,0.5)');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(124,58,237,0.4)');
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Add Coordinator
                        </button>
                    </div>
                </div>

                {/* Search Filter */}
                <div className="animate-fade-in glass-panel" style={{
                    borderRadius: '20px', padding: '24px', marginBottom: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '100ms', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: '#FFFFFF',
                        borderRadius: '14px', padding: '12px 20px', width: '400px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', gap: '12px',
                        transition: 'all 0.2s'
                    }}>
                        <Search size={18} color="#A1A5B7" strokeWidth={2.5} />
                        <input
                            placeholder="Search coordinators by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                flex: 1, fontSize: '15px', color: '#1A1D3B', fontWeight: 500
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '14px', color: '#5E6278', fontWeight: 600 }}>
                        <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{coordinators.length}</span> Coordinators
                    </div>
                </div>

                {/* Coordinators Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-fade-in glass-panel" style={{ height: '200px', borderRadius: '20px', animationDelay: `${i * 100}ms` }} />
                        ))
                    ) : coordinators.length === 0 ? (
                        <div className="animate-fade-in glass-panel" style={{
                            gridColumn: '1 / -1', borderRadius: '20px',
                            padding: '60px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.8)',
                        }}>
                            <Shield size={48} style={{ color: '#A1A5B7', marginBottom: '16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '16px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Coordinators Found</h3>
                            <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>Add a new coordinator or adjust your search criteria.</p>
                        </div>
                    ) : (
                        coordinators.map((coord, idx) => (
                            <div
                                key={coord.id}
                                className="animate-fade-in glass-panel card-hover"
                                style={{
                                    borderRadius: '20px', padding: '24px',
                                    border: '1px solid rgba(255,255,255,0.8)',
                                    animationDelay: `${Math.min(idx * 75, 800)}ms`,
                                }}
                            >
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(coord.full_name || 'C')}&background=7C3AED&color=fff&size=48&bold=true`}
                                        style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', flexShrink: 0 }}
                                        alt={coord.full_name}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {coord.full_name}
                                            </h3>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '50px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                                background: coord.status === 'active' ? '#ECFDF5' : '#FEF2F2',
                                                color: coord.status === 'active' ? '#059669' : '#EF4444',
                                                boxShadow: coord.status === 'active' ? '0 2px 6px rgba(16,185,129,0.1)' : '0 2px 6px rgba(239,68,68,0.1)',
                                                marginLeft: '8px', flexShrink: 0
                                            }}>
                                                {coord.status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#A1A5B7', fontFamily: 'monospace', marginTop: '2px', fontWeight: 600 }}>
                                            ID: {coord.coordinator_id}
                                        </p>
                                        <div style={{ display: 'inline-block', marginTop: '6px' }}>
                                            <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700, background: '#F3F0FF', padding: '3px 8px', borderRadius: '6px' }}>
                                                Coordinator
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <Mail size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coord.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <Phone size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        {coord.phone || 'Not provided'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <UserCheck size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        Gender: <strong style={{ color: '#1A1D3B' }}>&nbsp;{coord.gender ? coord.gender.charAt(0).toUpperCase() + coord.gender.slice(1) : 'N/A'}</strong>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => router.push(`/admin/coordinators/${coord.id}/edit`)}
                                        style={{
                                            flex: 1, padding: '10px', background: '#FFFFFF', color: '#1A1D3B',
                                            border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                                        onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                                    >
                                        <Edit size={14} strokeWidth={2.5} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coord.id, coord.full_name)}
                                        style={{
                                            padding: '10px', background: '#FEE2E2', color: '#EF4444',
                                            border: '1px solid #FECACA', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseEnter={e => { (e.currentTarget.style.background = '#FECACA'); }}
                                        onMouseLeave={e => { (e.currentTarget.style.background = '#FEE2E2'); }}
                                    >
                                        <Trash2 size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

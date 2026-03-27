'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { Users, Search, Plus, Mail, Phone, BookOpen, Award, ChevronRight, ChevronLeft, Download, Edit } from 'lucide-react';

export default function TeachersPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const emptyForm = {
        first_name: '', last_name: '', email: '', phone: '', qualification: '', specialization: '', experience_years: '', role_type: 'subject_teacher', gender: 'male', date_of_joining: new Date().toISOString().split('T')[0], password: ''
    };
    const [formData, setFormData] = useState(emptyForm);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: any = { ...formData };
            if (!submitData.password) delete submitData.password;
            if (!submitData.experience_years) delete submitData.experience_years;
            
            if (editingId) {
                await api.put(`/teachers/${editingId}`, submitData);
            } else {
                await api.post('/teachers', submitData);
            }
            setIsAddOpen(false);
            setEditingId(null);
            fetchTeachers();
            setFormData(emptyForm);
        } catch (error) {
            console.error('Error saving teacher:', error);
            alert('Failed to save teacher');
        }
    };

    const handleEdit = (teacher: any) => {
        setFormData({
            first_name: teacher.first_name, last_name: teacher.last_name, email: teacher.email, phone: teacher.phone, qualification: teacher.qualification, specialization: teacher.specialization, experience_years: teacher.experience_years, role_type: teacher.role_type || 'subject_teacher', gender: teacher.gender || 'male', date_of_joining: teacher.date_of_joining ? new Date(teacher.date_of_joining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], password: ''
        });
        setEditingId(teacher.id);
        setIsAddOpen(true);
    };

    useEffect(() => {
        fetchTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers', { params: { search } });
            setTeachers(res.data.data);
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
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
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
                    background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 0% 50%, hsla(355,100%,93%,0.15) 0px, transparent 50%);
                }
            `}} />

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: '#E53935', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Users size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Teacher Management
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Teachers</span>
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
                            onClick={() => { setFormData(emptyForm); setEditingId(null); setIsAddOpen(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '12px 24px', fontSize: '15px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(229,57,53,0.4)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(229,57,53,0.5)');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(229,57,53,0.4)');
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Add Teacher
                        </button>
                    </div>
                </div>

                {/* Search Filter Component */}
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
                            placeholder="Search teachers by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                flex: 1, fontSize: '15px', color: '#1A1D3B', fontWeight: 500
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '14px', color: '#5E6278', fontWeight: 600 }}>
                        <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{teachers.length}</span> Active Staff Members
                    </div>
                </div>

                {/* Teachers Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-fade-in glass-panel" style={{ height: '220px', borderRadius: '20px', animationDelay: `${i * 100}ms` }} />
                        ))
                    ) : teachers.length === 0 ? (
                        <div className="animate-fade-in glass-panel" style={{
                            gridColumn: '1 / -1', borderRadius: '20px',
                            padding: '60px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.8)',
                        }}>
                            <Users size={48} style={{ color: '#A1A5B7', marginBottom: '16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '16px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Teachers Found</h3>
                            <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>Add a new teacher or adjust your search criteria.</p>
                        </div>
                    ) : (
                        teachers.map((teacher, idx) => (
                            <div
                                key={teacher.id}
                                className="animate-fade-in glass-panel card-hover"
                                style={{
                                    borderRadius: '20px', padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.8)',
                                    animationDelay: `${Math.min(idx * 75, 800)}ms`,
                                }}
                            >
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.first_name + ' ' + teacher.last_name)}&background=random&color=fff&size=48&bold=true`}
                                        style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid #FFFFFF', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', flexShrink: 0 }}
                                        alt={teacher.first_name}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {teacher.first_name} {teacher.last_name}
                                            </h3>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '50px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                                background: teacher.employment_status === 'active' ? '#ECFDF5' : '#F8F9FD',
                                                color: teacher.employment_status === 'active' ? '#059669' : '#8F92A1',
                                                boxShadow: teacher.employment_status === 'active' ? '0 2px 6px rgba(16,185,129,0.1)' : 'none',
                                                marginLeft: '8px', flexShrink: 0
                                            }}>
                                                {teacher.employment_status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#A1A5B7', fontFamily: 'monospace', marginTop: '2px', fontWeight: 600 }}>
                                            EMP:{teacher.employee_id}
                                        </p>
                                        <div style={{ display: 'inline-block', marginTop: '6px' }}>
                                            <span style={{ fontSize: '11px', color: '#E53935', fontWeight: 700, background: '#FFF0F1', padding: '3px 8px', borderRadius: '6px' }}>
                                                {teacher.specialization || 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <Mail size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <Phone size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        {teacher.phone}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <BookOpen size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        Assigned to <strong style={{ color: '#1A1D3B' }}>&nbsp;{teacher.class_count || 0}&nbsp;</strong> classes
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <Award size={12} color="#8F92A1" strokeWidth={2.5} />
                                        </div>
                                        <strong style={{ color: '#1A1D3B' }}>{teacher.experience_years}&nbsp;</strong> years exp.
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(teacher)}
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
                                        onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                                        style={{
                                            flex: 1.5, padding: '10px',
                                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                                            color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700,
                                            fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '6px', transition: 'all 0.2s',
                                            boxShadow: '0 4px 12px rgba(26,29,59,0.3)',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget.style.transform = 'translateY(-2px)');
                                            (e.currentTarget.style.boxShadow = '0 6px 16px rgba(26,29,59,0.4)');
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget.style.transform = 'translateY(0)');
                                            (e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,29,59,0.3)');
                                        }}
                                    >
                                        View <ChevronRight size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {teachers.length >= 15 && (
                    <div className="animate-fade-in glass-panel" style={{
                        marginTop: '32px', padding: '24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.8)',
                    }}>
                        <p style={{ fontSize: '14px', color: '#A1A5B7', fontWeight: 500 }}>
                            Showing <span style={{ color: '#1A1D3B', fontWeight: 800 }}>1-15</span> of <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{teachers.length}</span> teachers
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button style={{
                                background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer',
                                color: '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                transition: 'all 0.2s', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                <ChevronLeft size={18} /> Prev
                            </button>
                            {[1, 2, 3].map(p => (
                                <button
                                    key={p}
                                    style={{
                                        background: p === 1 ? 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' : '#FFFFFF',
                                        color: p === 1 ? 'white' : '#1A1D3B',
                                        border: p === 1 ? 'none' : '1px solid #E2E8F0', width: '38px', height: '38px',
                                        borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '14px',
                                        boxShadow: p === 1 ? '0 4px 12px rgba(229,57,53,0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        if (p !== 1) (e.currentTarget.style.background = '#F8F9FD');
                                    }}
                                    onMouseLeave={e => {
                                        if (p !== 1) (e.currentTarget.style.background = '#FFFFFF');
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                            <span style={{ color: '#A1A5B7', padding: '0 4px', fontWeight: 600 }}>...</span>
                            <button style={{
                                background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1A1D3B',
                                width: '38px', height: '38px', borderRadius: '10px', fontWeight: 800,
                                cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                            }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                12
                            </button>
                            <button style={{
                                background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer',
                                color: '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                transition: 'all 0.2s', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingId ? 'Edit Teacher Details' : 'Onboard New Teacher'}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                            <input type="email" required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login Password {editingId ? <span style={{color: '#8F92A1', fontSize: '10px', textTransform: 'none'}}>(Leave blank to keep current)</span> : '*'}</label>
                            <input type="text" style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingId ? 'Enter new password' : 'Create password'} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualification</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specialization</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} placeholder="e.g. Mathematics, Physics" />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience (Years)</label>
                            <input type="number" required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
                        <select style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(false)}
                            style={{
                                padding: '12px 28px', background: '#FFFFFF', color: '#1A1D3B',
                                border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '12px 28px', background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                                cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(229,57,53,0.4)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(229,57,53,0.5)') }}
                            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(229,57,53,0.4)') }}
                        >
                            {editingId ? 'Save Updates' : 'Onboard Teacher'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { Users, Search, Plus, Mail, Phone, BookOpen, Award, ChevronRight, Download, Edit } from 'lucide-react';

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

    const inputStyle: React.CSSProperties = {
        padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px',
        fontSize: '14px', background: '#F8F9FD', color: '#1A1D3B',
        outline: 'none', width: '100%', transition: 'border-color 0.2s',
        fontFamily: 'Inter, sans-serif',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#5E6278',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>

                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Teacher Management
                        </h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Manage teaching staff, assignments, and performance.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{
                            background: '#FFFFFF', color: '#5E6278', border: '1px solid #F0F0F5',
                            borderRadius: '12px', padding: '11px 20px', fontSize: '14px',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4F60FF'; (e.currentTarget as HTMLElement).style.color = '#4F60FF'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#F0F0F5'; (e.currentTarget as HTMLElement).style.color = '#5E6278'; }}
                        >
                            <Download size={16} /> Export
                        </button>
                        <button
                            onClick={() => { setFormData(emptyForm); setEditingId(null); setIsAddOpen(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '12px', padding: '11px 22px', fontSize: '14px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            <Plus size={16} /> Add Teacher
                        </button>
                    </div>
                </div>

                {/* Search Filter */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: '#FFFFFF',
                        borderRadius: '12px', padding: '10px 18px', width: '380px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', gap: '10px',
                    }}>
                        <Search size={16} color="#A1A5B7" strokeWidth={2.5} />
                        <input
                            placeholder="Search teachers by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                flex: 1, fontSize: '14px', color: '#1A1D3B',
                            }}
                        />
                    </div>
                </div>

                {/* Teachers Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '18px' }} />
                        ))
                    ) : teachers.length === 0 ? (
                        <div style={{
                            gridColumn: '1 / -1', background: '#FFFFFF', borderRadius: '18px',
                            padding: '60px', textAlign: 'center', border: '1px solid #F0F0F5',
                        }}>
                            <Users size={48} style={{ color: '#A1A5B7', marginBottom: '16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Teachers Found</h3>
                            <p style={{ fontSize: '13px', color: '#A1A5B7' }}>Add a new teacher or adjust your search criteria.</p>
                        </div>
                    ) : (
                        teachers.map((teacher, idx) => (
                            <div
                                key={teacher.id}
                                className="animate-fade-in"
                                style={{
                                    background: '#FFFFFF', borderRadius: '18px', padding: '24px',
                                    border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    animationDelay: `${idx * 50}ms`, transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '54px', height: '54px', borderRadius: '14px', flexShrink: 0,
                                        background: teacher.gender === 'female' ? '#FCE7F3' : '#EEF0FF',
                                        color: teacher.gender === 'female' ? '#EC4899' : '#4F60FF',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', fontWeight: 800,
                                    }}>
                                        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>
                                                {teacher.first_name} {teacher.last_name}
                                            </h3>
                                            <span style={{
                                                padding: '3px 9px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                                                background: teacher.employment_status === 'active' ? '#D1FAE5' : '#F4F5F9',
                                                color: teacher.employment_status === 'active' ? '#059669' : '#8F92A1',
                                            }}>
                                                {teacher.employment_status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#A1A5B7', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {teacher.employee_id}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#4F60FF', fontWeight: 700, marginTop: '6px' }}>
                                            {teacher.specialization}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px', color: '#5E6278' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Mail size={13} color="#A1A5B7" />
                                        </div>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Phone size={13} color="#A1A5B7" />
                                        </div>
                                        {teacher.phone}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <BookOpen size={13} color="#A1A5B7" />
                                        </div>
                                        Assigned to {teacher.class_count || 0} classes
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Award size={13} color="#A1A5B7" />
                                        </div>
                                        {teacher.experience_years} years experience
                                    </div>
                                </div>

                                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #F0F0F5', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(teacher)}
                                        style={{
                                            flex: 1, padding: '9px', background: '#F4F5F9', color: '#5E6278',
                                            border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '13px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '6px', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF0FF'; (e.currentTarget as HTMLElement).style.color = '#4F60FF'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F4F5F9'; (e.currentTarget as HTMLElement).style.color = '#5E6278'; }}
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                                        style={{
                                            flex: 1, padding: '9px',
                                            background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                            color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600,
                                            fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '6px', transition: 'opacity 0.2s',
                                            boxShadow: '0 4px 10px rgba(79,96,255,0.25)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                    >
                                        View Profile <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingId ? 'Edit Teacher' : 'Add New Teacher'}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>First Name</label>
                            <input required style={inputStyle} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input required style={inputStyle} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" required style={inputStyle} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Login Password {editingId ? '(Leave blank to keep current)' : '*'}</label>
                            <input type="text" style={inputStyle} required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingId ? 'Enter new password' : 'Create password'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input required style={inputStyle} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Qualification</label>
                            <input required style={inputStyle} value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Specialization</label>
                            <input required style={inputStyle} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Experience (Years)</label>
                            <input type="number" required style={inputStyle} value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Gender</label>
                        <select style={inputStyle} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(false)}
                            style={{
                                padding: '10px 22px', background: '#F4F5F9', color: '#5E6278',
                                border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 22px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,96,255,0.3)',
                            }}
                        >
                            Save Teacher
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

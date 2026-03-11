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
            if (editingId) {
                await api.put(`/teachers/${editingId}`, formData);
            } else {
                await api.post('/teachers', formData);
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

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Teacher Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage teaching staff, assignments, and performance.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary"><Download size={16} /> Export</button>
                    <button className="btn btn-primary" onClick={() => { setFormData(emptyForm); setEditingId(null); setIsAddOpen(true); }}><Plus size={16} /> Add Teacher</button>
                </div>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="input-field"
                            placeholder="Search teachers by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '38px' }}
                        />
                    </div>
                </div>

                {/* Teachers Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />)
                    ) : teachers.length === 0 ? (
                        <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                            <Users size={48} />
                            <h3>No Teachers Found</h3>
                            <p>Add a new teacher or adjust your search criteria.</p>
                        </div>
                    ) : (
                        teachers.map((teacher, idx) => (
                            <div key={teacher.id} className="card hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, padding: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div className="avatar avatar-lg" style={{ background: teacher.gender === 'female' ? '#FCE7F3' : '#DBEAFE', color: teacher.gender === 'female' ? '#EC4899' : '#3B82F6' }}>
                                        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{teacher.first_name} {teacher.last_name}</h3>
                                            <span className={`badge ${teacher.employment_status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                {teacher.employment_status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {teacher.employee_id}
                                        </p>
                                        <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '6px' }}>
                                            {teacher.specialization}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={14} color="var(--text-tertiary)" /> {teacher.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={14} color="var(--text-tertiary)" /> {teacher.phone}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BookOpen size={14} color="var(--text-tertiary)" /> Assigned to {teacher.class_count || 0} classes
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Award size={14} color="var(--text-tertiary)" /> {teacher.experience_years} years experience
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)', display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleEdit(teacher)}>
                                        <Edit size={14} /> Edit
                                    </button>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => router.push(`/admin/teachers/${teacher.id}`)}>
                                        View Profile <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Teacher">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">First Name</label>
                            <input required className="input-field" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Last Name</label>
                            <input required className="input-field" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Email</label>
                            <input type="email" required className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Login Password {editingId ? '(Leave blank to keep current)' : '*'}</label>
                            <input type="text" className="input-field" required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingId ? 'Enter new password' : 'Create password'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Phone</label>
                            <input required className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Qualification</label>
                            <input required className="input-field" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Specialization</label>
                            <input required className="input-field" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Experience (Years)</label>
                            <input type="number" required className="input-field" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Teacher</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

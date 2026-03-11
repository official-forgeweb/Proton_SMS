'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { BookOpen, Search, Plus, Calendar, Clock, MapPin, Users, Download, Eye } from 'lucide-react';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        class_name: '', grade_level: '', subject: '', max_students: 30, class_time_start: '09:00', class_time_end: '10:00', primary_teacher_id: '', class_days: ['monday', 'wednesday', 'friday']
    });

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/classes', formData);
            setIsAddOpen(false);
            fetchClasses();
            setFormData({ class_name: '', grade_level: '', subject: '', max_students: 30, class_time_start: '09:00', class_time_end: '10:00', primary_teacher_id: '', class_days: ['monday', 'wednesday', 'friday'] });
        } catch (error) {
            console.error('Error adding class:', error);
            alert('Failed to add class');
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data);
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
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Class Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage batches, schedules, and class assignments.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary"><Download size={16} /> Export</button>
                    <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}><Plus size={16} /> Create Class</button>
                </div>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : classes.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} />
                            <h3>No Classes Found</h3>
                            <p>Create a new class to get started.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Class Code</th>
                                        <th>Name / Subject</th>
                                        <th>Teacher</th>
                                        <th>Schedule</th>
                                        <th>Students</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls, idx) => (
                                        <tr key={cls.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '13px' }}>
                                                    {cls.class_code}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{cls.class_name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{cls.grade_level} • {cls.subject}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="avatar avatar-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                        {cls.teacher_name?.[0] || 'T'}
                                                    </div>
                                                    <span style={{ fontSize: '13px' }}>{cls.teacher_name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                                        <Calendar size={12} /> {cls.class_days?.join(', ') || '-'}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
                                                        <Clock size={12} /> {cls.class_time_start} - {cls.class_time_end}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={14} color="var(--primary)" />
                                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{cls.current_students_count} / {cls.max_students}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${cls.status === 'ongoing' ? 'badge-success' : 'badge-neutral'}`}>
                                                    {cls.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/classes/${cls.id}`)}><Eye size={14} /> View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Class">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Class Name</label>
                            <input required className="input-field" value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Grade Level</label>
                            <input required className="input-field" value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Subject</label>
                            <input required className="input-field" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Max Students</label>
                            <input type="number" required className="input-field" value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Start Time</label>
                            <input type="time" required className="input-field" value={formData.class_time_start} onChange={e => setFormData({ ...formData, class_time_start: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">End Time</label>
                            <input type="time" required className="input-field" value={formData.class_time_end} onChange={e => setFormData({ ...formData, class_time_end: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Primary Teacher</label>
                        <select className="input-field" value={formData.primary_teacher_id} onChange={e => setFormData({ ...formData, primary_teacher_id: e.target.value })}>
                            <option value="">Select Teacher...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Class</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

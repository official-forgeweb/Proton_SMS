'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/stores/authStore';
import { PenTool, Plus, Clock, Users, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TeacherHomeworkPage() {
    const { user } = useAuthStore();
    const [homework, setHomework] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', class_id: '', subject: '', assigned_date: new Date().toISOString().split('T')[0], due_date: '', total_marks: 10
    });

    useEffect(() => {
        fetchHomework();
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const fetchHomework = () => {
        api.get('/homework').then(res => setHomework(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/homework', formData);
            setIsAddOpen(false);
            fetchHomework();
            setFormData({ title: '', description: '', class_id: '', subject: '', assigned_date: new Date().toISOString().split('T')[0], due_date: '', total_marks: 10 });
        } catch (error) {
            console.error('Error adding homework:', error);
            alert('Failed to add homework');
        }
    };

    return (
        <PermissionGuard permissionKey="homework">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Homework Assignments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Assign and track student homework progress.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}><Plus size={16} /> Assign Homework</button>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : homework.length === 0 ? (
                        <div className="empty-state">
                            <PenTool size={48} />
                            <h3>No Homework Found</h3>
                            <p>Assign new homework to students.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title / Subject</th>
                                        <th>Class</th>
                                        <th>Assigned Date</th>
                                        <th>Due Date</th>
                                        <th>Submissions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {homework.map((hw, idx) => (
                                        <tr key={hw.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{hw.title}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{hw.subject}</div>
                                            </td>
                                            <td><span style={{ fontSize: '13px' }}>{hw.class_name}</span></td>
                                            <td>
                                                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={12} color="var(--text-tertiary)" /> {hw.assigned_date}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${new Date(hw.due_date) < new Date() ? 'badge-error' : 'badge-warning'}`}>
                                                    {hw.due_date}
                                                </span>
                                            </td>
                                             <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="progress-bar" style={{ width: '80px' }}>
                                                            <div className="progress-fill" style={{ width: `${(hw.submitted / (hw.total_students || 1)) * 100}%`, background: 'var(--success)' }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{hw.submitted}/{hw.total_students}</span>
                                                    </div>
                                                    <Link href={`/teacher/homework/${hw.id}`}>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px 8px' }}>
                                                            <FileText size={14} /> View
                                                        </button>
                                                    </Link>
                                                </div>
                                             </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Assign New Homework">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Title</label>
                            <input required className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Subject</label>
                            <input required className="input-field" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Class</label>
                        <select required className="input-field" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                            <option value="">Select Class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea required className="input-field" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Assigned Date</label>
                            <input type="date" required className="input-field" value={formData.assigned_date} onChange={e => setFormData({ ...formData, assigned_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Due Date</label>
                            <input type="date" required className="input-field" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Total Marks</label>
                            <input type="number" required className="input-field" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Assign Homework</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
        </PermissionGuard>
    );
}

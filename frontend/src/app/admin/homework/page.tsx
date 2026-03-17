'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { PenTool, Plus, Clock, Users } from 'lucide-react';

export default function HomeworkPage() {
    const [homework, setHomework] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', class_id: '', subject: '',
        assigned_date: new Date().toISOString().split('T')[0], due_date: '', total_marks: 10
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

    const inputStyle: React.CSSProperties = {
        padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px',
        fontSize: '14px', background: '#F8F9FD', color: '#1A1D3B',
        outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#5E6278',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Homework Assignments</h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Assign and track student homework progress.
                        </p>
                    </div>
                    <button onClick={() => setIsAddOpen(true)} style={{ background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)' }}>
                        <Plus size={16} /> Assign Homework
                    </button>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading homework...</p>
                        </div>
                    ) : homework.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#A1A5B7' }}>
                            <PenTool size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Homework Found</h3>
                            <p style={{ fontSize: '13px' }}>Assign new homework to students.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        {['Title / Subject', 'Class', 'Assigned Date', 'Due Date', 'Submissions', 'Actions'].map((h, i) => (
                                            <th key={h} style={{ padding: '13px 16px', textAlign: i === 5 ? 'right' : 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {homework.map((hw, idx) => (
                                        <tr key={hw.id} style={{ borderBottom: '1px solid #F0F0F5', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{hw.title}</div>
                                                <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px', fontWeight: 500 }}>{hw.subject}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ background: '#EEF0FF', color: '#4F60FF', padding: '3px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 700 }}>{hw.class_name}</span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#5E6278', fontWeight: 500 }}>
                                                    <Clock size={12} color="#A1A5B7" /> {hw.assigned_date}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, background: new Date(hw.due_date) < new Date() ? '#FEE2E2' : '#FEF3C7', color: new Date(hw.due_date) < new Date() ? '#DC2626' : '#92400E' }}>
                                                    {hw.due_date}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1, height: '6px', background: '#F0F0F5', borderRadius: '50px', overflow: 'hidden', maxWidth: '80px' }}>
                                                        <div style={{ height: '100%', width: `${(hw.submitted / (hw.total_students || 1)) * 100}%`, background: 'linear-gradient(90deg, #4F60FF, #7B5EA7)', borderRadius: '50px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1A1D3B', whiteSpace: 'nowrap' }}>{hw.submitted}/{hw.total_students}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button style={{ background: '#EEF0FF', color: '#4F60FF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4F60FF'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EEF0FF'; (e.currentTarget as HTMLElement).style.color = '#4F60FF'; }}
                                                >
                                                    Review
                                                </button>
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
                            <label style={labelStyle}>Title</label>
                            <input required style={inputStyle} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input required style={inputStyle} value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Class</label>
                        <select required style={inputStyle} value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                            <option value="">Select Class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea required style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Assigned Date</label>
                            <input type="date" required style={inputStyle} value={formData.assigned_date} onChange={e => setFormData({ ...formData, assigned_date: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Due Date</label>
                            <input type="date" required style={inputStyle} value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Total Marks</label>
                            <input type="number" required style={inputStyle} value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '10px 22px', background: '#F4F5F9', color: '#5E6278', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,96,255,0.3)' }}>Assign Homework</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

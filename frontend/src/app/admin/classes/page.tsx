'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { BookOpen, Plus, Calendar, Clock, Users, Download, Eye } from 'lucide-react';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        class_name: '', grade_level: '', max_students: 30,
        status: 'upcoming', schedule: []
    });

    useEffect(() => { fetchClasses(); fetchTeachers(); }, []);

    const fetchTeachers = async () => {
        try { const res = await api.get('/teachers'); setTeachers(res.data.data); }
        catch (error) { console.error('Error fetching teachers:', error); }
    };

    const handleEdit = (cls: any) => {
        setEditingId(cls.id);
        setFormData({
            class_name: cls.class_name,
            grade_level: cls.grade_level,
            max_students: cls.max_students,
            status: cls.status,
            schedule: cls.schedule || []
        });
        setIsModalOpen(true);
    };

    const addSession = () => {
        setFormData({
            ...formData,
            schedule: [...formData.schedule, {
                subject: '', teacher_id: '', time_start: '09:00', time_end: '10:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }]
        });
    };

    const removeSession = (index: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule.splice(index, 1);
        setFormData({ ...formData, schedule: newSchedule });
    };

    const updateSession = (index: number, field: string, value: any) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setFormData({ ...formData, schedule: newSchedule });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: any = { ...formData };
            if (editingId) {
                await api.put(`/classes/${editingId}`, submitData);
            } else {
                await api.post('/classes', submitData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            fetchClasses();
            setFormData({ class_name: '', grade_level: '', max_students: 30, status: 'upcoming', schedule: [] });
        } catch (error) { console.error('Error saving batch:', error); alert('Failed to save batch'); }
    };

    const fetchClasses = async () => {
        try { const res = await api.get('/classes'); setClasses(res.data.data); }
        catch (error) { console.error(error); }
        finally { setIsLoading(false); }
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
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Batch Management
                        </h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Manage batches, individual classes, and teacher assignments.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{
                            background: '#FFFFFF', color: '#5E6278', border: '1px solid #F0F0F5',
                            borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                        }}>
                            <Download size={16} /> Export
                        </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ class_name: '', grade_level: '', max_students: 30, status: 'upcoming', schedule: [] });
                                    setIsModalOpen(true);
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                                    color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px',
                                    fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center',
                                    gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229,57,53,0.3)',
                                }}
                            >
                                <Plus size={16} /> Create Class
                            </button>
                    </div>
                </div>

                {/* Main Card */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', overflow: 'hidden',
                }}>
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading classes...</p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#A1A5B7' }}>
                            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Classes Found</h3>
                            <p style={{ fontSize: '13px' }}>Create a new class to get started.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        {['Batch Code', 'Batch Name', 'Subjects / Teachers', 'Time Slots', 'Capacity', 'Status', 'Actions'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '13px 16px', textAlign: i === 6 ? 'right' : 'left',
                                                color: '#A1A5B7', fontWeight: 600, fontSize: '11px',
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls, idx) => (
                                        <tr key={cls.id}
                                            style={{ borderBottom: '1px solid #F0F0F5', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ fontWeight: 700, color: '#E53935', fontFamily: 'monospace', fontSize: '13px', background: '#FFEBEE', padding: '3px 8px', borderRadius: '6px' }}>
                                                    {cls.class_code}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{cls.class_name}</div>
                                                <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px' }}>{cls.grade_level}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? cls.schedule.map((s: any, i: number) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#FFEBEE', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                                                                {s.subject?.[0] || 'S'}
                                                            </div>
                                                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#5E6278' }}>
                                                                {s.subject} <span style={{ color: '#A1A5B7' }}>• {teachers.find(t => t.id === (s.teacher_id?._id || s.teacher_id))?.first_name || 'Unassigned'}</span>
                                                            </span>
                                                        </div>
                                                    )) : <span style={{ fontSize: '12px', color: '#A1A5B7' }}>No classes scheduled</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#5E6278', fontWeight: 500 }}>
                                                                <Clock size={12} color="#A1A5B7" /> {cls.schedule[0].time_start} – {cls.schedule[cls.schedule.length - 1].time_end}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#A1A5B7' }}>
                                                                <span style={{ fontSize: '11px' }}>{cls.schedule.length} sessions scheduled</span>
                                                            </div>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={14} color="#E53935" />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>{cls.current_students_count} / {cls.max_students}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700,
                                                    background: cls.status === 'ongoing' ? '#D1FAE5' : '#F4F5F9',
                                                    color: cls.status === 'ongoing' ? '#059669' : '#8F92A1',
                                                }}>
                                                    {cls.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleEdit(cls)}
                                                    style={{
                                                        background: '#F4F5F9', color: '#5E6278', border: 'none',
                                                        borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/classes/${cls.id}`)}
                                                    style={{
                                                        background: '#FFEBEE', color: '#E53935', border: 'none',
                                                        borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E53935'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFEBEE'; (e.currentTarget as HTMLElement).style.color = '#E53935'; }}
                                                >
                                                    <Eye size={13} /> View
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Batch" : "Create New Batch"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Batch Name</label>
                            <input required style={inputStyle} value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="e.g. 10th Grade Morning Batch" />
                        </div>
                        <div>
                            <label style={labelStyle}>Grade/Level</label>
                            <input required style={inputStyle} value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g. Class 10" />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Students (Capacity)</label>
                            <input type="number" required style={inputStyle} value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #F0F0F5', paddingTop: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>Class Schedule (Sessions)</h4>
                            <button type="button" onClick={addSession} style={{ padding: '6px 12px', background: '#FFEBEE', color: '#E53935', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={14} /> Add Session
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {formData.schedule && formData.schedule.map((session: any, i: number) => (
                                <div key={i} style={{ padding: '16px', background: '#F8F9FD', borderRadius: '12px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                                    <button type="button" onClick={() => removeSession(i)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#A1A5B7', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '11px' }}>Subject</label>
                                            <input required style={inputStyle} value={session.subject} onChange={e => updateSession(i, 'subject', e.target.value)} placeholder="e.g. Mathematics" />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '11px' }}>Teacher</label>
                                            <select required style={inputStyle} value={session.teacher_id?._id || session.teacher_id} onChange={e => updateSession(i, 'teacher_id', e.target.value)}>
                                                <option value="">Select Teacher...</option>
                                                {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '11px' }}>Start Time</label>
                                            <input type="time" required style={inputStyle} value={session.time_start} onChange={e => updateSession(i, 'time_start', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '11px' }}>End Time</label>
                                            <input type="time" required style={inputStyle} value={session.time_end} onChange={e => updateSession(i, 'time_end', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!formData.schedule || formData.schedule.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '24px', background: '#F8F9FD', borderRadius: '12px', border: '1px dashed #D1D5DB', color: '#A1A5B7', fontSize: '13px' }}>
                                    No sessions added. Click "Add Session" to include subjects and teachers in this batch.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #F0F0F5', paddingTop: '16px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <label style={labelStyle}>Batch Status</label>
                            <select style={{ ...inputStyle, width: '150px' }} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 22px', background: '#F4F5F9', color: '#5E6278', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>{editingId ? "Update Batch" : "Create Batch"}</button>
                        </div>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

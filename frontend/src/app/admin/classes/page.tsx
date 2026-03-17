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
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        class_name: '', grade_level: '', subject: '', max_students: 30,
        class_time_start: '09:00', class_time_end: '10:00',
        primary_teacher_id: '', class_days: ['monday', 'wednesday', 'friday']
    });

    useEffect(() => { fetchClasses(); fetchTeachers(); }, []);

    const fetchTeachers = async () => {
        try { const res = await api.get('/teachers'); setTeachers(res.data.data); }
        catch (error) { console.error('Error fetching teachers:', error); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: any = { ...formData };
            if (!submitData.primary_teacher_id) delete submitData.primary_teacher_id;
            
            await api.post('/classes', submitData);
            setIsAddOpen(false);
            fetchClasses();
            setFormData({ class_name: '', grade_level: '', subject: '', max_students: 30, class_time_start: '09:00', class_time_end: '10:00', primary_teacher_id: '', class_days: ['monday', 'wednesday', 'friday'] });
        } catch (error) { console.error('Error adding class:', error); alert('Failed to add class'); }
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
                            Class Management
                        </h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Manage batches, schedules, and class assignments.
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
                            onClick={() => setIsAddOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px',
                                fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center',
                                gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)',
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
                                        {['Class Code', 'Name / Subject', 'Teacher', 'Schedule', 'Students', 'Status', 'Actions'].map((h, i) => (
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
                                                <span style={{ fontWeight: 700, color: '#4F60FF', fontFamily: 'monospace', fontSize: '13px', background: '#EEF0FF', padding: '3px 8px', borderRadius: '6px' }}>
                                                    {cls.class_code}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{cls.class_name}</div>
                                                <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px' }}>{cls.grade_level} • {cls.subject}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '8px',
                                                        background: '#EEF0FF', color: '#4F60FF',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '12px', fontWeight: 800,
                                                    }}>
                                                        {cls.teacher_name?.[0] || 'T'}
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#5E6278' }}>{cls.teacher_name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#5E6278', fontWeight: 500 }}>
                                                        <Calendar size={12} color="#A1A5B7" /> {cls.class_days?.join(', ') || '-'}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#A1A5B7' }}>
                                                        <Clock size={12} /> {cls.class_time_start} – {cls.class_time_end}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={14} color="#4F60FF" />
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
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => router.push(`/admin/classes/${cls.id}`)}
                                                    style={{
                                                        background: '#EEF0FF', color: '#4F60FF', border: 'none',
                                                        borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4F60FF'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EEF0FF'; (e.currentTarget as HTMLElement).style.color = '#4F60FF'; }}
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

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Class">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Class Name</label>
                            <input required style={inputStyle} value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Grade Level</label>
                            <input required style={inputStyle} value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input required style={inputStyle} value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Students</label>
                            <input type="number" required style={inputStyle} value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Start Time</label>
                            <input type="time" required style={inputStyle} value={formData.class_time_start} onChange={e => setFormData({ ...formData, class_time_start: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>End Time</label>
                            <input type="time" required style={inputStyle} value={formData.class_time_end} onChange={e => setFormData({ ...formData, class_time_end: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Primary Teacher</label>
                        <select style={inputStyle} value={formData.primary_teacher_id} onChange={e => setFormData({ ...formData, primary_teacher_id: e.target.value })}>
                            <option value="">Select Teacher...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '10px 22px', background: '#F4F5F9', color: '#5E6278', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,96,255,0.3)' }}>Save Class</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

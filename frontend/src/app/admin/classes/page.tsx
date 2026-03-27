'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { BookOpen, Plus, Calendar, Clock, Users, Download, Eye, Layers, Edit } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        class_name: '', grade_level: '', max_students: 30,
        status: 'upcoming', schedule: [], start_date: ''
    });

    const formatTime = (time: string) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${m} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
            schedule: cls.schedule || [],
            start_date: cls.start_date || ''
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
            setFormData({ class_name: '', grade_level: '', max_students: 30, status: 'upcoming', schedule: [], start_date: '' });
        } catch (error) { console.error('Error saving batch:', error); alert('Failed to save batch'); }
    };

    const fetchClasses = async () => {
        try { const res = await api.get('/classes'); setClasses(res.data.data); }
        catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };

    const inputStyle: React.CSSProperties = {
        padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px',
        fontSize: '14px', background: '#F8F9FD', color: '#1A1D3B',
        outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif', transition: 'border 0.2s',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '13px', fontWeight: 700, color: '#1A1D3B',
        display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
    };

    const customStyles = `
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
        .table-row-hover {
            transition: all 0.2s ease;
        }
        .table-row-hover:hover {
            background: #F8F9FD;
            transform: scale(1.005);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .table-row-hover:hover td:first-child {
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
        }
        .table-row-hover:hover td:last-child {
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.15) 0px, transparent 50%);
        }
        
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px;
            font-size: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%;
            font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus {
            border-color: #E53935;
        }
        .react-datepicker {
            font-family: 'Inter', sans-serif; border-radius: 16px; border: 1px solid #E2E8F0;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;
        }
        .react-datepicker__header { background-color: #F8F9FD; border-bottom: 1px solid #E2E8F0; padding-top: 12px; }
        .react-datepicker__day--selected, .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
            background-color: #E53935 !important; font-weight: bold;
        }
    `;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: customStyles}} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: '#E53935', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Layers size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Batch Management
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Classes & Batches</span>
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
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ class_name: '', grade_level: '', max_students: 30, status: 'upcoming', schedule: [], start_date: '' });
                                setIsModalOpen(true);
                            }}
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
                            <Plus size={20} strokeWidth={2.5} /> Create Class
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="animate-fade-in glass-panel" style={{
                    borderRadius: '24px', padding: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '100ms'
                }}>
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}>
                            <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                            </div>
                            <p style={{ color: '#1A1D3B', fontSize: '15px', fontWeight: 600 }}>Loading classes...</p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                            <BookOpen size={56} style={{ marginBottom: '20px', color: '#A1A5B7', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Classes Found</h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>Create a new class to get started.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', minWidth: '850px' }}>
                                <thead>
                                    <tr>
                                        {['Batch Info', 'Subjects / Teachers', 'Time Slots', 'Capacity', 'Status', 'Actions'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '16px 20px', textAlign: i === 5 ? 'right' : 'left',
                                                color: '#A1A5B7', fontWeight: 700, fontSize: '12px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls, idx) => (
                                        <tr key={cls.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/classes/${cls.id}`)}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B' }}>{cls.class_name}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 700, color: '#E53935', fontFamily: 'monospace', fontSize: '12px', background: '#FFF0F1', padding: '4px 8px', borderRadius: '6px' }}>
                                                            {cls.class_code}
                                                        </span>
                                                        <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>{cls.grade_level}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? cls.schedule.map((s: any, i: number) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFF0F1', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                                                                {s.subject?.[0] || 'S'}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', lineHeight: 1 }}>{s.subject}</span>
                                                                <span style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 500 }}>{teachers.find(t => t.id === (s.teacher_id?._id || s.teacher_id))?.first_name || 'Unassigned'}</span>
                                                            </div>
                                                        </div>
                                                    )) : <span style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500, fontStyle: 'italic' }}>No schedule</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1A1D3B', fontWeight: 600 }}>
                                                                <Clock size={14} color="#A1A5B7" strokeWidth={2.5} /> {formatTime(cls.schedule[0].time_start)} – {formatTime(cls.schedule[cls.schedule.length - 1].time_end)}
                                                            </div>
                                                            <div style={{ color: '#8F92A1', fontWeight: 500 }}>{cls.schedule.length} sessions/wk</div>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8F9FD', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                    <Users size={16} color="#E53935" strokeWidth={2.5} />
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>{cls.current_students_count} <span style={{ color: '#A1A5B7', fontWeight: 600 }}>/ {cls.max_students}</span></span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                                    <span style={{
                                                        padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                        background: cls.status === 'ongoing' ? '#ECFDF5' : cls.status === 'upcoming' ? '#FEF3C7' : '#F8F9FD',
                                                        color: cls.status === 'ongoing' ? '#059669' : cls.status === 'upcoming' ? '#D97706' : '#8F92A1',
                                                        boxShadow: cls.status === 'ongoing' ? '0 2px 6px rgba(16,185,129,0.1)' : 'none'
                                                    }}>
                                                        {cls.status}
                                                    </span>
                                                    {cls.status === 'upcoming' && cls.start_date && (
                                                        <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                            <Calendar size={12} strokeWidth={2.5} /> {formatDate(cls.start_date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}
                                                    style={{
                                                        background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                                                        borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                                                >
                                                    <Edit size={14} strokeWidth={2.5} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/classes/${cls.id}`); }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none',
                                                        borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(26,29,59,0.2)'
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); }}
                                                >
                                                    <Eye size={14} strokeWidth={2.5} /> View
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Batch Details" : "Create New Batch"}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Batch Name</label>
                            <input required style={inputStyle} value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="e.g. Proton 1" onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Grade/Level</label>
                            <input required style={inputStyle} value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g. Class 11" onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Max Students <span style={{textTransform:'none', color:'#8F92A1'}}>(Capacity)</span></label>
                            <input type="number" required style={inputStyle} value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <div style={{width:'32px', height:'32px', background:'#FFF0F1', borderRadius:'10px', color:'#E53935', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    <Clock size={16} strokeWidth={2.5} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily:'Poppins, sans-serif' }}>Class Schedule (Sessions)</h4>
                            </div>
                            <button type="button" onClick={addSession} style={{ padding: '8px 16px', background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow:'0 2px 4px rgba(0,0,0,0.02)', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='#F8F9FD')} onMouseLeave={e=>(e.currentTarget.style.background='#FFFFFF')}>
                                <Plus size={16} strokeWidth={2.5} /> Add Session
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {formData.schedule && formData.schedule.map((session: any, i: number) => (
                                <div key={i} style={{ padding: '24px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                    <button type="button" onClick={() => removeSession(i)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FEE2E2', color: '#EF4444', width:'28px', height:'28px', borderRadius:'8px', border: 'none', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='#FECACA')} onMouseLeave={e=>(e.currentTarget.style.background='#FEE2E2')}>×</button>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '12px' }}>Subject</label>
                                            <input required style={inputStyle} value={session.subject} onChange={e => updateSession(i, 'subject', e.target.value)} placeholder="e.g. Mathematics" onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '12px' }}>Teacher</label>
                                            <select required style={inputStyle} value={session.teacher_id?._id || session.teacher_id} onChange={e => updateSession(i, 'teacher_id', e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                                                <option value="">Select Teacher...</option>
                                                {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '12px' }}>Start Time</label>
                                            <DatePicker
                                                selected={session.time_start ? new Date(`2000-01-01T${session.time_start}:00`) : null}
                                                onChange={(date) => {
                                                    if (date) {
                                                        const time = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                                                        updateSession(i, 'time_start', time);
                                                    }
                                                }}
                                                showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" placeholderText="Start Time"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '12px' }}>End Time</label>
                                            <DatePicker
                                                selected={session.time_end ? new Date(`2000-01-01T${session.time_end}:00`) : null}
                                                onChange={(date) => {
                                                    if (date) {
                                                        const time = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                                                        updateSession(i, 'time_end', time);
                                                    }
                                                }}
                                                showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" placeholderText="End Time"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!formData.schedule || formData.schedule.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '32px', background: '#F8F9FD', borderRadius: '16px', border: '2px dashed #E2E8F0', color: '#A1A5B7', fontSize: '14px', fontWeight: 600 }}>
                                    No sessions configured yet.<br/><span style={{fontSize:'13px', fontWeight:500}}>Click "Add Session" to assign subjects and teachers.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Batch Status</label>
                                <select style={{ ...inputStyle, width: '180px' }} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            {formData.status === 'upcoming' && (
                                <div>
                                    <label style={labelStyle}>Starts From</label>
                                    <DatePicker
                                        showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                        selected={formData.start_date ? new Date(formData.start_date) : null}
                                        onChange={(date) => {
                                            if (date) {
                                                const dateStr = date.toISOString().split('T')[0];
                                                setFormData({ ...formData, start_date: dateStr });
                                            }
                                        }}
                                        dateFormat="MMMM d, yyyy" placeholderText="Pick Start Date"
                                    />
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 28px', background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>Cancel</button>
                            <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(229,57,53,0.4)', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(229,57,53,0.5)') }} onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(229,57,53,0.4)') }}>{editingId ? "Update Batch" : "Create Batch"}</button>
                        </div>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

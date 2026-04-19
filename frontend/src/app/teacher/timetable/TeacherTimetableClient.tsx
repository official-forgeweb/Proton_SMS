'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    Calendar, Plus, Clock, Trash2, Edit2, 
    X, MapPin, User, ChevronRight, Filter, BookOpen
} from 'lucide-react';

interface Props {
  initialTimetable: any[];
  initialClasses: any[];
  initialFilters: { start_date: string; end_date: string };
  teacherProfile: any;
}

export default function TeacherTimetableClient({ initialTimetable, initialClasses, initialFilters, teacherProfile }: Props) {
    const [timetable, setTimetable] = useState<any[]>(initialTimetable);
    const [classes, setClasses] = useState<any[]>(initialClasses);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);

    const [formData, setFormData] = useState({
        class_id: '',
        subject: '',
        teacher_id: teacherProfile?.id || '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        room: '',
        notes: ''
    });

    const [filters, setFilters] = useState({
        class_id: '',
        start_date: initialFilters.start_date,
        end_date: initialFilters.end_date
    });

    const [localFilters, setLocalFilters] = useState({ subject: '', room: '' });
    const [sortBy, setSortBy] = useState('date_asc');

    const fetchTimetable = useCallback(async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (filters.class_id) params.class_id = filters.class_id;
            if (filters.start_date && filters.end_date) {
                params.start_date = filters.start_date;
                params.end_date = filters.end_date;
            }
            const res = await api.get('/timetable', { params });
            setTimetable(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const isInitial = filters.class_id === '' && filters.start_date === initialFilters.start_date && filters.end_date === initialFilters.end_date;
        if (!isInitial) {
            fetchTimetable();
        }
    }, [filters, fetchTimetable, initialFilters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, teacher_id: teacherProfile?.id };
            if (editingEntry) {
                await api.put(`/timetable/${editingEntry.id}`, payload);
            } else {
                await api.post('/timetable', payload);
            }
            setShowModal(false);
            setEditingEntry(null);
            fetchTimetable();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error saving schedule.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this from your schedule?')) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error deleting schedule.');
        }
    };

    const openModal = (entry: any = null) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                class_id: entry.class_id,
                subject: entry.subject,
                teacher_id: teacherProfile?.id || '',
                date: entry.date,
                start_time: entry.start_time,
                end_time: entry.end_time || '',
                room: entry.room || '',
                notes: entry.notes || ''
            });
        } else {
            setEditingEntry(null);
            setFormData({
                class_id: '', subject: '', teacher_id: teacherProfile?.id || '',
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00', end_time: '10:00', room: '', notes: ''
            });
        }
        setShowModal(true);
    };

    const subjectColors: Record<string, { bg: string; color: string; accent: string }> = {
        'Physics': { bg: '#EFF6FF', color: '#1D4ED8', accent: '#3B82F6' },
        'Chemistry': { bg: '#FFF7ED', color: '#C2410C', accent: '#F97316' },
        'Mathematics': { bg: '#F5F3FF', color: '#6D28D9', accent: '#8B5CF6' },
        'Maths': { bg: '#F5F3FF', color: '#6D28D9', accent: '#8B5CF6' },
        'Biology': { bg: '#F0FDF4', color: '#15803D', accent: '#22C55E' },
        'English': { bg: '#FDF2F8', color: '#BE185D', accent: '#EC4899' },
    };

    const getSubjectStyle = (subject: string) => subjectColors[subject] || { bg: '#F8F9FD', color: '#5E6278', accent: '#8F92A1' };

    // Apply local filters and sorting
    const filteredTimetable = [...timetable]
        .filter(entry => {
            if (localFilters.subject && entry.subject !== localFilters.subject) return false;
            if (localFilters.room && entry.room && !entry.room.toLowerCase().includes(localFilters.room.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime() || a.start_time.localeCompare(b.start_time);
            if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime() || b.start_time.localeCompare(a.start_time);
            if (sortBy === 'subject_asc') return a.subject.localeCompare(b.subject);
            if (sortBy === 'subject_desc') return b.subject.localeCompare(a.subject);
            return 0;
        });

    return (
        <>
            {/* Premium Header */}
            <div className="page-header" style={{ marginBottom: '36px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935, #B71C1C)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                                <Calendar size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1A1D3B', margin: 0, letterSpacing: '-0.03em' }}>My Schedule</h1>
                        </div>
                        <p style={{ color: '#5E6278', fontSize: '16px', marginTop: '6px', fontWeight: 500 }}>View and manage your upcoming classes.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <button 
                            onClick={() => openModal()}
                            className="hover-lift"
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none', padding: '12px 24px',
                                borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                boxShadow: '0 4px 15px rgba(229, 57, 53, 0.3)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(229, 57, 53, 0.4)';
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(229, 57, 53, 0.3)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Schedule Class
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Filters Card */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Select Class</label>
                            <select 
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }}
                            >
                                <option value="">All My Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Start Date</label>
                            <DatePicker 
                                selected={filters.start_date ? new Date(filters.start_date) : null}
                                onChange={(date: Date | null) => setFilters({ ...filters, start_date: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="MMMM d, yyyy"
                                customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }} />}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>End Date</label>
                            <DatePicker 
                                selected={filters.end_date ? new Date(filters.end_date) : null}
                                onChange={(date: Date | null) => setFilters({ ...filters, end_date: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="MMMM d, yyyy"
                                customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }} />}
                            />
                        </div>
                    </div>
                    
                    {/* Local filters */}
                    <div style={{ padding: '20px 0 0 0', borderTop: '1px solid #F1F4F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Subject</label>
                            <select 
                                value={localFilters.subject}
                                onChange={(e) => setLocalFilters({ ...localFilters, subject: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
                            >
                                <option value="">All Subjects</option>
                                {Array.from(new Set(timetable.map(t => t.subject).filter(Boolean))).map((s: any) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Room</label>
                            <select 
                                value={localFilters.room}
                                onChange={(e) => setLocalFilters({ ...localFilters, room: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
                            >
                                <option value="">All Rooms</option>
                                {Array.from(new Set(timetable.map(t => t.room).filter(Boolean))).map((r: any) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Sort By</label>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
                            >
                                <option value="date_asc">Date (Oldest First)</option>
                                <option value="date_desc">Date (Newest First)</option>
                                <option value="subject_asc">Subject (A-Z)</option>
                                <option value="subject_desc">Subject (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>
                        {filteredTimetable.length} {filteredTimetable.length === 1 ? 'class' : 'classes'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>scheduled</span>
                </div>

                {/* Entries */}
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
                    </div>
                ) : filteredTimetable.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <Calendar size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No classes scheduled</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>You have no classes scheduled for this period.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {filteredTimetable.map((entry) => {
                            const sc = getSubjectStyle(entry.subject);
                            const isToday = entry.date === new Date().toISOString().split('T')[0];
                            return (
                                <div key={entry.id} className="card hover-lift" style={{ 
                                    padding: '0', borderRadius: '20px', display: 'flex', alignItems: 'stretch',
                                    background: '#FFFFFF', border: `1px solid ${isToday ? sc.accent + '40' : '#E2E8F0'}`,
                                    overflow: 'hidden', transition: 'all 0.3s'
                                }}>
                                    {/* Left accent */}
                                    <div style={{ width: '5px', background: sc.accent, flexShrink: 0 }} />
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ textAlign: 'center', minWidth: '70px', padding: '10px', background: isToday ? '#FFF0F1' : '#F8F9FD', borderRadius: '14px', border: `1px solid ${isToday ? '#FECACA' : '#E2E8F0'}` }}>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: isToday ? '#E53935' : '#8F92A1', textTransform: 'uppercase' }}>
                                                    {isToday ? 'TODAY' : new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B' }}>
                                                    {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: '10px', fontWeight: 600, color: '#8F92A1' }}>
                                                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '8px', background: sc.bg, color: sc.color, fontWeight: 800 }}>
                                                        {entry.class_ref?.class_name}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                        <Clock size={14} color={sc.accent} /> {entry.start_time} - {entry.end_time}
                                                    </span>
                                                    {entry.room && (
                                                        <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                            <MapPin size={14} color="#A1A5B7" /> {entry.room}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openModal(entry)} style={{ padding: '10px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#E3F2FD'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FD'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                            >
                                                <Edit2 size={16} color="#5E6278" />
                                            </button>
                                            <button onClick={() => handleDelete(entry.id)} style={{ padding: '10px', borderRadius: '12px', background: '#FFF5F5', border: '1px solid #FEE2E2', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#FECACA'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#FEE2E2'; }}
                                            >
                                                <Trash2 size={16} color="#E53935" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '540px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F8F9FD', border: 'none', cursor: 'pointer', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} color="#A1A5B7" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935, #B71C1C)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Calendar size={20} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                {editingEntry ? 'Edit Schedule' : 'Schedule New Class'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Class</label>
                                    <select 
                                        required value={formData.class_id}
                                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value, subject: '', start_time: '09:00', end_time: '10:00' })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                                    >
                                        <option value="">Select a Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Subject</label>
                                    <select 
                                        required value={formData.subject}
                                        onChange={(e) => {
                                            const subject = e.target.value;
                                            const selectedClass = classes.find(c => c.id === formData.class_id);
                                            let newStartTime = formData.start_time;
                                            let newEndTime = formData.end_time;
                                            if (selectedClass?.schedule) {
                                                const sched = selectedClass.schedule.find((s: any) => s.subject === subject);
                                                if (sched) {
                                                    if (sched.time_start) newStartTime = sched.time_start;
                                                    if (sched.time_end) newEndTime = sched.time_end;
                                                }
                                            }
                                            setFormData({ ...formData, subject, start_time: newStartTime, end_time: newEndTime });
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', background: !formData.class_id ? '#F8F9FD' : '#FFFFFF', fontSize: '14px', fontWeight: 600 }}
                                        disabled={!formData.class_id}
                                    >
                                        <option value="">{formData.class_id ? "Select a Subject" : "Select a Class first"}</option>
                                        {formData.class_id && classes.find(c => c.id === formData.class_id) && 
                                            Array.from(new Set([
                                                classes.find(c => c.id === formData.class_id)?.subject,
                                                ...(classes.find(c => c.id === formData.class_id)?.schedule || []).map((s: any) => s.subject)
                                            ].filter(Boolean))).map(subject => (
                                                <option key={subject as string} value={subject as string}>{subject as string}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Date</label>
                                    <DatePicker
                                        required
                                        selected={formData.date ? new Date(formData.date) : null}
                                        onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })}
                                        dateFormat="MMMM d, yyyy"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Start</label>
                                        <DatePicker
                                            required
                                            selected={formData.start_time ? new Date(`2000-01-01T${formData.start_time}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, start_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>End</label>
                                        <DatePicker
                                            selected={formData.end_time ? new Date(`2000-01-01T${formData.end_time}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, end_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />}
                                        />
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Room / Notes</label>
                                    <input 
                                        type="text" placeholder="Room 101, Online link, etc."
                                        value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                                    />
                                </div>
                            </div>
                            <button type="submit" style={{
                                width: '100%', padding: '14px', marginTop: '10px',
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none', borderRadius: '14px',
                                fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(229, 57, 53, 0.3)',
                                transition: 'all 0.2s'
                            }}>
                                {editingEntry ? 'Update Schedule' : 'Confirm Scheduling'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

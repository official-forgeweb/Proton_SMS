'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    Calendar, Plus, Clock, Trash2, Edit2, AlertTriangle, 
    CheckCircle, X, MapPin, User, ChevronRight, Filter
} from 'lucide-react';

interface Props {
  initialTimetable: any[];
  initialClasses: any[];
  initialTeachers: any[];
  initialFilters: { start_date: string; end_date: string };
}

export default function AdminTimetableClient({ initialTimetable, initialClasses, initialTeachers, initialFilters }: Props) {
    const [timetable, setTimetable] = useState<any[]>(initialTimetable);
    const [classes, setClasses] = useState<any[]>(initialClasses);
    const [teachers, setTeachers] = useState<any[]>(initialTeachers);
    const [isLoading, setIsLoading] = useState(false); // Initially false because we have initialData
    const [showModal, setShowModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);

    const [generateData, setGenerateData] = useState({
        class_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    const [formData, setFormData] = useState({
        class_id: '',
        subject: '',
        teacher_id: '',
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

    const [localFilters, setLocalFilters] = useState({
        subject: '',
        teacher_id: '',
        room: ''
    });
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

    // Only refetch when filters change (ignoring initial mount)
    useEffect(() => {
        // We skip the very first render because we have initialData
        // A simple heuristic: if filters haven't changed from initialFilters, we don't fetch.
        // Actually it's easier to just fetch whenever filters change and not worry about first render
        // But to avoid double fetch, we can use a ref or just let it fetch (very fast locally).
        // For precision, let's only fetch if it differs from initial.
        const isInitial = filters.class_id === '' && filters.start_date === initialFilters.start_date && filters.end_date === initialFilters.end_date;
        if (!isInitial) {
            fetchTimetable();
        }
    }, [filters, fetchTimetable, initialFilters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEntry) {
                await api.put(`/timetable/${editingEntry.id}`, formData);
            } else {
                await api.post('/timetable', formData);
            }
            setShowModal(false);
            setEditingEntry(null);
            fetchTimetable();
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const res = await api.post('/timetable/generate', generateData);
            alert(res.data.message);
            setShowGenerateModal(false);
            fetchTimetable();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to generate timetable');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
        } catch (error) {
            console.error(error);
        }
    };

    const openModal = (entry: any = null) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData({
                class_id: entry.class_id,
                subject: entry.subject,
                teacher_id: entry.teacher_id || '',
                date: entry.date,
                start_time: entry.start_time,
                end_time: entry.end_time || '',
                room: entry.room || '',
                notes: entry.notes || ''
            });
        } else {
            setEditingEntry(null);
            setFormData({
                class_id: '',
                subject: '',
                teacher_id: '',
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00',
                room: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    return (
        <>
            <div className="page-header" style={{ marginBottom: '36px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1A1D3B', margin: 0, letterSpacing: '-0.03em' }}>Timetable Management</h1>
                        <p style={{ color: '#5E6278', fontSize: '16px', marginTop: '6px', fontWeight: 500 }}>Schedule date-specific classes and assignments.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <button 
                            onClick={() => setShowGenerateModal(true)}
                            className="hover-lift"
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', 
                                background: 'white', color: '#1A1D3B', 
                                border: '1px solid #E2E8F0', padding: '12px 20px', 
                                borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = '#1A1D3B';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                            }}
                        >
                            <Calendar size={18} /> Auto-Generate Timetable
                        </button>
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
                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Select Class</label>
                            <select 
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                            >
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Start Date</label>
                            <DatePicker 
                                selected={filters.start_date ? new Date(filters.start_date) : null}
                                onChange={(date: Date | null) => setFilters({ ...filters, start_date: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="MMMM d, yyyy"
                                customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>End Date</label>
                            <DatePicker 
                                selected={filters.end_date ? new Date(filters.end_date) : null}
                                onChange={(date: Date | null) => setFilters({ ...filters, end_date: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="MMMM d, yyyy"
                                customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                            />
                        </div>
                    </div>
                    
                    {/* Local Timetable Filters & Sorting */}
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Teacher</label>
                            <select 
                                value={localFilters.teacher_id}
                                onChange={(e) => setLocalFilters({ ...localFilters, teacher_id: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13px' }}
                            >
                                <option value="">All Teachers</option>
                                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
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

                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
                    </div>
                ) : timetable.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <Calendar size={48} color="#A1A5B7" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No schedule found</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>There are no classes scheduled for this period.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[...timetable]
                            .filter(entry => {
                                if (localFilters.subject && entry.subject !== localFilters.subject) return false;
                                if (localFilters.teacher_id && entry.teacher_id !== localFilters.teacher_id) return false;
                                if (localFilters.room && entry.room && !entry.room.toLowerCase().includes(localFilters.room.toLowerCase())) return false;
                                return true;
                            })
                            .sort((a, b) => {
                                if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime() || a.start_time.localeCompare(b.start_time);
                                if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime() || b.start_time.localeCompare(a.start_time);
                                if (sortBy === 'subject_asc') return a.subject.localeCompare(b.subject);
                                if (sortBy === 'subject_desc') return b.subject.localeCompare(a.subject);
                                return 0;
                            })
                            .map((entry) => (
                            <div key={entry.id} className="card hover-lift" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ textAlign: 'center', minWidth: '80px', padding: '12px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', textTransform: 'uppercase' }}>
                                            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>
                                            {new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#DBEAFE', color: '#3B82F6', fontWeight: 800 }}>{entry.class_ref?.class_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} color="#A1A5B7" /> {entry.start_time} - {entry.end_time}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={14} color="#A1A5B7" /> {entry.teacher ? `${entry.teacher.first_name} ${entry.teacher.last_name}` : 'Unassigned'}
                                            </span>
                                            {entry.room && (
                                                <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MapPin size={14} color="#A1A5B7" /> {entry.room}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => openModal(entry)} style={{ padding: '10px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                                        <Edit2 size={16} color="#5E6278" />
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} style={{ padding: '10px', borderRadius: '12px', background: '#FFF5F5', border: '1px solid #FEE2E2', cursor: 'pointer' }}>
                                        <Trash2 size={16} color="#E53935" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '540px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '24px' }}>
                            {editingEntry ? 'Edit Schedule' : 'Schedule Class'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Class</label>
                                    <select 
                                        required
                                        value={formData.class_id}
                                        onChange={(e) => {
                                            const classId = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                class_id: classId, 
                                                subject: '', 
                                                teacher_id: '',
                                                start_time: '09:00',
                                                end_time: '10:00'
                                            });
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    >
                                        <option value="">Select a Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Subject</label>
                                    <select 
                                        required
                                        value={formData.subject}
                                        onChange={(e) => {
                                            const subject = e.target.value;
                                            const selectedClass = classes.find(c => c.id === formData.class_id);
                                            let newTeacherId = formData.teacher_id;
                                            let newStartTime = formData.start_time;
                                            let newEndTime = formData.end_time;

                                            if (selectedClass && selectedClass.schedule) {
                                                const sched = selectedClass.schedule.find((s: any) => s.subject === subject);
                                                if (sched) {
                                                    if (sched.teacher_id) newTeacherId = sched.teacher_id;
                                                    if (sched.time_start) newStartTime = sched.time_start;
                                                    if (sched.time_end) newEndTime = sched.time_end;
                                                }
                                            }

                                            setFormData({ 
                                                ...formData, 
                                                subject,
                                                teacher_id: newTeacherId,
                                                start_time: newStartTime,
                                                end_time: newEndTime
                                            });
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', background: !formData.class_id ? '#F8F9FD' : '#FFFFFF' }}
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
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Teacher</label>
                                    <select 
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    >
                                        <option value="">Unassigned</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Date</label>
                                    <DatePicker
                                        required
                                        selected={formData.date ? new Date(formData.date) : null}
                                        onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })}
                                        dateFormat="MMMM d, yyyy"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                        showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Start Time</label>
                                    <DatePicker
                                        required
                                        selected={formData.start_time ? new Date(`2000-01-01T${formData.start_time}:00`) : null}
                                        onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, start_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                        showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>End Time</label>
                                    <DatePicker
                                        selected={formData.end_time ? new Date(`2000-01-01T${formData.end_time}:00`) : null}
                                        onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, end_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                        showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Room / Note</label>
                                    <input 
                                        type="text"
                                        placeholder="Room 101, Lab A, etc."
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
                                {editingEntry ? 'Update Schedule' : 'Create Schedule'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Auto-Generate Modal */}
            {showGenerateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setShowGenerateModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#A1A5B7" />
                        </button>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>
                            Auto-Generate Schedule
                        </h2>
                        <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '24px' }}>
                            Automatically create daily schedule entries based on your batches' weekly class configurations.
                        </p>
                        
                        <form onSubmit={handleGenerate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Target Class (Optional)</label>
                                    <select 
                                        value={generateData.class_id}
                                        onChange={(e) => setGenerateData({ ...generateData, class_id: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    >
                                        <option value="">All Active Classes</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Start Date</label>
                                        <DatePicker
                                            required
                                            selected={generateData.start_date ? new Date(generateData.start_date) : null}
                                            onChange={(date: Date | null) => setGenerateData({ ...generateData, start_date: date ? date.toISOString().split('T')[0] : '' })}
                                            dateFormat="MMMM d, yyyy"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>End Date</label>
                                        <DatePicker
                                            required
                                            selected={generateData.end_date ? new Date(generateData.end_date) : null}
                                            onChange={(date: Date | null) => setGenerateData({ ...generateData, end_date: date ? date.toISOString().split('T')[0] : '' })}
                                            dateFormat="MMMM d, yyyy"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button disabled={isGenerating} className="btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                {isGenerating ? 'Generating...' : <><Calendar size={18} /> Generate Schedule</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

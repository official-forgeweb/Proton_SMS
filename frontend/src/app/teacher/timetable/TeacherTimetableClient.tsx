'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    Calendar, Plus, Clock, Trash2, Edit2, 
    X, MapPin, User, ChevronRight, Filter
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
            // Force the teacher_id to be the current teacher's ID
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
                class_id: '',
                subject: '',
                teacher_id: teacherProfile?.id || '',
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
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>My Schedule</h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>View and manage your upcoming classes.</p>
                    </div>
                    <div>
                        <button 
                            onClick={() => openModal()}
                            className="btn-primary hover-lift"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Schedule Class
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Select Class</label>
                            <select 
                                value={filters.class_id}
                                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
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
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '16px' }} />)}
                    </div>
                ) : timetable.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <Calendar size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No classes scheduled</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>You have no classes scheduled for this period.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {timetable.map((entry) => (
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
                            {editingEntry ? 'Edit Class Schedule' : 'Schedule New Class'}
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
                                            let newStartTime = formData.start_time;
                                            let newEndTime = formData.end_time;

                                            if (selectedClass && selectedClass.schedule) {
                                                const sched = selectedClass.schedule.find((s: any) => s.subject === subject);
                                                if (sched) {
                                                    if (sched.time_start) newStartTime = sched.time_start;
                                                    if (sched.time_end) newEndTime = sched.time_end;
                                                }
                                            }

                                            setFormData({ 
                                                ...formData, 
                                                subject,
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
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Date</label>
                                    <DatePicker
                                        required
                                        selected={formData.date ? new Date(formData.date) : null}
                                        onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })}
                                        dateFormat="MMMM d, yyyy"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Start Time</label>
                                        <DatePicker
                                            required
                                            selected={formData.start_time ? new Date(`2000-01-01T${formData.start_time}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, start_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>End Time</label>
                                        <DatePicker
                                            selected={formData.end_time ? new Date(`2000-01-01T${formData.end_time}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, end_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa"
                                            customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                        />
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Room / Notes</label>
                                    <input 
                                        type="text"
                                        placeholder="Room 101, Online link, etc."
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '10px' }}>
                                {editingEntry ? 'Update Schedule' : 'Confirm Scheduling'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
    Calendar, Plus, Clock, Trash2, Edit2, AlertTriangle, 
    CheckCircle, X, MapPin, User, ChevronRight, Filter
} from 'lucide-react';

export default function AdminTimetablePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);
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
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

    const fetchData = async () => {
        try {
            const [classesRes, teachersRes] = await Promise.all([
                api.get('/classes'),
                api.get('/teachers')
            ]);
            setClasses(classesRes.data.data);
            setTeachers(teachersRes.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTimetable();
        fetchData();
    }, [fetchTimetable]);

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
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Timetable Management</h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Schedule date-specific classes and assignments.</p>
                    </div>
                    <button 
                        onClick={() => openModal()}
                        className="btn-primary hover-lift"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <Plus size={20} strokeWidth={2.5} /> Schedule Class
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'flex-end' }}>
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
                            <input 
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>End Date</label>
                            <input 
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
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
                        <Calendar size={48} color="#A1A5B7" style={{ marginBottom: '16px' }} />
                        <h3 style={{ color: '#1A1D3B', fontWeight: 700 }}>No schedule found</h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>There are no classes scheduled for this period.</p>
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
                                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    >
                                        <option value="">Select a Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Subject</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="e.g. Physics"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    />
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
                                    <input 
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>Start Time</label>
                                    <input 
                                        required
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', display: 'block' }}>End Time</label>
                                    <input 
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
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
        </DashboardLayout>
    );
}

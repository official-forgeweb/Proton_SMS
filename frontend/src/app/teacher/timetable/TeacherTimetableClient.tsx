'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Calendar as CalendarIcon, Plus, Clock, Trash2, Edit2,
    X, MapPin, User, ChevronLeft, ChevronRight, Filter, BookOpen, Layers
} from 'lucide-react';

interface Props {
  initialTimetable: any[];
  initialClasses: any[];
  initialFilters: { start_date: string; end_date: string };
  teacherProfile: any;
}

const SUBJECT_PALETTES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    'Physics':     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
    'Chemistry':   { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', dot: '#F97316' },
    'Mathematics': { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
    'Maths':       { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
    'Biology':     { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E' },
    'English':     { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', dot: '#EC4899' },
    'Hindi':       { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
    'SST':         { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
    'Computer':    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', dot: '#0EA5E9' },
};

const getSubjectPalette = (subject: string) =>
    SUBJECT_PALETTES[subject] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', dot: '#94A3B8' };

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getWeekDates(refDate: Date) {
    const d = new Date(refDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        dates.push(dt);
    }
    return dates;
}

function formatDateStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatTime12(time24: string) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
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

    // We keep existing API filter logic for wide date ranges if needed,
    // but the UI is focused on week-by-week.
    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterClass, setFilterClass] = useState('');

    const todayRef = useMemo(() => new Date(), []);
    const weekDates = useMemo(() => {
        const ref = new Date(todayRef);
        ref.setDate(ref.getDate() + weekOffset * 7);
        return getWeekDates(ref);
    }, [todayRef, weekOffset]);

    const todayStr = formatDateStr(new Date());

    // Automatically fetch wider range if user navigates past initial bound
    const fetchTimetableIfNeeded = useCallback(async () => {
        try {
            const startStr = formatDateStr(weekDates[0]);
            const endStr = formatDateStr(weekDates[6]);

            setIsLoading(true);
            const res = await api.get('/timetable', {
                params: { start_date: startStr, end_date: endStr }
            });
            setTimetable(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [weekDates]);

    useEffect(() => {
        fetchTimetableIfNeeded();
    }, [fetchTimetableIfNeeded]);

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
            fetchTimetableIfNeeded();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error saving schedule.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this from your schedule?')) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetableIfNeeded();
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
                date: formatDateStr(weekDates[selectedDayIdx]) || new Date().toISOString().split('T')[0],
                start_time: '09:00', end_time: '10:00', room: '', notes: ''
            });
        }
        setShowModal(true);
    };

    const subjects = useMemo(() => {
        const seen = new Set<string>();
        const result: string[] = [];
        timetable.forEach(t => {
            const s = (t.subject || '').trim();
            if (s && !seen.has(s.toLowerCase())) {
                seen.add(s.toLowerCase());
                result.push(s);
            }
        });
        return result.sort();
    }, [timetable]);

    const entriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        const filtered = timetable.filter(t => {
            if (filterSubject && t.subject !== filterSubject) return false;
            if (filterClass && t.class_id !== filterClass) return false;
            return true;
        });

        filtered.forEach(entry => {
            if (!map[entry.date]) map[entry.date] = [];
            map[entry.date].push(entry);
        });

        Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
        return map;
    }, [timetable, filterSubject, filterClass]);

    const weekEntries = useMemo(() => {
        const dateStrs = weekDates.map(formatDateStr);
        return dateStrs.flatMap(d => entriesByDate[d] || []);
    }, [weekDates, entriesByDate]);

    const todayEntries = entriesByDate[todayStr] || [];

    return (
        <>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '24px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>My Schedule</h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px', fontWeight: 500 }}>Manage your upcoming classes and timeline.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <button
                            onClick={() => openModal()}
                            className="hover-lift"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#1A1D3B', color: 'white', border: 'none',
                                padding: '12px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} strokeWidth={2.5} /> Schedule Class
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* ── Top Bar: View Toggle + Nav + Filter ── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '24px',
                    padding: '14px 20px', background: 'white', borderRadius: '16px',
                    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
                        <button onClick={() => setViewMode('week')} style={{
                            padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                            background: viewMode === 'week' ? 'white' : 'transparent', color: viewMode === 'week' ? '#1A1D3B' : '#94A3B8',
                            boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s',
                        }}>
                            <Layers size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Week
                        </button>
                        <button onClick={() => setViewMode('day')} style={{
                            padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                            background: viewMode === 'day' ? 'white' : 'transparent', color: viewMode === 'day' ? '#1A1D3B' : '#94A3B8',
                            boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s',
                        }}>
                            <CalendarIcon size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Day
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>
                            <ChevronLeft size={18} color="#64748B" />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', minWidth: '180px', textAlign: 'center' }}>
                            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>
                            <ChevronRight size={18} color="#64748B" />
                        </button>
                        {weekOffset !== 0 && (
                            <button onClick={() => setWeekOffset(0)} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: '#4F46E5', fontWeight: 700, fontSize: '12px' }}>
                                Today
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                            value={filterClass} onChange={e => setFilterClass(e.target.value)}
                            style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', background: filterClass ? '#EEF2FF' : 'white' }}
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                        <select
                            value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                            style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', background: filterSubject ? '#EEF2FF' : 'white' }}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="animate-fade-in" style={{ height: '120px', borderRadius: '16px', background: '#F8F9FD', border: '1px solid #E2E8F0', animationDelay: `${i * 100}ms` }} />)}
                    </div>
                ) : viewMode === 'week' ? (
                    <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                            {weekDates.map((d, i) => {
                                const isToday = formatDateStr(d) === todayStr;
                                return (
                                    <div key={i} onClick={() => { setSelectedDayIdx(i); setViewMode('day'); }} style={{ padding: '16px 8px', textAlign: 'center', cursor: 'pointer', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none', background: isToday ? '#EEF2FF' : 'transparent', transition: 'background 0.2s' }}>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: isToday ? '#4F46E5' : '#94A3B8', textTransform: 'uppercase', margin: 0 }}>{DAY_LABELS[i]}</p>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: isToday ? 'white' : '#1A1D3B', margin: '4px auto 0', width: '36px', height: '36px', lineHeight: '36px', borderRadius: '10px', background: isToday ? '#4F46E5' : 'transparent' }}>{d.getDate()}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '340px' }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const dayEntries = entriesByDate[dateStr] || [];
                                const isToday = dateStr === todayStr;
                                return (
                                    <div key={i} style={{ padding: '10px 8px', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none', minHeight: '300px', background: isToday ? 'rgba(238,242,255,0.3)' : 'transparent', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {dayEntries.length === 0 && <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', paddingTop: '20px', opacity: 0.3, fontSize: '12px', color: '#94A3B8' }}>No classes</div>}
                                        {dayEntries.map((entry: any) => {
                                            const palette = getSubjectPalette(entry.subject);
                                            return (
                                                <div key={entry.id} onClick={(e) => { e.stopPropagation(); openModal(entry); }} style={{ background: palette.bg, border: `1.5px solid ${palette.border}`, borderRadius: '12px', padding: '10px 12px', borderLeft: `4px solid ${palette.dot}`, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                                    <p style={{ fontSize: '13px', fontWeight: 800, color: palette.text, margin: 0 }}>{entry.subject}</p>
                                                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {formatTime12(entry.start_time)}</p>
                                                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.class_ref?.class_name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', padding: '4px', background: '#F8FAFC', borderRadius: '14px' }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const isToday = dateStr === todayStr;
                                const isSelected = i === selectedDayIdx;
                                const count = (entriesByDate[dateStr] || []).length;
                                return (
                                    <button key={i} onClick={() => setSelectedDayIdx(i)} style={{ flex: 1, padding: '14px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'center', background: isSelected ? (isToday ? '#4F46E5' : 'white') : 'transparent', color: isSelected ? (isToday ? 'white' : '#1A1D3B') : '#94A3B8', boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', minWidth: '80px', transition: 'all 0.2s' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{DAY_LABELS[i]}</p>
                                        <p style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 0' }}>{d.getDate()}</p>
                                        {count > 0 && <span style={{ fontSize: '10px', fontWeight: 700, background: isSelected && isToday ? 'rgba(255,255,255,0.25)' : '#EEF2FF', color: isSelected && isToday ? 'white' : '#6366F1', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px' }}>{count}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {(() => {
                            const dateStr = formatDateStr(weekDates[selectedDayIdx]);
                            const dayEntries = entriesByDate[dateStr] || [];

                            if (dayEntries.length === 0) return <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0' }}><CalendarIcon size={48} color="#CBD5E1" /><h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px', color: '#1A1D3B' }}>No Classes Scheduled</h3></div>;

                            return (
                                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                    <div style={{ position: 'absolute', left: '14px', top: '20px', bottom: '20px', width: '3px', background: 'linear-gradient(to bottom, #6366F1, #8B5CF6, #C7D2FE)', borderRadius: '2px' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {dayEntries.map((entry: any) => {
                                            const palette = getSubjectPalette(entry.subject);
                                            return (
                                                <div key={entry.id} style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                                                    <div style={{ position: 'absolute', left: '-26px', top: '24px', width: '14px', height: '14px', borderRadius: '50%', background: palette.dot, border: '3px solid white', boxShadow: `0 0 0 2px ${palette.dot}40`, zIndex: 2 }} />
                                                    <div style={{ minWidth: '80px', paddingTop: '16px', textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{formatTime12(entry.start_time)}</p>
                                                        {entry.end_time && <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 600 }}>{formatTime12(entry.end_time)}</p>}
                                                    </div>
                                                    <div style={{ flex: 1, background: 'white', borderRadius: '18px', border: `1.5px solid ${palette.border}`, borderLeft: `5px solid ${palette.dot}`, padding: '20px 24px', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', background: palette.bg, color: palette.text, border: `1px solid ${palette.border}` }}>{entry.class_ref?.class_name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                                                {entry.room && <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><MapPin size={14} color="#94A3B8" /> {entry.room}</span>}
                                                            </div>
                                                            {entry.notes && <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '10px', fontStyle: 'italic' }}>📝 {entry.notes}</p>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button onClick={() => openModal(entry)} style={{ padding: '8px', borderRadius: '10px', background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B' }}><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDelete(entry.id)} style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Modal for adding/editing */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div className="animate-fade-in" style={{ background: '#FFFFFF', width: '100%', maxWidth: '540px', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', cursor: 'pointer', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#64748B" /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                            <div style={{ background: '#EEF2FF', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}><CalendarIcon size={22} /></div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{editingEntry ? 'Edit Class Schedule' : 'Schedule New Class'}</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Class <span style={{ color: '#EF4444' }}>*</span></label>
                                    <select required value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value, subject: '' })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}>
                                        <option value="">Select a Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Subject <span style={{ color: '#EF4444' }}>*</span></label>
                                    <select required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', background: !formData.class_id ? '#F8FAFC' : '#FFFFFF', fontSize: '14px', fontWeight: 600 }} disabled={!formData.class_id}>
                                        <option value="">{formData.class_id ? "Select a Subject" : "Select a Class first"}</option>
                                        {formData.class_id && classes.find(c => c.id === formData.class_id) && Array.from(new Set([classes.find(c => c.id === formData.class_id)?.subject, ...(classes.find(c => c.id === formData.class_id)?.schedule || []).map((s: any) => s.subject)].filter(Boolean))).map(subject => <option key={subject as string} value={subject as string}>{subject as string}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Date <span style={{ color: '#EF4444' }}>*</span></label>
                                    <DatePicker required selected={formData.date ? new Date(formData.date) : null} onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMM d, yyyy" customInput={<input style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Start <span style={{ color: '#EF4444' }}>*</span></label>
                                        <DatePicker required selected={formData.start_time ? new Date(`2000-01-01T${formData.start_time}:00`) : null} onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, start_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" customInput={<input style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>End</label>
                                        <DatePicker selected={formData.end_time ? new Date(`2000-01-01T${formData.end_time}:00`) : null} onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, end_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" customInput={<input style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />} />
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Room / Notes</label>
                                    <input type="text" placeholder="Room 101, Online link, etc." value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }} />
                                </div>
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '16px', background: '#1A1D3B', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                {editingEntry ? 'Save Changes' : 'Schedule Class'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

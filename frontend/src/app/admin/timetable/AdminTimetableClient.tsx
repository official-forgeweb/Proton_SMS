'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { customAlert, customConfirm } from '@/utils/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Plus, Clock, Trash2, Edit2, AlertTriangle, CheckCircle, X, MapPin, User, ChevronRight, ChevronLeft, BookOpen, Layers } from 'lucide-react';

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

interface Props {
  initialTimetable: any[];
  initialClasses: any[];
  initialTeachers: any[];
  initialFilters: { start_date: string; end_date: string };
}

export default function AdminTimetableClient({ initialTimetable, initialClasses, initialTeachers, initialFilters }: Props) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [timetable, setTimetable] = useState<any[]>(initialTimetable);
    const [classes, setClasses] = useState<any[]>(initialClasses);
    const [teachers, setTeachers] = useState<any[]>(initialTeachers);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateSuccessMsg, setGenerateSuccessMsg] = useState('');
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

    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');

    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
    
    const todayRef = useMemo(() => new Date(), []);
    const weekDates = useMemo(() => {
        const ref = new Date(todayRef);
        ref.setDate(ref.getDate() + weekOffset * 7);
        return getWeekDates(ref);
    }, [todayRef, weekOffset]);

    const fetchTimetable = useCallback(async () => {
        try {
            setIsLoading(true);
            const startStr = formatDateStr(weekDates[0]);
            const endStr = formatDateStr(weekDates[6]);
            const res = await api.get('/timetable', { 
                params: { start_date: startStr, end_date: endStr } 
            });
            setTimetable(res.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [weekDates]);

    useEffect(() => {
        fetchTimetable();
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

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const res = await api.post('/timetable/generate', generateData);
            setShowGenerateModal(false);
            setGenerateSuccessMsg(res.data.message);
            fetchTimetable();
            await customAlert(res.data.message || 'Timetable generated successfully.', 'Success');
        } catch (error: any) {
            await customAlert(error.response?.data?.message || 'Failed to generate timetable', 'Error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await customConfirm('Are you sure you want to delete this schedule?', 'Confirm Deletion');
        if (!confirmed) return;
        try {
            await api.delete(`/timetable/${id}`);
            fetchTimetable();
            await customAlert('Schedule deleted successfully.', 'Delete Successful');
        } catch (error) {
            console.error(error);
            await customAlert('Failed to delete schedule', 'Error');
        }
    };

    const openModal = (entry: any = null, prefillDate?: string) => {
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
                date: prefillDate || new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00',
                room: '',
                notes: ''
            });
        }
        setShowModal(true);
    };

    // unique subjects for filter
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
        let filtered = timetable;
        if (filterSubject) {
            filtered = filtered.filter(t => (t.subject || '').trim().toLowerCase() === filterSubject.trim().toLowerCase());
        }
        if (filterClass) {
            filtered = filtered.filter(t => t.class_id === filterClass);
        }
        if (filterTeacher) {
            filtered = filtered.filter(t => t.teacher_id === filterTeacher);
        }

        filtered.forEach(entry => {
            if (!map[entry.date]) map[entry.date] = [];
            map[entry.date].push(entry);
        });

        // Sort each day by start_time
        Object.values(map).forEach(arr => arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
        return map;
    }, [timetable, filterSubject, filterClass, filterTeacher]);

    const rawEntriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        timetable.forEach(entry => {
            if (!map[entry.date]) map[entry.date] = [];
            map[entry.date].push(entry);
        });
        Object.values(map).forEach(arr => arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
        return map;
    }, [timetable]);

    const weekEntries = useMemo(() => {
        const dateStrs = weekDates.map(formatDateStr);
        return dateStrs.flatMap(d => entriesByDate[d] || []);
    }, [weekDates, entriesByDate]);

    const todayStr = formatDateStr(new Date());
    const rawTodayEntries = rawEntriesByDate[todayStr] || [];

    const hasActiveFilters = filterSubject || filterClass || filterTeacher;

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
                {/* ── Top Bar: View Toggle + Nav + Filter ── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '24px',
                    padding: '14px 20px', background: 'white', borderRadius: '16px',
                    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
                        <button
                            onClick={() => setViewMode('week')}
                            style={{
                                padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '13px',
                                background: viewMode === 'week' ? 'white' : 'transparent',
                                color: viewMode === 'week' ? '#1A1D3B' : '#94A3B8',
                                boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Layers size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Week
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            style={{
                                padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '13px',
                                background: viewMode === 'day' ? 'white' : 'transparent',
                                color: viewMode === 'day' ? '#1A1D3B' : '#94A3B8',
                                boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Calendar size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Day
                        </button>
                    </div>

                    {/* Week Navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={18} color="#64748B" />
                        </button>
                        <span suppressHydrationWarning style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', minWidth: '180px', textAlign: 'center' }}>
                            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={18} color="#64748B" />
                        </button>
                        {weekOffset !== 0 && (
                            <button onClick={() => setWeekOffset(0)} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: '#4F46E5', fontWeight: 700, fontSize: '12px' }}>
                                Today
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                                background: filterSubject ? '#EEF2FF' : 'white', color: '#1A1D3B',
                            }}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                                background: filterClass ? '#EEF2FF' : 'white', color: '#1A1D3B',
                            }}
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                        <select
                            value={filterTeacher}
                            onChange={e => setFilterTeacher(e.target.value)}
                            style={{
                                padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                                background: filterTeacher ? '#EEF2FF' : 'white', color: '#1A1D3B',
                            }}
                        >
                            <option value="">All Teachers</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setFilterSubject(''); setFilterClass(''); setFilterTeacher(''); }}
                                style={{
                                    padding: '8px 14px', borderRadius: '10px', border: '1px solid #FCA5A5',
                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                    background: '#FEF2F2', color: '#DC2626',
                                }}
                            >
                                ✕ Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Quick Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '16px', padding: '18px 20px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>{rawTodayEntries.length}</p>
                        <p style={{ fontSize: '12px', opacity: 0.75 }}>classes</p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', borderRadius: '16px', padding: '18px 20px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>{weekEntries.length}</p>
                        <p style={{ fontSize: '12px', opacity: 0.75 }}>classes</p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', borderRadius: '16px', padding: '18px 20px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>{subjects.length}</p>
                        <p style={{ fontSize: '12px', opacity: 0.75 }}>scheduled</p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '16px', padding: '18px 20px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Classes</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>{classes.length}</p>
                        <p style={{ fontSize: '12px', opacity: 0.75 }}>total</p>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="animate-fade-in" style={{ height: '120px', borderRadius: '16px', background: '#F8F9FD', border: '1px solid #E2E8F0', animationDelay: `${i * 100}ms` }} />)}
                    </div>
                ) : viewMode === 'week' ? (
                    /* ── WEEK GRID VIEW ── */
                    <div style={{
                        background: 'white', borderRadius: '20px', overflow: 'hidden',
                        border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                    }}>
                        {/* Day headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                            {weekDates.map((d, i) => {
                                const isToday = formatDateStr(d) === todayStr;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => { setSelectedDayIdx(i); setViewMode('day'); }}
                                        style={{
                                            padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
                                            borderRight: i < 6 ? '1px solid #F1F5F9' : 'none',
                                            background: isToday ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : 'transparent',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: isToday ? '#4F46E5' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                            {DAY_LABELS[i]}
                                        </p>
                                        <p suppressHydrationWarning style={{
                                            fontSize: '20px', fontWeight: 800,
                                            color: isToday ? '#4F46E5' : '#1A1D3B',
                                            margin: '2px 0 0',
                                            width: '36px', height: '36px', lineHeight: '36px',
                                            borderRadius: '10px', marginLeft: 'auto', marginRight: 'auto',
                                            background: isToday ? '#4F46E5' : 'transparent',
                                            ...(isToday ? { color: 'white' } : {}),
                                        }}>
                                            {d.getDate()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid body */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '340px' }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const dayEntries = entriesByDate[dateStr] || [];
                                const isToday = dateStr === todayStr;
                                return (
                                    <div key={i} style={{
                                        padding: '10px 8px', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none',
                                        minHeight: '300px', background: isToday ? 'rgba(238,242,255,0.3)' : 'transparent',
                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                    }}>
                                        {dayEntries.length === 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.3, fontSize: '12px', color: '#94A3B8' }}>
                                                No class
                                            </div>
                                        )}
                                        {dayEntries.map((entry: any) => {
                                            const isTest = entry.type === 'test';
                                            const palette = getSubjectPalette(entry.subject);
                                            const statusColor = isTest ? '#F43F5E' : palette.dot;
                                            return (
                                                <div key={entry.id} style={{
                                                    background: isTest ? '#FFF1F2' : palette.bg,
                                                    border: `1.5px solid ${isTest ? '#FECDD3' : palette.border}`,
                                                    borderRadius: '12px', padding: '10px 12px',
                                                    borderLeft: `4px solid ${statusColor}`,
                                                    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                                    onClick={() => {
                                                        if (isTest) {
                                                            router.push(`/${user?.role || 'admin'}/tests/${entry.id}`);
                                                        } else {
                                                            openModal(entry);
                                                        }
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    {isTest && <span style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '9px', fontWeight: 800, color: '#F43F5E', textTransform: 'uppercase', background: 'white', padding: '1px 4px', borderRadius: '4px', border: '1px solid #FECDD3' }}>TEST</span>}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 800, color: isTest ? '#9F1239' : palette.text, margin: 0, lineHeight: 1.2 }}>
                                                            {entry.subject}
                                                        </p>
                                                        {!isTest && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} 
                                                                style={{ background: 'white', border: '1px solid #FEE2E2', borderRadius: '4px', cursor: 'pointer', padding: '2px', color: '#EF4444', opacity: 0.6 }} 
                                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} strokeWidth={2.5} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={10} /> {formatTime12(entry.start_time)}
                                                        {entry.end_time ? ` – ${formatTime12(entry.end_time)}` : ''}
                                                    </p>
                                                    {entry.teacher && (
                                                        <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <User size={9} /> {entry.teacher.first_name} {entry.teacher.last_name}
                                                        </p>
                                                    )}
                                                    {entry.room && (
                                                        <p style={{ fontSize: '10px', color: '#94A3B8', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <MapPin size={9} /> {entry.room}
                                                        </p>
                                                    )}
                                                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                                                        {entry.class_ref?.class_name}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        <button onClick={() => openModal(null, dateStr)} style={{ marginTop: 'auto', alignSelf: 'center', padding: '6px 12px', borderRadius: '8px', border: '1px dashed #CBD5E1', background: 'transparent', color: '#64748B', fontWeight: 700, fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#1A1D3B'; e.currentTarget.style.background = '#F8FAFC'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}>
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* ── DAY VIEW ── */
                    <div>
                        {/* Day selector tabs */}
                        <div style={{
                            display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto',
                            padding: '4px', background: '#F8FAFC', borderRadius: '14px',
                        }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const isToday = dateStr === todayStr;
                                const isSelected = i === selectedDayIdx;
                                const count = (entriesByDate[dateStr] || []).length;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDayIdx(i)}
                                        style={{
                                            flex: 1, padding: '14px 10px', borderRadius: '12px',
                                            border: 'none', cursor: 'pointer', textAlign: 'center',
                                            background: isSelected ? (isToday ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'white') : 'transparent',
                                            color: isSelected ? (isToday ? 'white' : '#1A1D3B') : '#94A3B8',
                                            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                            transition: 'all 0.2s', minWidth: '80px',
                                        }}
                                    >
                                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: 0, opacity: 0.85 }}>{DAY_LABELS[i]}</p>
                                        <p style={{ fontSize: '22px', fontWeight: 800, margin: '2px 0 0' }}>{d.getDate()}</p>
                                        {count > 0 && (
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700,
                                                background: isSelected && isToday ? 'rgba(255,255,255,0.25)' : '#EEF2FF',
                                                color: isSelected && isToday ? 'white' : '#6366F1',
                                                padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px',
                                            }}>
                                                {count} class{count > 1 ? 'es' : ''}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Day entries - timeline style */}
                        {(() => {
                            const dateStr = formatDateStr(weekDates[selectedDayIdx]);
                            const dayEntries = entriesByDate[dateStr] || [];

                            if (dayEntries.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <Calendar size={48} color="#CBD5E1" style={{ margin: '0 auto' }} />
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px', color: '#1A1D3B' }}>No Classes</h3>
                                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
                                            There are no classes scheduled for {FULL_DAY_LABELS[selectedDayIdx]}, {weekDates[selectedDayIdx].toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.
                                        </p>
                                        <button onClick={() => openModal(null, dateStr)} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '12px', background: '#F8F9FD', color: '#1A1D3B', fontWeight: 700, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                                            + Schedule Class
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                    {/* Vertical timeline line */}
                                    <div style={{ position: 'absolute', left: '14px', top: '20px', bottom: '20px', width: '3px', background: 'linear-gradient(to bottom, #6366F1, #8B5CF6, #C7D2FE)', borderRadius: '2px' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {dayEntries.map((entry: any, idx: number) => {
                                            const isTest = entry.type === 'test';
                                            const palette = getSubjectPalette(entry.subject);
                                            return (
                                                <div key={entry.id} style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                                                    {/* Timeline dot */}
                                                    <div style={{
                                                        position: 'absolute', left: '-26px', top: '24px',
                                                        width: '14px', height: '14px', borderRadius: '50%',
                                                        background: isTest ? '#F43F5E' : palette.dot, border: '3px solid white',
                                                        boxShadow: '0 0 0 2px ' + (isTest ? '#F43F5E' : palette.dot) + '40', zIndex: 2,
                                                    }} />

                                                    {/* Time column */}
                                                    <div style={{ minWidth: '80px', paddingTop: '16px', textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{formatTime12(entry.start_time)}</p>
                                                        {entry.end_time && <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 600 }}>{formatTime12(entry.end_time)}</p>}
                                                    </div>

                                                    {/* Card */}
                                                    <div style={{
                                                        flex: 1, background: isTest ? '#FFF1F2' : 'white', borderRadius: '18px',
                                                        border: `1.5px solid ${isTest ? '#FECDD3' : palette.border}`,
                                                        borderLeft: `5px solid ${isTest ? '#F43F5E' : palette.dot}`,
                                                        padding: '20px 24px',
                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                        cursor: 'pointer',
                                                    }}
                                                        onClick={() => {
                                                            if (isTest) {
                                                                window.location.href = `/${user?.role || 'admin'}/tests/${entry.id}`;
                                                            } else {
                                                                openModal(entry);
                                                            }
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${isTest ? '#F43F5E' : palette.dot}15`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: isTest ? '#9F1239' : '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                                <p style={{ fontSize: '13px', color: isTest ? '#F43F5E' : '#64748B', margin: '4px 0 0', fontWeight: 700 }}>
                                                                    {isTest ? 'EXAMINATION' : entry.class_ref?.class_name}
                                                                </p>
                                                                {isTest && <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{entry.class_ref?.class_name}</p>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {!isTest && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} style={{ padding: '6px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', color: '#DC2626' }}>
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '14px' }}>
                                                            {entry.teacher && (
                                                                <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                                    <User size={14} color="#94A3B8" /> {entry.teacher.first_name} {entry.teacher.last_name}
                                                                </span>
                                                            )}
                                                            {entry.room && (
                                                                <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                                    <MapPin size={14} color="#94A3B8" /> {entry.room}
                                                                </span>
                                                            )}
                                                            <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                                <Clock size={14} color="#94A3B8" /> {formatTime12(entry.start_time)}{entry.end_time ? ` – ${formatTime12(entry.end_time)}` : ''}
                                                            </span>
                                                        </div>

                                                        {entry.notes && (
                                                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '10px', fontStyle: 'italic' }}>
                                                                📝 {entry.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button onClick={() => openModal(null, dateStr)} style={{ alignSelf: 'flex-start', marginTop: '10px', padding: '10px 20px', borderRadius: '12px', border: '2px dashed #CBD5E1', background: 'transparent', color: '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#1A1D3B'; e.currentTarget.style.background = '#F8FAFC'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}>
                                            <Plus size={16} /> Schedule Additional Class
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Subject Legend */}
                {subjects.length > 0 && (
                    <div style={{
                        marginTop: '24px', padding: '16px 20px', background: 'white',
                        borderRadius: '14px', border: '1px solid #E2E8F0',
                        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
                            <BookOpen size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />Subjects
                        </span>
                        {filterSubject && (
                            <span
                                onClick={() => setFilterSubject('')}
                                style={{
                                    fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                                    background: '#F1F5F9', color: '#475569',
                                    border: '1px solid #CBD5E1', cursor: 'pointer',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                            >
                                <X size={12} /> All Subjects
                            </span>
                        )}
                        {subjects.map(s => {
                            const p = getSubjectPalette(s);
                            return (
                                <span
                                    key={s}
                                    onClick={() => setFilterSubject(filterSubject.toLowerCase() === s.toLowerCase() ? '' : s)}
                                    style={{
                                        fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                                        background: filterSubject.toLowerCase() === s.toLowerCase() ? p.dot : p.bg,
                                        color: filterSubject.toLowerCase() === s.toLowerCase() ? 'white' : p.text,
                                        border: `1px solid ${p.border}`, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {s}
                                </span>
                            );
                        })}
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

            {/* Success Modal */}
            {generateSuccessMsg && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="animate-fade-in" style={{ background: '#FFFFFF', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '64px', height: '64px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CheckCircle size={32} color="#16A34A" />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 8px 0' }}>
                            Success!
                        </h2>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>
                            {generateSuccessMsg}
                        </p>
                        <button onClick={() => setGenerateSuccessMsg('')} className="btn-primary" style={{ width: '100%', padding: '12px', background: '#16A34A', border: 'none', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

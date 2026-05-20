'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';
import ToolBottomBar from '@/components/ToolBottomBar';

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

export default function StudentTimetablePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [rawTimetable, setRawTimetable] = useState<any[]>([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const todayRef = useMemo(() => new Date(), []);
    const weekDates = useMemo(() => {
        const ref = new Date(todayRef);
        ref.setDate(ref.getDate() + weekOffset * 7);
        return getWeekDates(ref);
    }, [todayRef, weekOffset]);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                setIsLoading(true);
                const startStr = formatDateStr(weekDates[0]);
                const endStr = formatDateStr(weekDates[6]);
                const res = await api.get('/timetable', {
                    params: { start_date: startStr, end_date: endStr }
                });
                setRawTimetable(res.data.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTimetable();
    }, [weekDates]);

    const todayStr = formatDateStr(new Date());

    // unique subjects for filter
    const subjects = useMemo(() => {
        const seen = new Set<string>();
        const result: string[] = [];
        rawTimetable.forEach(t => {
            const s = (t.subject || '').trim();
            if (s && !seen.has(s.toLowerCase())) {
                seen.add(s.toLowerCase());
                result.push(s);
            }
        });
        return result.sort();
    }, [rawTimetable]);

    // unique teachers for filter
    const teachers = useMemo(() => {
        const seen = new Set<string>();
        const result: { id: string; name: string }[] = [];
        rawTimetable.forEach(t => {
            if (t.teacher && !seen.has(t.teacher_id)) {
                seen.add(t.teacher_id);
                result.push({ id: t.teacher_id, name: `${t.teacher.first_name || ''} ${t.teacher.last_name || ''}`.trim() });
            }
        });
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [rawTimetable]);

    // Filter + group by date
    const entriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        let filtered = rawTimetable;
        if (filterSubject) {
            filtered = filtered.filter(t => (t.subject || '').trim().toLowerCase() === filterSubject.trim().toLowerCase());
        }
        if (filterStatus) {
            filtered = filtered.filter(t => t.status === filterStatus);
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
    }, [rawTimetable, filterSubject, filterStatus, filterTeacher]);

    // Stats (use raw unfiltered data so stats don't change with filters)
    const rawEntriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        rawTimetable.forEach(entry => {
            if (!map[entry.date]) map[entry.date] = [];
            map[entry.date].push(entry);
        });
        Object.values(map).forEach(arr => arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
        return map;
    }, [rawTimetable]);

    const weekEntries = useMemo(() => {
        const dateStrs = weekDates.map(formatDateStr);
        return dateStrs.flatMap(d => entriesByDate[d] || []);
    }, [weekDates, entriesByDate]);

    const rawTodayEntries = rawEntriesByDate[todayStr] || [];
    const todayEntries = entriesByDate[todayStr] || [];

    // Next upcoming class (time-aware, uses unfiltered data)
    const nextClass = useMemo(() => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        for (const entry of rawTodayEntries) {
            if (!entry.start_time) continue;
            const [h, m] = entry.start_time.split(':').map(Number);
            if (h * 60 + m > nowMinutes) return entry;
        }
        return null;
    }, [rawTodayEntries]);

    const hasActiveFilters = filterSubject || filterStatus || filterTeacher;

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0 }}>
                            My Class Schedule
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Your weekly classes at a glance. Never miss a session.
                        </p>
                    </div>
                </div>

                <div className="page-body">
                    {/* ── Top Bar: View Toggle + Nav + Filter ── */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: '32px',
                        padding: '16px 24px', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px',
                        border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(16px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                    }}>
                        {/* View Mode Toggle */}
                        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '12px', padding: '4px' }}>
                            <button
                                onClick={() => setViewMode('week')}
                                style={{
                                    padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: 700, fontSize: '13px',
                                    background: viewMode === 'week' ? 'white' : 'transparent',
                                    color: viewMode === 'week' ? '#E53935' : '#94A3B8',
                                    boxShadow: viewMode === 'week' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <Layers size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Week
                            </button>
                            <button
                                onClick={() => setViewMode('day')}
                                style={{
                                    padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    fontWeight: 700, fontSize: '13px',
                                    background: viewMode === 'day' ? 'white' : 'transparent',
                                    color: viewMode === 'day' ? '#E53935' : '#94A3B8',
                                    boxShadow: viewMode === 'day' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                <Calendar size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Day
                            </button>
                        </div>

                        {/* Week Navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}>
                                <ChevronLeft size={18} color="#64748B" />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B', minWidth: '180px', textAlign: 'center' }}>
                                {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}>
                                <ChevronRight size={18} color="#64748B" />
                            </button>
                            {weekOffset !== 0 && (
                                <button onClick={() => setWeekOffset(0)} style={{ background: 'rgba(229, 57, 53, 0.06)', border: '1px solid rgba(229, 57, 53, 0.2)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', color: '#E53935', fontWeight: 800, fontSize: '12px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 57, 53, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(229, 57, 53, 0.06)'}>
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
                                    padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none',
                                    background: filterSubject ? 'rgba(229, 57, 53, 0.06)' : 'white', color: '#1A1D3B',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none',
                                    background: filterStatus ? 'rgba(229, 57, 53, 0.06)' : 'white', color: '#1A1D3B',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select
                                value={filterTeacher}
                                onChange={e => setFilterTeacher(e.target.value)}
                                style={{
                                    padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none',
                                    background: filterTeacher ? 'rgba(229, 57, 53, 0.06)' : 'white', color: '#1A1D3B',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <option value="">All Teachers</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => { setFilterSubject(''); setFilterStatus(''); setFilterTeacher(''); }}
                                    style={{
                                        padding: '10px 16px', borderRadius: '12px', border: '1px solid #FECACA',
                                        fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                                        background: '#FEF2F2', color: '#EF4444', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                                >
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Quick Stats ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', borderRadius: '20px', padding: '20px 24px', color: 'white', boxShadow: '0 8px 32px rgba(26,29,59,0.15)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</p>
                            <p style={{ fontSize: '32px', fontWeight: 900, margin: '6px 0' }}>{rawTodayEntries.length}</p>
                            <p style={{ fontSize: '12px', opacity: 0.8 }}>classes scheduled</p>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', borderRadius: '20px', padding: '20px 24px', color: 'white', boxShadow: '0 8px 32px rgba(229,57,53,0.2)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</p>
                            <p style={{ fontSize: '32px', fontWeight: 900, margin: '6px 0' }}>{weekEntries.length}</p>
                            <p style={{ fontSize: '12px', opacity: 0.8 }}>classes total</p>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '20px 24px', color: '#1A1D3B', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subjects</p>
                            <p style={{ fontSize: '32px', fontWeight: 900, color: '#1A1D3B', margin: '6px 0' }}>{subjects.length}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>enrolled courses</p>
                        </div>
                        {nextClass ? (
                            <div style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '20px 24px', color: '#1A1D3B', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Class</p>
                                <p style={{ fontSize: '18px', fontWeight: 900, color: '#E53935', margin: '8px 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextClass.subject}</p>
                                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {formatTime12(nextClass.start_time)}</p>
                            </div>
                        ) : rawTodayEntries.length > 0 ? (
                            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '20px', padding: '20px 24px', color: 'white', boxShadow: '0 8px 32px rgba(16,185,129,0.2)' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
                                <p style={{ fontSize: '20px', fontWeight: 900, margin: '8px 0 4px' }}>All Done ✓</p>
                                <p style={{ fontSize: '12px', opacity: 0.8 }}>No more classes today</p>
                            </div>
                        ) : null}
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[1, 2, 3].map(i => <div key={i} className="animate-fade-in" style={{ height: '140px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(8px)', animationDelay: `${i * 100}ms` }} />)}
                        </div>
                    ) : viewMode === 'week' ? (
                        /* ── WEEK GRID VIEW ── */
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px', overflow: 'hidden',
                            border: '1px solid rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
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
                                                padding: '20px 8px', textAlign: 'center', cursor: 'pointer',
                                                borderRight: i < 6 ? '1px solid #F1F5F9' : 'none',
                                                background: isToday ? 'linear-gradient(135deg, rgba(229, 57, 53, 0.04) 0%, rgba(198, 40, 40, 0.04) 100%)' : 'transparent',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <p style={{ fontSize: '11px', fontWeight: 800, color: isToday ? '#E53935' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                                {DAY_LABELS[i]}
                                            </p>
                                            <p style={{
                                                fontSize: '18px', fontWeight: 900,
                                                color: isToday ? '#E53935' : '#1A1D3B',
                                                margin: '6px 0 0',
                                                width: '32px', height: '32px', lineHeight: '32px',
                                                borderRadius: '50%', marginLeft: 'auto', marginRight: 'auto',
                                                background: isToday ? '#E53935' : 'transparent',
                                                ...(isToday ? { color: 'white' } : {}),
                                            }}>
                                                {d.getDate()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grid body */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '380px' }}>
                                {weekDates.map((d, i) => {
                                    const dateStr = formatDateStr(d);
                                    const dayEntries = entriesByDate[dateStr] || [];
                                    const isToday = dateStr === todayStr;
                                    return (
                                        <div key={i} style={{
                                            padding: '12px 10px', borderRight: i < 6 ? '1px solid #F1F5F9' : 'none',
                                            minHeight: '340px', background: isToday ? 'rgba(229, 57, 53, 0.01)' : 'transparent',
                                            display: 'flex', flexDirection: 'column', gap: '10px',
                                        }}>
                                            {dayEntries.length === 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.35, fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>
                                                    No class
                                                </div>
                                            )}
                                            {dayEntries.map((entry: any) => {
                                                const palette = getSubjectPalette(entry.subject);
                                                const statusColor = entry.status === 'completed' ? '#10B981' : entry.status === 'cancelled' ? '#EF4444' : palette.dot;
                                                return (
                                                    <div key={entry.id} style={{
                                                        background: entry.status === 'cancelled' ? '#FEF2F2' : palette.bg,
                                                        border: `1.5px solid ${entry.status === 'cancelled' ? '#FECACA' : palette.border}`,
                                                        borderRadius: '16px', padding: '12px',
                                                        borderLeft: `4px solid ${statusColor}`,
                                                        opacity: entry.status === 'cancelled' ? 0.65 : 1,
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default',
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <p style={{ fontSize: '13px', fontWeight: 800, color: palette.text, margin: 0, lineHeight: 1.3 }}>
                                                                {entry.subject}
                                                            </p>
                                                            {entry.status !== 'scheduled' && (
                                                                <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 5px', borderRadius: '4px', background: entry.status === 'completed' ? '#D1FAE5' : '#FEE2E2', color: entry.status === 'completed' ? '#065F46' : '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                                                                    {entry.status === 'completed' ? '✓' : '✕'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={11} color="#8F92A1" /> {formatTime12(entry.start_time)}
                                                            {entry.end_time ? ` - ${formatTime12(entry.end_time)}` : ''}
                                                        </p>
                                                        {entry.teacher && (
                                                            <p style={{ fontSize: '10px', color: '#64748B', margin: '4px 0 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <User size={10} color="#8F92A1" /> {entry.teacher.first_name} {entry.teacher.last_name}
                                                            </p>
                                                        )}
                                                        {entry.room && (
                                                            <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0 0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <MapPin size={10} color="#A1A5B7" /> {entry.room}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                                display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto',
                                padding: '6px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '18px',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
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
                                                flex: 1, padding: '14px 10px', borderRadius: '14px',
                                                border: 'none', cursor: 'pointer', textAlign: 'center',
                                                background: isSelected ? (isToday ? 'linear-gradient(135deg, #E53935 0%, #C62828 100%)' : 'rgba(229, 57, 53, 0.08)') : 'transparent',
                                                color: isSelected ? (isToday ? 'white' : '#E53935') : '#94A3B8',
                                                boxShadow: isSelected ? '0 4px 12px rgba(229, 57, 53, 0.1)' : 'none',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '80px',
                                            }}
                                        >
                                            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', margin: 0, opacity: 0.85 }}>{DAY_LABELS[i]}</p>
                                            <p style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0' }}>{d.getDate()}</p>
                                            {count > 0 && (
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 800,
                                                    background: isSelected && isToday ? 'rgba(255,255,255,0.2)' : 'rgba(229, 57, 53, 0.08)',
                                                    color: isSelected && isToday ? 'white' : '#E53935',
                                                    padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '6px',
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
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '80px 20px', 
                                            background: 'rgba(255, 255, 255, 0.9)', 
                                            borderRadius: '24px', 
                                            border: '1px solid rgba(226, 232, 240, 0.8)',
                                            backdropFilter: 'blur(16px)',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.03)'
                                        }}>
                                            <Calendar size={48} color="#E53935" style={{ opacity: 0.8, marginBottom: '16px' }} />
                                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B' }}>No Classes</h3>
                                            <p style={{ color: '#64748B', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                                                You have no classes scheduled for {FULL_DAY_LABELS[selectedDayIdx]}, {weekDates[selectedDayIdx].toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ position: 'relative', paddingLeft: '36px' }}>
                                        {/* Vertical timeline line */}
                                        <div style={{ position: 'absolute', left: '14px', top: '24px', bottom: '24px', width: '3px', background: 'linear-gradient(to bottom, #E53935, #C62828, rgba(229, 57, 53, 0.1))', borderRadius: '4px' }} />

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {dayEntries.map((entry: any, idx: number) => {
                                                const palette = getSubjectPalette(entry.subject);
                                                return (
                                                    <div key={entry.id} style={{ position: 'relative', display: 'flex', gap: '24px', alignItems: 'stretch' }}>
                                                        {/* Timeline dot */}
                                                        <div style={{
                                                            position: 'absolute', left: '-30px', top: '24px',
                                                            width: '14px', height: '14px', borderRadius: '50%',
                                                            background: palette.dot, border: '3px solid white',
                                                            boxShadow: '0 0 0 3px ' + palette.dot + '30', zIndex: 2,
                                                        }} />

                                                        {/* Time column */}
                                                        <div style={{ minWidth: '84px', paddingTop: '18px', textAlign: 'right', flexShrink: 0 }}>
                                                            <p style={{ fontSize: '16px', fontWeight: 900, color: '#1A1D3B', margin: 0 }}>{formatTime12(entry.start_time)}</p>
                                                            {entry.end_time && <p style={{ fontSize: '12px', color: '#8F92A1', margin: '4px 0 0', fontWeight: 700 }}>{formatTime12(entry.end_time)}</p>}
                                                        </div>

                                                        {/* Card */}
                                                        <div style={{
                                                            flex: 1, background: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px',
                                                            border: `1.5px solid ${palette.border}`,
                                                            borderLeft: `5px solid ${palette.dot}`,
                                                            padding: '24px', backdropFilter: 'blur(16px)',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        }}
                                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${palette.dot}10`; }}
                                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.02)'; }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                                <div>
                                                                    <h3 style={{ fontSize: '19px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                                    <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0', fontWeight: 600 }}>
                                                                        {entry.class_ref?.class_name}
                                                                    </p>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '11px', fontWeight: 800, padding: '6px 14px', borderRadius: '50px',
                                                                    background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`,
                                                                    textTransform: 'uppercase', letterSpacing: '0.04em'
                                                                }}>
                                                                    {entry.status === 'completed' ? '✓ Completed' : entry.status === 'cancelled' ? '✕ Cancelled' : 'Scheduled'}
                                                                </span>
                                                            </div>

                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                                                {entry.teacher && (
                                                                    <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                                        <User size={14} color="#8F92A1" /> {entry.teacher.first_name} {entry.teacher.last_name}
                                                                    </span>
                                                                )}
                                                                {entry.room && (
                                                                    <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                                        <MapPin size={14} color="#8F92A1" /> Room {entry.room}
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                                    <Clock size={14} color="#8F92A1" /> {formatTime12(entry.start_time)}{entry.end_time ? ` - ${formatTime12(entry.end_time)}` : ''}
                                                                </span>
                                                            </div>

                                                            {entry.notes && (
                                                                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9', fontSize: '12px', color: '#64748B', fontWeight: 500, fontStyle: 'italic' }}>
                                                                    📝 Notes: {entry.notes}
                                                                </div>
                                                            )}
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

                    {/* Subject Legend */}
                    {subjects.length > 0 && (
                        <div style={{
                            marginTop: '32px', padding: '20px 24px', background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)',
                            backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                            display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <BookOpen size={14} color="#E53935" /> Course Index:
                            </span>
                            {subjects.map(s => {
                                const p = getSubjectPalette(s);
                                const isFilterActive = filterSubject.toLowerCase() === s.toLowerCase();
                                return (
                                    <span
                                        key={s}
                                        onClick={() => setFilterSubject(isFilterActive ? '' : s)}
                                        style={{
                                            fontSize: '12px', fontWeight: 750, padding: '6px 14px', borderRadius: '10px',
                                            background: isFilterActive ? '#E53935' : p.bg,
                                            color: isFilterActive ? 'white' : p.text,
                                            border: `1px solid ${isFilterActive ? '#E53935' : p.border}`, cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                        onMouseEnter={e => { if(!isFilterActive) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { if(!isFilterActive) e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {s}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, BookOpen, Layers } from 'lucide-react';

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

    // Filter + group by date
    const entriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        const filtered = filterSubject
            ? rawTimetable.filter(t => t.subject === filterSubject)
            : rawTimetable;

        filtered.forEach(entry => {
            if (!map[entry.date]) map[entry.date] = [];
            map[entry.date].push(entry);
        });

        // Sort each day by start_time
        Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
        return map;
    }, [rawTimetable, filterSubject]);

    // Stats
    const weekEntries = useMemo(() => {
        const dateStrs = weekDates.map(formatDateStr);
        return dateStrs.flatMap(d => entriesByDate[d] || []);
    }, [weekDates, entriesByDate]);

    const todayEntries = entriesByDate[todayStr] || [];

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B' }}>My Class Schedule</h1>
                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
                        Your weekly classes at a glance. Never miss a session.
                    </p>
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
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', minWidth: '180px', textAlign: 'center' }}>
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

                    {/* Subject filter */}
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
                </div>

                {/* ── Quick Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '16px', padding: '18px 20px', color: 'white' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0 0' }}>{todayEntries.length}</p>
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
                        <p style={{ fontSize: '12px', opacity: 0.75 }}>enrolled</p>
                    </div>
                    {todayEntries.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Class</p>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: '4px 0 0' }}>{todayEntries[0]?.subject}</p>
                            <p style={{ fontSize: '12px', color: '#64748B' }}>{formatTime12(todayEntries[0]?.start_time)}</p>
                        </div>
                    )}
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
                                        <p style={{
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
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3, fontSize: '12px', color: '#94A3B8' }}>
                                                No class
                                            </div>
                                        )}
                                        {dayEntries.map((entry: any) => {
                                            const palette = getSubjectPalette(entry.subject);
                                            return (
                                                <div key={entry.id} style={{
                                                    background: palette.bg, border: `1.5px solid ${palette.border}`,
                                                    borderRadius: '12px', padding: '10px 12px',
                                                    borderLeft: `4px solid ${palette.dot}`,
                                                    transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    <p style={{ fontSize: '13px', fontWeight: 800, color: palette.text, margin: 0, lineHeight: 1.2 }}>
                                                        {entry.subject}
                                                    </p>
                                                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={10} /> {formatTime12(entry.start_time)}
                                                        {entry.end_time ? ` – ${formatTime12(entry.end_time)}` : ''}
                                                    </p>
                                                    {entry.room && (
                                                        <p style={{ fontSize: '10px', color: '#94A3B8', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <MapPin size={9} /> {entry.room}
                                                        </p>
                                                    )}
                                                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {entry.class_ref?.class_name}
                                                    </p>
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
                                        <Calendar size={48} color="#CBD5E1" />
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px', color: '#1A1D3B' }}>No Classes</h3>
                                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
                                            You have no classes scheduled for {FULL_DAY_LABELS[selectedDayIdx]}, {weekDates[selectedDayIdx].toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                    {/* Vertical timeline line */}
                                    <div style={{ position: 'absolute', left: '14px', top: '20px', bottom: '20px', width: '3px', background: 'linear-gradient(to bottom, #6366F1, #8B5CF6, #C7D2FE)', borderRadius: '2px' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {dayEntries.map((entry: any, idx: number) => {
                                            const palette = getSubjectPalette(entry.subject);
                                            return (
                                                <div key={entry.id} style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                                                    {/* Timeline dot */}
                                                    <div style={{
                                                        position: 'absolute', left: '-26px', top: '24px',
                                                        width: '14px', height: '14px', borderRadius: '50%',
                                                        background: palette.dot, border: '3px solid white',
                                                        boxShadow: '0 0 0 2px ' + palette.dot + '40', zIndex: 2,
                                                    }} />

                                                    {/* Time column */}
                                                    <div style={{ minWidth: '80px', paddingTop: '16px', textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{formatTime12(entry.start_time)}</p>
                                                        {entry.end_time && <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: 600 }}>{formatTime12(entry.end_time)}</p>}
                                                    </div>

                                                    {/* Card */}
                                                    <div style={{
                                                        flex: 1, background: 'white', borderRadius: '18px',
                                                        border: `1.5px solid ${palette.border}`,
                                                        borderLeft: `5px solid ${palette.dot}`,
                                                        padding: '20px 24px',
                                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${palette.dot}15`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0', fontWeight: 500 }}>
                                                                    {entry.class_ref?.class_name}
                                                                </p>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                                                                background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`,
                                                            }}>
                                                                {entry.status === 'completed' ? '✓ Done' : entry.status === 'cancelled' ? '✕ Cancelled' : 'Scheduled'}
                                                            </span>
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
                        {subjects.map(s => {
                            const p = getSubjectPalette(s);
                            return (
                                <span
                                    key={s}
                                    onClick={() => setFilterSubject(filterSubject === s ? '' : s)}
                                    style={{
                                        fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                                        background: filterSubject === s ? p.dot : p.bg,
                                        color: filterSubject === s ? 'white' : p.text,
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
        </DashboardLayout>
    );
}

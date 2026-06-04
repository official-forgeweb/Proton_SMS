'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ClassSubjectSelector from '@/components/ClassSubjectSelector';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Calendar as CalendarIcon, Plus, Clock, Trash2, Edit2,
    X, MapPin, User, ChevronLeft, ChevronRight, Filter, BookOpen, Layers, Video, ExternalLink, Sparkles, BarChart3
} from 'lucide-react';

interface Props {
  initialTimetable: any[];
  initialClasses: any[];
  initialFilters: { start_date: string; end_date: string };
  teacherProfile: any;
}

const SUBJECT_PALETTES: Record<string, { bg: string; border: string; text: string; dot: string; glow: string }> = {
    'Physics':     { bg: '#FFF5F5', border: '#FFCDD2', text: '#C62828', dot: '#E53935', glow: 'rgba(229, 57, 53, 0.15)' },
    'Chemistry':   { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', dot: '#F97316', glow: 'rgba(249, 115, 22, 0.15)' },
    'Mathematics': { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.15)' },
    'Maths':       { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.15)' },
    'Biology':     { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E', glow: 'rgba(34, 197, 94, 0.15)' },
    'English':     { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', dot: '#EC4899', glow: 'rgba(236, 72, 153, 0.15)' },
    'Hindi':       { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B', glow: 'rgba(245, 158, 11, 0.15)' },
    'SST':         { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981', glow: 'rgba(16, 185, 129, 0.15)' },
    'Computer':    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', dot: '#0EA5E9', glow: 'rgba(14, 165, 233, 0.15)' },
};

const getSubjectPalette = (subject: string) =>
    SUBJECT_PALETTES[subject] || { bg: 'var(--bg-primary)', border: 'var(--border-primary)', text: 'var(--text-secondary)', dot: 'var(--text-tertiary)', glow: 'rgba(0, 0, 0, 0.05)' };

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    const router = useRouter();
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
        online_link: '',
        notes: ''
    });

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
        const confirmSave = window.confirm(
            editingEntry
                ? 'Are you sure you want to update this scheduled class?'
                : 'Are you sure you want to schedule this new class?'
        );
        if (!confirmSave) return;
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
        if (!window.confirm('⚠️ WARNING: Are you sure you want to remove this class from your schedule? This action cannot be undone.')) return;
        try {
            setIsLoading(true);
            await api.delete(`/timetable/${id}`);
            fetchTimetableIfNeeded();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Error deleting schedule.');
        } finally {
            setIsLoading(false);
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
                online_link: entry.online_link || '',
                notes: entry.notes || ''
            });
        } else {
            setEditingEntry(null);
            setFormData({
                class_id: '',
                subject: '',
                teacher_id: teacherProfile?.id || '',
                date: formatDateStr(weekDates[selectedDayIdx]) || new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00',
                room: '',
                online_link: '',
                notes: ''
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

    // Summary stats
    const weekTotal = useMemo(() => {
        let count = 0;
        weekDates.forEach(d => { count += (entriesByDate[formatDateStr(d)] || []).length; });
        return count;
    }, [weekDates, entriesByDate]);

    return (
        <div className="bg-mesh" style={{ padding: '0 0 50px 0', minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes floatUp { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes breathe-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } }
                @keyframes breathe-primary { 0%, 100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.3); } 50% { box-shadow: 0 0 0 8px rgba(229, 57, 53, 0); } }
                @keyframes modal-fade-in { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

                .tt-float { animation: floatUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                .tt-week-header-cell {
                    padding: 20px 8px; text-align: center; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative;
                }
                .tt-week-header-cell:hover { background: rgba(229, 57, 53, 0.035); }
                
                .tt-week-body-cell {
                    padding: 16px 12px; min-height: 340px; display: flex; flex-direction: column; gap: 12px;
                    transition: background 0.25s;
                }
                .tt-week-body-cell:hover { background: rgba(229, 57, 53, 0.015); }
                
                .tt-entry-card {
                    border-radius: 16px; padding: 14px; cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
                }
                .tt-entry-card:hover { 
                    transform: translateY(-4px) scale(1.03); 
                    box-shadow: 0 10px 24px rgba(0,0,0,0.06); 
                }
                
                .tt-day-pill {
                    flex: 1; padding: 18px 12px; border-radius: 16px; border: none; cursor: pointer;
                    text-align: center; min-width: 85px; transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative; overflow: hidden; background: transparent;
                }
                .tt-day-pill:hover { background: rgba(229, 57, 53, 0.04); }
                
                .tt-timeline-entry {
                    position: relative; display: flex; gap: 28px; align-items: stretch;
                }
                
                .tt-timeline-card {
                    flex: 1; background: #FFFFFF; border-radius: 24px; padding: 24px 32px;
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); display: flex;
                    justify-content: space-between; align-items: center;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.015);
                    border: 1px solid rgba(0,0,0,0.01);
                }
                .tt-timeline-card:hover { transform: translateX(8px) translateY(-2px); box-shadow: 0 14px 36px rgba(0,0,0,0.045); }
                
                .tt-nav-btn {
                    background: #FFFFFF; border: 1px solid var(--border-primary); border-radius: 14px;
                    padding: 10px 16px; cursor: pointer; display: flex; align-items: center;
                    transition: all 0.25s; box-shadow: 0 2px 6px rgba(0,0,0,0.015);
                }
                .tt-nav-btn:hover { background: var(--primary-light); border-color: rgba(229, 57, 53, 0.18); transform: translateY(-1px); }
                
                .tt-view-btn {
                    padding: 11px 24px; border-radius: 14px; border: none; cursor: pointer;
                    font-weight: 700; font-size: 13.5px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; align-items: center; gap: 8px;
                }
                
                .tt-filter-select {
                    padding: 12px 20px; border-radius: 16px; font-size: 13.5px; font-weight: 700;
                    cursor: pointer; outline: none; transition: all 0.25s;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.015);
                }
                .tt-filter-select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08); }
            `}} />

            {/* ── Premium Hero Header ── */}
            <div className="tt-float" style={{
                background: 'linear-gradient(135deg, #0f1123 0%, #070913 50%, #1f0505 100%)',
                margin: '0 8px', borderRadius: '0 0 32px 32px', padding: '40px 48px 48px',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(15, 17, 35, 0.25)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                {/* Visual mesh glows */}
                <div style={{ position: 'absolute', top: '-60px', right: '60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.14) 0%, transparent 70%)', filter: 'blur(30px)', animation: 'float-gentle 6s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '25%', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '28px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{
                                background: 'rgba(229, 57, 53, 0.16)', color: '#FF8A80', fontSize: '11px', fontWeight: 800,
                                padding: '5px 16px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1.2px',
                                border: '1px solid rgba(229, 57, 53, 0.25)', backdropFilter: 'blur(8px)'
                            }}>
                                Schedule Manager
                            </span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.8px' }}>My Schedule</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14.5px', marginTop: '8px', fontWeight: 500, maxWidth: '580px', lineHeight: 1.5 }}>
                            Plan upcoming batches, allocate physical lecture classrooms, and schedule virtual live streams.
                        </p>
                        
                        {/* Premium Inline Week Stats */}
                        <div style={{ display: 'flex', gap: '24px', marginTop: '22px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'This Week', value: weekTotal, color: '#FF8A80', bg: 'rgba(229,57,53,0.1)' },
                                { label: 'Today', value: (entriesByDate[todayStr] || []).length, color: '#80D8FF', bg: 'rgba(0,172,233,0.1)' },
                                { label: 'Batches Assigned', value: classes.length, color: '#B9F6CA', bg: 'rgba(16,185,129,0.1)' },
                            ].map(m => (
                                <div key={m.label} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    background: 'rgba(255, 255, 255, 0.04)', padding: '8px 18px', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <span style={{ fontSize: '24px', fontWeight: 800, color: m.color, fontFamily: 'Poppins, sans-serif' }}>{m.value}</span>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button
                        onClick={() => openModal()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--gradient-primary)', color: 'white', border: 'none',
                            padding: '16px 28px', borderRadius: '18px', fontWeight: 800, fontSize: '14.5px',
                            transition: 'all 0.25s', cursor: 'pointer', boxShadow: '0 6px 20px rgba(229, 57, 53, 0.4)',
                            animation: 'breathe-primary 3s infinite'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(229, 57, 53, 0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.4)'; }}
                    >
                        <Plus size={18} strokeWidth={3} /> Schedule Class
                    </button>
                </div>
            </div>

            <div style={{ padding: '0 16px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* ── Top Controls Bar ── */}
                <div className="tt-float" style={{
                    display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center',
                    justifyContent: 'space-between', marginTop: '36px', marginBottom: '32px',
                    padding: '20px 28px', borderRadius: '26px', background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.015)',
                    animationDelay: '100ms'
                }}>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '5px' }}>
                        <button onClick={() => setViewMode('week')} className="tt-view-btn" style={{
                            background: viewMode === 'week' ? '#FFFFFF' : 'transparent',
                            color: viewMode === 'week' ? 'var(--primary)' : 'var(--text-tertiary)',
                            boxShadow: viewMode === 'week' ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                        }}>
                            <Layers size={15} /> Week View
                        </button>
                        <button onClick={() => setViewMode('day')} className="tt-view-btn" style={{
                            background: viewMode === 'day' ? '#FFFFFF' : 'transparent',
                            color: viewMode === 'day' ? 'var(--primary)' : 'var(--text-tertiary)',
                            boxShadow: viewMode === 'day' ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                        }}>
                            <CalendarIcon size={15} /> Day View
                        </button>
                    </div>

                    {/* Week Navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setWeekOffset(w => w - 1)} className="tt-nav-btn"><ChevronLeft size={20} color="var(--text-secondary)" /></button>
                        <span suppressHydrationWarning style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', minWidth: '220px', textAlign: 'center', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
                            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(w => w + 1)} className="tt-nav-btn"><ChevronRight size={20} color="var(--text-secondary)" /></button>
                        {weekOffset !== 0 && (
                            <button onClick={() => setWeekOffset(0)} style={{
                                background: 'var(--gradient-primary)', border: 'none', borderRadius: '14px',
                                padding: '10px 22px', cursor: 'pointer', color: 'white', fontWeight: 800,
                                fontSize: '13px', transition: 'all 0.25s', boxShadow: '0 4px 14px rgba(229, 57, 53, 0.25)'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Current Week
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <select
                            value={filterClass} onChange={e => setFilterClass(e.target.value)}
                            className="tt-filter-select"
                            style={{
                                border: `1.5px solid ${filterClass ? 'var(--primary)' : 'var(--border-secondary)'}`,
                                background: filterClass ? 'var(--primary-light)' : '#FFFFFF',
                                color: filterClass ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                        <select
                            value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                            className="tt-filter-select"
                            style={{
                                border: `1.5px solid ${filterSubject ? 'var(--primary)' : 'var(--border-secondary)'}`,
                                background: filterSubject ? 'var(--primary-light)' : '#FFFFFF',
                                color: filterSubject ? 'var(--primary)' : 'var(--text-secondary)'
                            }}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Main Calendar Content ── */}
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '130px', borderRadius: '24px' }} />)}
                    </div>
                ) : viewMode === 'week' ? (
                    /* ── WEEK VIEW ── */
                    <div className="tt-float" style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(229, 57, 53, 0.05)', boxShadow: '0 8px 30px rgba(0,0,0,0.02)', background: '#FFFFFF', animationDelay: '200ms' }}>
                        {/* Week header row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-primary)', background: '#FAFBFD' }}>
                            {weekDates.map((d, i) => {
                                const isToday = formatDateStr(d) === todayStr;
                                const count = (entriesByDate[formatDateStr(d)] || []).length;
                                return (
                                    <div key={i} className="tt-week-header-cell" onClick={() => { setSelectedDayIdx(i); setViewMode('day'); }}
                                        style={{ borderRight: i < 6 ? '1px solid var(--border-primary)' : 'none', background: isToday ? 'rgba(229, 57, 53, 0.03)' : 'transparent' }}
                                    >
                                        <p style={{ fontSize: '11px', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--text-tertiary)', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>{DAY_LABELS[i]}</p>
                                        <p suppressHydrationWarning style={{
                                            fontSize: '22px', fontWeight: 800, margin: '8px auto 0',
                                            width: '42px', height: '42px', lineHeight: '42px', borderRadius: '14px',
                                            background: isToday ? 'var(--gradient-primary)' : 'transparent',
                                            color: isToday ? 'white' : 'var(--text-primary)',
                                            fontFamily: 'Poppins, sans-serif',
                                            boxShadow: isToday ? '0 6px 16px rgba(229, 57, 53, 0.25)' : 'none'
                                        }}>{d.getDate()}</p>
                                        {count > 0 && (
                                            <span style={{
                                                display: 'inline-block', marginTop: '8px', fontSize: '10.5px', fontWeight: 800,
                                                background: isToday ? 'rgba(229, 57, 53, 0.08)' : 'var(--bg-secondary)',
                                                color: isToday ? 'var(--primary)' : 'var(--text-secondary)',
                                                padding: '3px 10px', borderRadius: '8px', border: isToday ? '1px solid rgba(229,57,53,0.1)' : '1px solid transparent'
                                            }}>{count} class{count > 1 ? 'es' : ''}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Week body grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '400px' }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const dayEntries = entriesByDate[dateStr] || [];
                                const isToday = dateStr === todayStr;
                                return (
                                    <div key={i} className="tt-week-body-cell" style={{ borderRight: i < 6 ? '1px solid var(--border-primary)' : 'none', background: isToday ? 'rgba(255,244,244,0.1)' : 'transparent' }}>
                                        {dayEntries.length === 0 && <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px', opacity: 0.35, fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Free day</div>}
                                        {dayEntries.map((entry: any) => {
                                            const isTest = entry.type === 'test';
                                            const palette = getSubjectPalette(entry.subject);
                                            const isOnline = !!entry.online_link;
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className="tt-entry-card"
                                                    onClick={(e) => { e.stopPropagation(); isTest ? router.push(`/teacher/tests/${entry.id}`) : openModal(entry); }}
                                                    style={{
                                                        background: isTest ? '#FFF1F2' : palette.bg,
                                                        border: `1px solid ${isTest ? '#FECDD3' : palette.border}`,
                                                        borderLeft: `5px solid ${isTest ? '#EF4444' : palette.dot}`,
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 20px ${isTest ? 'rgba(239,68,68,0.1)' : palette.glow}`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)'; }}
                                                >
                                                    {isTest && <span style={{ position: 'absolute', top: '5px', right: '6px', fontSize: '8px', fontWeight: 850, color: '#EF4444', textTransform: 'uppercase', background: 'white', padding: '2px 6px', borderRadius: '5px', border: '1px solid #FECDD3', letterSpacing: '0.3px' }}>Test</span>}
                                                    {isOnline && !isTest && <span style={{ position: 'absolute', top: '5px', right: '6px', fontSize: '8px', fontWeight: 850, color: 'var(--success)', textTransform: 'uppercase', background: 'var(--success-light)', padding: '2px 6px', borderRadius: '5px', letterSpacing: '0.3px' }}>Live</span>}
                                                    <p style={{ fontSize: '13.5px', fontWeight: 800, color: isTest ? '#B91C1C' : palette.text, margin: 0, lineHeight: 1.3 }}>{entry.subject}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '8px 0 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={11} color="var(--primary)" /> {formatTime12(entry.start_time)}
                                                    </p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '5px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.class_ref?.class_name}</p>
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
                    <div className="tt-float" style={{ animationDelay: '200ms' }}>
                        {/* Day pills selector */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', overflowX: 'auto', padding: '8px', background: '#FFFFFF', borderRadius: '22px', border: '1px solid rgba(229, 57, 53, 0.04)', boxShadow: '0 4px 16px rgba(0,0,0,0.015)' }}>
                            {weekDates.map((d, i) => {
                                const dateStr = formatDateStr(d);
                                const isToday = dateStr === todayStr;
                                const isSelected = i === selectedDayIdx;
                                const count = (entriesByDate[dateStr] || []).length;
                                return (
                                    <button key={i} onClick={() => setSelectedDayIdx(i)} className="tt-day-pill" style={{
                                        background: isSelected ? (isToday ? 'var(--gradient-primary)' : '#FFFFFF') : 'transparent',
                                        color: isSelected ? (isToday ? 'white' : 'var(--primary)') : 'var(--text-tertiary)',
                                        boxShadow: isSelected ? (isToday ? '0 6px 20px rgba(229, 57, 53, 0.35)' : '0 4px 12px rgba(0,0,0,0.04)') : 'none',
                                        border: isSelected && !isToday ? '1px solid rgba(229, 57, 53, 0.15)' : '1px solid transparent'
                                    }}>
                                        <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', margin: 0, letterSpacing: '0.8px' }}>{DAY_LABELS[i]}</p>
                                        <p style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>{d.getDate()}</p>
                                        {count > 0 && <span style={{
                                            fontSize: '10.5px', fontWeight: 800,
                                            background: isSelected && isToday ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                                            color: isSelected && isToday ? 'white' : 'var(--primary)',
                                            padding: '2px 10px', borderRadius: '8px', display: 'inline-block', marginTop: '8px',
                                            border: isSelected && isToday ? 'none' : '1px solid rgba(229,57,53,0.05)'
                                        }}>{count}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Day timeline */}
                        {(() => {
                            const dateStr = formatDateStr(weekDates[selectedDayIdx]);
                            const dayEntries = entriesByDate[dateStr] || [];

                            if (dayEntries.length === 0) return (
                                <div style={{ textAlign: 'center', padding: '90px 20px', background: '#FFFFFF', borderRadius: '28px', border: '1px dashed var(--border-secondary)', boxShadow: '0 4px 16px rgba(0,0,0,0.01)' }}>
                                    <CalendarIcon size={56} color="var(--text-tertiary)" style={{ margin: '0 auto 20px', display: 'block', opacity: 0.35 }} />
                                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>No Sessions Scheduled</h3>
                                    <p style={{ fontSize: '13.5px', color: 'var(--text-tertiary)', marginTop: '8px', maxWidth: '380px', margin: '8px auto 0', lineHeight: 1.6 }}>There are no classes or exams scheduled for this day. Click the schedule button to add one!</p>
                                </div>
                            );

                            return (
                                <div style={{ position: 'relative', paddingLeft: '40px' }}>
                                    {/* Timeline spine */}
                                    <div style={{ position: 'absolute', left: '18px', top: '24px', bottom: '24px', width: '4px', background: 'linear-gradient(180deg, var(--primary) 0%, rgba(229, 57, 53, 0.08) 100%)', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {dayEntries.map((entry: any) => {
                                            const isTest = entry.type === 'test';
                                            const palette = getSubjectPalette(entry.subject);
                                            const isOnline = !!entry.online_link;
                                            return (
                                                <div key={entry.id} className="tt-timeline-entry">
                                                    {/* Timeline dot */}
                                                    <div style={{ position: 'absolute', left: '-29.5px', top: '30px', width: '17px', height: '17px', borderRadius: '50%', background: isTest ? '#EF4444' : palette.dot, border: '4px solid white', boxShadow: `0 0 0 4px ${isTest ? 'rgba(239,68,68,0.2)' : palette.glow}`, zIndex: 2 }} />
                                                    {/* Time label */}
                                                    <div style={{ minWidth: '110px', paddingTop: '18px', textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>{formatTime12(entry.start_time)}</p>
                                                        {entry.end_time && <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '6px 0 0', fontWeight: 700 }}>{formatTime12(entry.end_time)}</p>}
                                                    </div>
                                                    {/* Session card */}
                                                    <div className="tt-timeline-card" style={{
                                                        border: `1px solid ${isTest ? '#FECDD3' : palette.border}`,
                                                        borderLeft: `6px solid ${isTest ? '#EF4444' : palette.dot}`,
                                                        background: isTest ? '#FFFBFB' : '#FFFFFF'
                                                    }}>
                                                        <div style={{ flex: 1, marginRight: '20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                                <h3 style={{ fontSize: '19px', fontWeight: 800, color: isTest ? '#B91C1C' : '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{entry.subject}</h3>
                                                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '10px', background: isTest ? '#FFF1F2' : palette.bg, color: isTest ? '#EF4444' : palette.text, border: `1.5px solid ${isTest ? '#FECDD3' : palette.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                                    {isTest ? 'EXAMINATION' : entry.class_ref?.class_name}
                                                                </span>
                                                                {isTest && <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '10px', background: '#EF4444', color: 'white', textTransform: 'uppercase' }}>{entry.class_ref?.class_name}</span>}
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
                                                                {entry.room && (
                                                                    <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                                        <MapPin size={15} color="var(--primary)" /> {isOnline ? 'Virtual Room' : `Room ${entry.room}`}
                                                                    </span>
                                                                )}
                                                                {isOnline && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <span style={{ fontSize: '13.5px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                                                                            <Video size={15} color="var(--success)" /> Live Stream Class
                                                                        </span>
                                                                        <a
                                                                            href={entry.online_link.startsWith('http') ? entry.online_link : `https://${entry.online_link}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            style={{
                                                                                fontSize: '11.5px', fontWeight: 800, color: 'white', background: 'var(--success)',
                                                                                padding: '5px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px',
                                                                                textDecoration: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                                                                animation: 'breathe-green 2.5s infinite'
                                                                            }}
                                                                        >
                                                                            Join Meeting <ExternalLink size={11} />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {entry.notes && <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '14px', fontStyle: 'italic', background: '#FAFBFE', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', lineHeight: 1.5 }}>📝 {isTest ? 'Test Syllabus & Guidelines: ' : 'Agenda / Lesson Notes: '} {entry.notes}</p>}
                                                        </div>
                                                        
                                                        {/* Actions Column */}
                                                        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                                                            {isTest ? (
                                                                <button
                                                                    onClick={() => router.push(`/teacher/tests/${entry.id}`)}
                                                                    style={{ padding: '12px 20px', borderRadius: '14px', background: '#EF4444', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: '13px', transition: 'all 0.25s', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
                                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.3)'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)'; }}
                                                                >
                                                                    Manage Test
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => openModal(entry)} style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                                    ><Edit2 size={16} /></button>
                                                                    <button onClick={() => handleDelete(entry.id)} style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#FFF5F5', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', color: '#EF4444', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                                        onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                                    ><Trash2 size={16} /></button>
                                                                </>
                                                            )}
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

            {/* ── Modal for adding/editing ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,15,35,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div className="tt-float" style={{ background: '#FFFFFF', width: '100%', maxWidth: '600px', borderRadius: '32px', padding: '40px', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(229, 57, 53, 0.08)', animation: 'modal-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '28px', right: '28px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', borderRadius: '14px', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                        ><X size={22} color="var(--text-secondary)" /></button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'var(--gradient-primary)', width: '52px', height: '52px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 6px 16px rgba(229, 57, 53, 0.25)' }}><CalendarIcon size={24} /></div>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.5px' }}>{editingEntry ? 'Edit Class Schedule' : 'Schedule New Class'}</h2>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 550 }}>{editingEntry ? 'Modify parameters for the scheduled session' : 'Create a new date-specific scheduled session'}</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginBottom: '32px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Class Target <span style={{ color: 'var(--primary)' }}>*</span></label>
                                    <select required value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value, subject: '' })} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s', cursor: 'pointer' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                    >
                                        <option value="">Select a Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                    </select>
                                </div>
                                
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Subject <span style={{ color: 'var(--primary)' }}>*</span></label>
                                    <ClassSubjectSelector
                                        classId={formData.class_id}
                                        value={formData.subject}
                                        onChange={(subject) => setFormData({ ...formData, subject })}
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Session Date <span style={{ color: 'var(--primary)' }}>*</span></label>
                                    <DatePicker required selected={formData.date ? new Date(formData.date) : null} onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" customInput={<input style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }} />} />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Start Time <span style={{ color: 'var(--primary)' }}>*</span></label>
                                        <DatePicker required selected={formData.start_time ? new Date(`2000-01-01T${formData.start_time}:00`) : null} onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, start_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" customInput={<input style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }} />} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>End Time</label>
                                        <DatePicker selected={formData.end_time ? new Date(`2000-01-01T${formData.end_time}:00`) : null} onChange={(date: Date | null) => { if (date) { setFormData({ ...formData, end_time: date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') }); } }} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" customInput={<input style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }} />} />
                                    </div>
                                </div>
                                
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Physical Lecture Room (Optional)</label>
                                    <input type="text" placeholder="e.g. Room 104, Physics Lab A" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                    />
                                </div>
                                
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Online Meeting Stream URL (Optional)</label>
                                    <input type="text" placeholder="https://zoom.us/j/... or meet.google.com/..." value={formData.online_link} onChange={(e) => setFormData({ ...formData, online_link: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                    />
                                </div>
                                
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Agenda / Lesson Guidelines (Optional)</label>
                                    <input type="text" placeholder="e.g. Discuss chapter 3 exercises, bring lab kits" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid var(--border-secondary)', outline: 'none', fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s' }}
                                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                    />
                                </div>
                            </div>
                            
                            <button type="submit" style={{
                                width: '100%', padding: '18px', background: 'var(--gradient-primary)', color: 'white',
                                border: 'none', borderRadius: '18px', fontWeight: 800, fontSize: '16px',
                                cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 20px rgba(229, 57, 53, 0.35)'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(229, 57, 53, 0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.35)'; }}
                            >
                                {editingEntry ? 'Save Changes' : 'Schedule Class'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

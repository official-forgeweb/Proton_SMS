'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, Filter, TrendingUp, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface AttendanceRecord {
    id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'late';
    class_id: string;
    class_name?: string;
    class_code?: string;
    class_subject?: string;
}

interface EnrolledClass {
    id: string;
    class_name: string;
    class_code: string;
    subject?: string;
    enrollment_date?: string;
    subjects: string[];
}

interface AttendanceSummary {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentAttendancePage() {
    const { user } = useAuthStore();
    const [studentId, setStudentId] = useState<string | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
    const [enrollmentDate, setEnrollmentDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    // Class & Subject Selection
    const [selectedClassName, setSelectedClassName] = useState<string>('');
    const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');

    // Fetch ALL attendance for the month
    useEffect(() => {
        const userId = user?.id || user?.profile?.PRO_ID;
        if (!userId) return;
        const fetchAttendance = async () => {
            setIsLoading(true);
            try {
                const params: any = { month: selectedMonth, year: selectedYear };
                const res = await api.get(`/students/${userId}/attendance`, { params });
                const data = res.data.data;
                setRecords(data.records || []);
                setEnrolledClasses(data.enrolled_classes || []);
                setEnrollmentDate(data.enrollment_date || null);
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        fetchAttendance();
    }, [user, selectedMonth, selectedYear]);

    // Derive available options
    const availableOptions = useMemo(() => {
        const options: Array<{ classId: string; className: string; subjectName: string; label: string }> = [];
        enrolledClasses.forEach(cls => {
            const cName = cls.class_name || cls.class_code;
            if (cls.subjects && cls.subjects.length > 0) {
                cls.subjects.forEach(sub => {
                    options.push({ classId: cls.id, className: cName, subjectName: sub, label: `${cName} - ${sub}` });
                });
            } else if (cls.subject) {
                options.push({ classId: cls.id, className: cName, subjectName: cls.subject, label: `${cName} - ${cls.subject}` });
            } else {
                options.push({ classId: cls.id, className: cName, subjectName: 'General', label: cName });
            }
        });
        return options;
    }, [enrolledClasses]);

    const classNames = useMemo(() => Array.from(new Set(availableOptions.map(o => o.className))), [availableOptions]);
    const subjectsForClass = useMemo(() => availableOptions.filter(o => o.className === selectedClassName).map(o => o.subjectName), [availableOptions, selectedClassName]);

    // Auto-select valid class & subject
    useEffect(() => {
        if (availableOptions.length > 0) {
            const isValid = availableOptions.find(o => o.className === selectedClassName && o.subjectName === selectedSubjectName);
            if (!isValid) {
                setSelectedClassName(availableOptions[0].className);
                setSelectedSubjectName(availableOptions[0].subjectName);
            }
        }
    }, [availableOptions, selectedClassName, selectedSubjectName]);

    const activeClassId = useMemo(() => {
        const opt = availableOptions.find(o => o.className === selectedClassName && o.subjectName === selectedSubjectName);
        return opt ? opt.classId : null;
    }, [selectedClassName, selectedSubjectName, availableOptions]);

    // Filter records for active class ONLY
    const filteredRecords = useMemo(() => {
        if (!activeClassId) return [];
        return records.filter(r => r.class_id === activeClassId);
    }, [records, activeClassId]);

    // Calculate summary dynamically
    const summary = useMemo(() => {
        const total = filteredRecords.length;
        const present = filteredRecords.filter(r => r.status === 'present').length;
        const late = filteredRecords.filter(r => r.status === 'late').length;
        const absent = total - present - late;
        const percentage = total > 0 ? ((present + late) / total * 100) : 0;
        return { total, present, absent, late, percentage };
    }, [filteredRecords]);

    // Build calendar data
    const calendarData = useMemo(() => {
        const year = selectedYear;
        const month = selectedMonth - 1; // JS months are 0-indexed
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // Build attendance map grouped by date
        const attendanceMap: Record<string, AttendanceRecord[]> = {};
        filteredRecords.forEach(r => {
            const dateStr = r.attendance_date;
            if (!attendanceMap[dateStr]) attendanceMap[dateStr] = [];
            attendanceMap[dateStr].push(r);
        });

        const days: Array<{ day: number | null; date: string; records: AttendanceRecord[]; isToday: boolean; isFuture: boolean }> = [];
        
        // Empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ day: null, date: '', records: [], isToday: false, isFuture: false });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentDate = new Date(year, month, d);
            currentDate.setHours(0, 0, 0, 0);
            const isToday = currentDate.getTime() === today.getTime();
            const isFuture = currentDate.getTime() > today.getTime();
            days.push({
                day: d,
                date: dateStr,
                records: attendanceMap[dateStr] || [],
                isToday,
                isFuture,
            });
        }

        return days;
    }, [filteredRecords, selectedMonth, selectedYear]);

    // Navigate months
    const goToPreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };
    const goToNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    // Percentage color
    const getPercentageColor = (pct: number) => {
        if (pct >= 85) return '#10B981';
        if (pct >= 70) return '#F59E0B';
        return '#EF4444';
    };

    const percentageValue = typeof summary.percentage === 'string' ? parseFloat(summary.percentage) : (summary.percentage || 0);

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Track your attendance with calendar view, filter by subject & month.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {/* ── Filters Bar ── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center',
                    padding: '16px 20px', background: 'white', borderRadius: '16px',
                    border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                        <Filter size={16} />
                        Filters
                    </div>

                    {/* Class Filter */}
                    {classNames.length > 0 && (
                        <select
                            value={selectedClassName}
                            onChange={e => {
                                const newClass = e.target.value;
                                setSelectedClassName(newClass);
                                const subs = availableOptions.filter(o => o.className === newClass);
                                if (subs.length > 0) setSelectedSubjectName(subs[0].subjectName);
                            }}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border-primary)',
                                fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                                cursor: 'pointer', outline: 'none', minWidth: '140px',
                            }}
                        >
                            {classNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    )}

                    {/* Subject Filter */}
                    {subjectsForClass.length > 0 && (
                        <select
                            value={selectedSubjectName}
                            onChange={e => setSelectedSubjectName(e.target.value)}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border-primary)',
                                fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                                background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                                cursor: 'pointer', outline: 'none', minWidth: '140px',
                            }}
                        >
                            {subjectsForClass.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    )}

                    {/* Month filter */}
                    <select
                        id="attendance-month-filter"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(parseInt(e.target.value))}
                        style={{
                            padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border-primary)',
                            fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', background: 'white',
                            cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {MONTH_NAMES.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    {/* Year filter */}
                    <select
                        id="attendance-year-filter"
                        value={selectedYear}
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                        style={{
                            padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border-primary)',
                            fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', background: 'white',
                            cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div className="animate-fade-in" style={{ height: '500px', borderRadius: '20px', background: '#F8F9FD', border: '1px solid rgba(226,232,240,0.8)' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-fade-in" style={{ height: '100px', borderRadius: '16px', background: '#F8F9FD', border: '1px solid rgba(226,232,240,0.8)', animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Stats Row ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            {/* Attendance Percentage */}
                            <div style={{
                                background: 'white', borderRadius: '16px', padding: '20px',
                                border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                display: 'flex', alignItems: 'center', gap: '16px',
                            }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: `conic-gradient(${getPercentageColor(percentageValue)} ${percentageValue * 3.6}deg, #F1F5F9 0deg)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%', background: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: 800, color: getPercentageColor(percentageValue),
                                    }}>
                                        {percentageValue.toFixed(0)}%
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</p>
                                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{percentageValue.toFixed(1)}%</p>
                                </div>
                            </div>

                            {/* Present */}
                            <div style={{
                                background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', borderRadius: '16px', padding: '20px',
                                border: '1px solid rgba(16,185,129,0.15)',
                                display: 'flex', alignItems: 'center', gap: '16px',
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16,185,129,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <UserCheck size={22} color="#059669" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#065F46', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Present</p>
                                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{summary.present}</p>
                                </div>
                            </div>

                            {/* Absent */}
                            <div style={{
                                background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', borderRadius: '16px', padding: '20px',
                                border: '1px solid rgba(239,68,68,0.15)',
                                display: 'flex', alignItems: 'center', gap: '16px',
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(239,68,68,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <UserX size={22} color="#DC2626" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#991B1B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Absent</p>
                                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626' }}>{summary.absent}</p>
                                </div>
                            </div>

                            {/* Late / Leave */}
                            <div style={{
                                background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: '16px', padding: '20px',
                                border: '1px solid rgba(245,158,11,0.15)',
                                display: 'flex', alignItems: 'center', gap: '16px',
                            }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,158,11,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Clock size={22} color="#D97706" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#92400E', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leave / Late</p>
                                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#D97706' }}>{summary.late}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Big Calendar ── */}
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '0',
                            border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                        }}>
                            {/* Calendar Header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '20px 28px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                color: 'white',
                            }}>
                                <button
                                    onClick={goToPreviousMonth}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px',
                                        padding: '8px 12px', cursor: 'pointer', color: 'white',
                                        display: 'flex', alignItems: 'center', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                                        {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                    </h2>
                                    <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>
                                        {summary.total} classes this month
                                    </p>
                                </div>

                                <button
                                    onClick={goToNextMonth}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px',
                                        padding: '8px 12px', cursor: 'pointer', color: 'white',
                                        display: 'flex', alignItems: 'center', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Day names header */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                                borderBottom: '1px solid #F1F5F9', background: '#FAFBFC',
                            }}>
                                {DAY_NAMES.map(day => (
                                    <div key={day} style={{
                                        textAlign: 'center', padding: '12px 8px',
                                        fontSize: '13px', fontWeight: 600, color: '#94A3B8',
                                        textTransform: 'uppercase', letterSpacing: '0.5px',
                                    }}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                            }}>
                                {calendarData.map((cell, idx) => {
                                    if (cell.day === null) {
                                        return <div key={`empty-${idx}`} style={{ padding: '16px', minHeight: '80px', background: '#FAFBFC', borderBottom: '1px solid #F8FAFC', borderRight: idx % 7 !== 6 ? '1px solid #F8FAFC' : 'none' }} />;
                                    }

                                    const dayRecords = cell.records || [];
                                    const hasRecords = dayRecords.length > 0;
                                    
                                    let bgColor = 'transparent';
                                    let textColor = cell.isFuture ? '#CBD5E1' : 'var(--text-primary)';

                                    if (hasRecords) {
                                        const status = dayRecords[0].status;
                                        if (status === 'present') { bgColor = '#ECFDF5'; textColor = '#065F46'; }
                                        else if (status === 'absent') { bgColor = '#FEF2F2'; textColor = '#991B1B'; }
                                        else if (status === 'late') { bgColor = '#FFFBEB'; textColor = '#92400E'; }
                                    }

                                    return (
                                        <div
                                            key={cell.date}
                                            style={{
                                                padding: '8px',
                                                minHeight: '80px',
                                                background: cell.isToday ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : bgColor,
                                                borderBottom: '1px solid #F1F5F9',
                                                borderRight: idx % 7 !== 6 ? '1px solid #F1F5F9' : 'none',
                                                position: 'relative',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    fontSize: '14px', fontWeight: cell.isToday ? 800 : 600,
                                                    color: cell.isToday ? '#4F46E5' : textColor,
                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: cell.isToday ? 'rgba(79,70,229,0.12)' : 'transparent',
                                                }}>
                                                    {cell.day}
                                                </span>
                                            </div>

                                            {/* Subject Status Badge */}
                                            {hasRecords && (
                                                <div style={{ marginTop: '8px' }}>
                                                    {(() => {
                                                        const rec = dayRecords[0];
                                                        let statColor = '#059669';
                                                        let statBg = 'rgba(16,185,129,0.15)';
                                                        let statText = 'Present';
                                                        if (rec.status === 'absent') { statColor = '#DC2626'; statBg = 'rgba(239,68,68,0.15)'; statText = 'Absent'; }
                                                        if (rec.status === 'late') { statColor = '#D97706'; statBg = 'rgba(245,158,11,0.15)'; statText = 'Leave'; }
                                                        
                                                        return (
                                                            <div style={{
                                                                fontSize: '11px', fontWeight: 600, color: statColor, background: statBg,
                                                                padding: '4px 8px', borderRadius: '4px', display: 'inline-block'
                                                            }}>
                                                                {statText}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Calendar Legend */}
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: '24px',
                                padding: '16px 20px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                                    Present
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                                    Absent
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                                    Leave / Late
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
                                    No Class
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', border: '1px solid #C7D2FE' }} />
                                    Today
                                </div>
                            </div>
                        </div>

                        {/* ── Subject-wise Breakdown ── */}
                        {enrolledClasses.length > 0 && (
                            <div style={{
                                marginTop: '24px', background: 'white', borderRadius: '20px',
                                border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    padding: '20px 24px', borderBottom: '1px solid #F1F5F9',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                }}>
                                    <BookOpen size={20} color="#6366F1" />
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                        Enrolled Batches
                                    </h3>
                                </div>
                                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                    {availableOptions.map(opt => (
                                        <div
                                            key={`${opt.classId}-${opt.subjectName}`}
                                            onClick={() => {
                                                setSelectedClassName(opt.className);
                                                setSelectedSubjectName(opt.subjectName);
                                            }}
                                            style={{
                                                padding: '16px 20px', borderRadius: '14px',
                                                border: (opt.className === selectedClassName && opt.subjectName === selectedSubjectName) ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                                                background: (opt.className === selectedClassName && opt.subjectName === selectedSubjectName) ? 'linear-gradient(135deg, #EEF2FF, #F5F3FF)' : '#FAFBFC',
                                                cursor: 'pointer', transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                        {opt.subjectName}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                                                        {opt.className}
                                                    </p>
                                                </div>
                                                {(opt.className === selectedClassName && opt.subjectName === selectedSubjectName) && (
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 600, color: '#6366F1',
                                                        background: 'rgba(99,102,241,0.1)', padding: '4px 10px',
                                                        borderRadius: '6px', textTransform: 'uppercase',
                                                    }}>
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Day-wise List (for current month) ── */}
                        {records.length > 0 && (
                            <div style={{
                                marginTop: '24px', background: 'white', borderRadius: '20px',
                                border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    padding: '20px 24px', borderBottom: '1px solid #F1F5F9',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                }}>
                                    <TrendingUp size={20} color="#6366F1" />
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                        Detailed Records – {SHORT_MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                                    </h3>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {filteredRecords.map((record, i) => (
                                        <div key={record.id || i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '14px 24px',
                                            borderBottom: i < records.length - 1 ? '1px solid #F8FAFC' : 'none',
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '38px', height: '38px', borderRadius: '10px',
                                                    background: record.status === 'present' ? '#ECFDF5' : record.status === 'late' ? '#FFFBEB' : '#FEF2F2',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    {record.status === 'present' ? (
                                                        <UserCheck size={18} color="#059669" />
                                                    ) : record.status === 'late' ? (
                                                        <Clock size={18} color="#D97706" />
                                                    ) : (
                                                        <UserX size={18} color="#DC2626" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>
                                                        {new Date(record.attendance_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    {record.class_name && (
                                                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                                                            {record.class_name} {record.class_subject ? `• ${record.class_subject}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                                                padding: '4px 12px', borderRadius: '8px',
                                                color: record.status === 'present' ? '#059669' : record.status === 'late' ? '#D97706' : '#DC2626',
                                                background: record.status === 'present' ? '#ECFDF5' : record.status === 'late' ? '#FFFBEB' : '#FEF2F2',
                                                letterSpacing: '0.3px',
                                            }}>
                                                {record.status === 'late' ? 'Leave' : record.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {filteredRecords.length === 0 && !isLoading && (
                            <div style={{
                                marginTop: '24px', textAlign: 'center', padding: '60px 20px',
                                background: 'white', borderRadius: '20px',
                                border: '1px solid rgba(226,232,240,0.8)',
                            }}>
                                <Calendar size={48} color="#CBD5E1" />
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px', color: 'var(--text-primary)' }}>No Attendance Records</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
                                    No attendance data found for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                                    Try selecting a different month or subject.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

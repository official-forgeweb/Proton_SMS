'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import ResponsivePageContainer from '@/components/ui/ResponsivePageContainer';
import ResponsiveGrid from '@/components/ui/ResponsiveGrid';
import ResponsiveTable, { TableColumn } from '@/components/ui/ResponsiveTable';
import { Calendar, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, TrendingUp, Info, GraduationCap, FileText, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarItem {
    id: string;
    type: 'class' | 'test';
    subject: string;
    start_time: string;
    end_time?: string;
    teacher_name?: string;
    status: string;
    attendance_id?: string | null;
    test_name?: string;
    test_type?: string;
    score?: number;
    total_marks?: number;
}

interface Stats {
    overall: { total: number; present: number; percentage: number | string };
    subjects: Array<{ subject: string; total: number; present: number; percentage: number | string }>;
}

export default function StudentAttendancePage() {
    const { user } = useAuthStore();
    const [calendarData, setCalendarData] = useState<Record<string, CalendarItem[]>>({});
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const startOfMonth = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
            const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

            const [calRes, statsRes] = await Promise.all([
                api.get('/attendance/calendar', { params: { start_date: startOfMonth, end_date: endOfMonth } }),
                api.get('/attendance/stats')
            ]);

            setCalendarData(calRes.data.data);
            setStats(statsRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const calendarCells = useMemo(() => {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const cells = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            cells.push({ day: null, date: '' });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                day: d,
                date: dateStr,
                isToday: dateStr === todayStr,
                items: calendarData[dateStr] || []
            });
        }
        return cells;
    }, [calendarData, selectedMonth, selectedYear]);

    const changeMonth = (offset: number) => {
        let newMonth = selectedMonth + offset;
        let newYear = selectedYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    const getClassStyles = (status: string) => {
        switch (status) {
            case 'present': return { bg: '#ECFDF5', color: '#059669', border: '#10B981', icon: <UserCheck size={11} /> };
            case 'absent': return { bg: '#FEF2F2', color: '#DC2626', border: '#EF4444', icon: <UserX size={11} /> };
            case 'late': return { bg: '#FFFBEB', color: '#D97706', border: '#F59E0B', icon: <Clock size={11} /> };
            default: return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', icon: <Calendar size={11} /> };
        }
    };

    const getTestStyles = (status: string) => {
        switch (status) {
            case 'upcoming': return { bg: '#EFF6FF', color: '#2563EB', border: '#3B82F6', icon: <Calendar size={11} />, label: 'Upcoming' };
            case 'completed': return { bg: '#F5F3FF', color: '#7C3AED', border: '#8B5CF6', icon: <CheckCircle2 size={11} />, label: 'Completed' };
            case 'missed': return { bg: '#FEF2F2', color: '#DC2626', border: '#EF4444', icon: <UserX size={11} />, label: 'Missed' };
            case 'result_published': return { bg: '#F0FDF4', color: '#16A34A', border: '#22C55E', icon: <GraduationCap size={11} />, label: 'Result' };
            default: return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', icon: <FileText size={11} />, label: 'Test' };
        }
    };

    // Columns schema for responsive table
    const tableColumns: TableColumn[] = [
        { key: 'subject', header: 'Subject', style: { fontWeight: 700 } },
        { 
            key: 'sessions', 
            header: 'Classes Attended', 
            render: (row: any) => `${row.present} of ${row.total} sessions` 
        },
        { 
            key: 'status', 
            header: 'Attendance Status', 
            render: (row: any) => (
                <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    background: Number(row.percentage) >= 75 ? '#ECFDF5' : '#FEF2F2',
                    color: Number(row.percentage) >= 75 ? '#10B981' : '#E53935',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                }}>
                    {Number(row.percentage) >= 75 ? 'Excellent' : 'Critical'}
                </span>
            ) 
        },
        { 
            key: 'percentage', 
            header: 'Percentage', 
            style: { textAlign: 'right' },
            render: (row: any) => <strong style={{ fontSize: '15px' }}>{row.percentage}%</strong>
        }
    ];

    return (
        <DashboardLayout requiredRole="student">
            <ResponsivePageContainer style={{ paddingBottom: '120px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 24px)', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Academic Calendar</h1>
                        <p style={{ color: '#5E6278', fontSize: '13.5px', fontWeight: 500, margin: '4px 0 0 0' }}>Your personalized schedule of classes and examinations.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <button onClick={() => changeMonth(-1)} style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center' }} className="hover-bg-slate-100">
                            <ChevronLeft size={18} color="#5E6278" />
                        </button>
                        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 700, color: '#1A1D3B', minWidth: '150px', justifyContent: 'center', fontSize: '14px' }}>
                            {MONTH_NAMES[selectedMonth]} {selectedYear}
                        </div>
                        <button onClick={() => changeMonth(1)} style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center' }} className="hover-bg-slate-100">
                            <ChevronRight size={18} color="#5E6278" />
                        </button>
                    </div>
                </div>

                {/* Main Stats (Spacious Balanced Cards) */}
                <ResponsiveGrid desktopCols={3} tabletCols={2} mobileCols={1} gap="16px" style={{ marginBottom: '24px' }}>
                    {/* Overall Performance Card */}
                    <div className="card shadow-sm" style={{ 
                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                        color: 'white', 
                        padding: '18px 24px', 
                        position: 'relative', 
                        overflow: 'hidden', 
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: '100px',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <p style={{ opacity: 0.8, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Overall Attendance</p>
                                <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>{stats?.overall.present}/{stats?.overall.total} sessions</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', minWidth: '85px' }}>{stats?.overall.percentage}%</h2>
                                <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${stats?.overall.percentage}%`, background: '#E53935', borderRadius: '3px' }} />
                                </div>
                            </div>
                        </div>
                        <TrendingUp size={70} style={{ position: 'absolute', right: '-8px', bottom: '-8px', opacity: 0.06 }} />
                    </div>

                    {/* Compact Subject Cards */}
                    {stats?.subjects.slice(0, 2).map((s, idx) => (
                        <div key={idx} className="card shadow-sm" style={{ 
                            padding: '18px 24px', 
                            borderRadius: '18px', 
                            border: '1px solid rgba(226, 232, 240, 0.8)', 
                            background: 'rgba(255, 255, 255, 0.9)', 
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            minHeight: '100px',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ padding: '9px', background: 'rgba(229, 57, 53, 0.06)', borderRadius: '12px', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <GraduationCap size={20} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.subject}</h3>
                                <p style={{ color: '#5E6278', fontSize: '12.5px', fontWeight: 500, margin: 0 }}>{s.present} of {s.total} attended</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '20px', fontWeight: 800, color: Number(s.percentage) >= 75 ? '#10B981' : '#E53935' }}>{s.percentage}%</span>
                            </div>
                        </div>
                    ))}
                </ResponsiveGrid>

                {/* Legend & Layout Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#5E6278' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', borderLeft: '3px solid #10B981', background: '#ECFDF5' }} /> Class
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#5E6278' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', borderLeft: '3px solid #3B82F6', background: '#EFF6FF' }} /> Test/Exam
                        </div>
                    </div>
                </div>

                {/* Calendar Grid (Swipable on mobile) */}
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ minWidth: '800px', background: 'white' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            {DAY_NAMES.map(d => (
                                <div key={d} style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 800, fontSize: '11px', color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(130px, auto)' }}>
                            {calendarCells.map((cell, idx) => (
                                <div key={idx} style={{ 
                                    padding: '10px 12px', 
                                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                                    borderBottom: '1px solid #F1F5F9',
                                    background: cell.day === null ? '#FBFCFD' : 'white',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {cell.day && (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ 
                                                    fontSize: '13px', 
                                                    fontWeight: 800, 
                                                    color: cell.isToday ? '#FFFFFF' : '#1A1D3B',
                                                    width: '24px', height: '24px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: '6px',
                                                    background: cell.isToday ? '#E53935' : 'transparent',
                                                    boxShadow: cell.isToday ? '0 3px 8px rgba(229, 57, 53, 0.2)' : 'none'
                                                }}>{cell.day}</span>
                                                {cell.isToday && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E53935' }} />}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                                {cell.items.map((item, iIdx) => {
                                                    const isClass = item.type === 'class';
                                                    const styles: any = isClass ? getClassStyles(item.status) : getTestStyles(item.status);
                                                    
                                                    return (
                                                        <div key={iIdx} style={{ 
                                                            padding: '6px 10px', 
                                                            borderRadius: '8px', 
                                                            background: styles.bg,
                                                            borderLeft: `3px solid ${styles.border}`,
                                                            transition: 'all 0.2s ease',
                                                            cursor: 'pointer'
                                                        }} className="activity-card">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                                <span style={{ fontSize: '9px', fontWeight: 800, color: styles.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                                    {isClass ? 'Class' : styles.label}
                                                                </span>
                                                                <div style={{ color: styles.color }}>{styles.icon}</div>
                                                            </div>
                                                            <h4 style={{ fontSize: '11.5px', fontWeight: 800, color: '#1A1D3B', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                                                                    {isClass ? item.subject : item.test_name}
                                                            </h4>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', color: '#5E6278', fontWeight: 600 }}>
                                                                <Clock size={10} /> {item.start_time}
                                                                {!isClass && item.score !== undefined && (
                                                                    <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#10B981' }}>{item.score}/{item.total_marks}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {cell.items.length === 0 && !cell.isToday && cell.day !== null && (
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.05, minHeight: '40px' }}>
                                                        <Info size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Table (Responsive Table Layout) */}
                <div style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Subject-wise Attendance</h2>
                    </div>
                    <ResponsiveTable
                        columns={tableColumns}
                        data={stats?.subjects || []}
                        cardTitleKey="subject"
                    />
                </div>
            </ResponsivePageContainer>
            
            <style jsx>{`
                .activity-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.03);
                }
                .hover-bg-slate-100:hover {
                    background-color: #f1f5f9;
                }
            `}</style>
        </DashboardLayout>
    );
}

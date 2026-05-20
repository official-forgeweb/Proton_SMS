'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, UserCheck, UserX, Clock, ChevronLeft, ChevronRight, TrendingUp, Info, GraduationCap, FileText, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarItem {
    id: string;
    type: 'class' | 'test';
    subject: string;
    start_time: string;
    // Class specific
    end_time?: string;
    teacher_name?: string;
    status: string; // 'present'|'absent'|'late'|'unmarked' for class, 'upcoming'|'completed'|'result_published'|'missed' for test
    attendance_id?: string | null;
    // Test specific
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

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Academic Calendar</h1>
                        <p style={{ color: '#64748B', fontSize: '16px', fontWeight: 500 }}>Your personalized schedule of classes and examinations.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                        <button onClick={() => changeMonth(-1)} style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center' }} className="hover-bg-slate-100">
                            <ChevronLeft size={22} color="#64748B" />
                        </button>
                        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', fontWeight: 800, color: '#0F172A', minWidth: '180px', justifyContent: 'center', fontSize: '16px' }}>
                            {MONTH_NAMES[selectedMonth]} {selectedYear}
                        </div>
                        <button onClick={() => changeMonth(1)} style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center' }} className="hover-bg-slate-100">
                            <ChevronRight size={22} color="#64748B" />
                        </button>
                    </div>
                </div>

                {/* Main Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #0F172A, #334155)', color: 'white', padding: '32px', position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ opacity: 0.7, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Attendance Performance</p>
                            <h2 style={{ fontSize: '56px', fontWeight: 900, margin: '12px 0', letterSpacing: '-0.03em' }}>{stats?.overall.percentage}%</h2>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '20px', width: '100%', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${stats?.overall.percentage}%`, background: 'white' }} />
                            </div>
                            <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '16px' }}>{stats?.overall.present} of {stats?.overall.total} sessions recorded.</p>
                        </div>
                        <TrendingUp size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }} />
                    </div>

                    {stats?.subjects.slice(0, 2).map((s, idx) => (
                        <div key={idx} className="card" style={{ padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ padding: '10px', background: '#F1F5F9', borderRadius: '12px' }}>
                                    <GraduationCap size={24} color="#6366F1" />
                                </div>
                                <span style={{ fontSize: '24px', fontWeight: 900, color: Number(s.percentage) >= 75 ? '#10B981' : '#EF4444' }}>{s.percentage}%</span>
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{s.subject}</h3>
                            <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Subject-wise presence tracking</p>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', borderLeft: '3px solid #10B981', background: '#ECFDF5' }} /> Class
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', borderLeft: '3px solid #3B82F6', background: '#EFF6FF' }} /> Test/Exam
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        {DAY_NAMES.map(d => (
                            <div key={d} style={{ textAlign: 'center', padding: '20px', fontWeight: 800, fontSize: '14px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>{d}</div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(220px, auto)' }}>
                        {calendarCells.map((cell, idx) => (
                            <div key={idx} style={{ 
                                padding: '16px', 
                                borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                                borderBottom: '1px solid #F1F5F9',
                                background: cell.day === null ? '#FBFCFD' : 'white',
                                position: 'relative'
                            }}>
                                {cell.day && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <span style={{ 
                                                fontSize: '18px', 
                                                fontWeight: 900, 
                                                color: cell.isToday ? '#6366F1' : '#1E293B',
                                                width: '36px', height: '36px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '10px',
                                                background: cell.isToday ? '#EEF2FF' : 'transparent'
                                            }}>{cell.day}</span>
                                            {cell.isToday && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {cell.items.map((item, iIdx) => {
                                                const isClass = item.type === 'class';
                                                const styles: any = isClass ? getClassStyles(item.status) : getTestStyles(item.status);
                                                
                                                return (
                                                    <div key={iIdx} style={{ 
                                                        padding: '10px', 
                                                        borderRadius: '12px', 
                                                        background: styles.bg,
                                                        borderLeft: `4px solid ${styles.border}`,
                                                        transition: 'transform 0.1s ease',
                                                        cursor: 'pointer'
                                                    }} className="activity-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '11px', fontWeight: 900, color: styles.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {isClass ? 'Class' : styles.label}
                                                            </span>
                                                            <div style={{ color: styles.color }}>{styles.icon}</div>
                                                        </div>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {isClass ? item.subject : item.test_name}
                                                        </h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                                                            <Clock size={12} /> {item.start_time}
                                                            {!isClass && item.score !== undefined && (
                                                                <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#16A34A' }}>{item.score}/{item.total_marks}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {cell.items.length === 0 && !cell.isToday && cell.day !== null && (
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1, minHeight: '100px' }}>
                                                    <Info size={32} />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed Table */}
                <div style={{ marginTop: '56px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Academic Performance</h2>
                    </div>
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Subject</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Classes Attended</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attendance Status</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.subjects.map((s, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '20px 24px', fontWeight: 800, color: '#1E293B' }}>{s.subject}</td>
                                        <td style={{ padding: '20px 24px', color: '#64748B', fontWeight: 600 }}>{s.present} of {s.total} sessions</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ 
                                                padding: '6px 14px', 
                                                borderRadius: '10px', 
                                                fontSize: '12px', 
                                                fontWeight: 800,
                                                background: Number(s.percentage) >= 75 ? '#DCFCE7' : '#FEE2E2',
                                                color: Number(s.percentage) >= 75 ? '#16A34A' : '#DC2626',
                                                textTransform: 'uppercase'
                                            }}>
                                                {Number(s.percentage) >= 75 ? 'Excellent' : 'Critical'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 900, fontSize: '20px', color: '#1E293B' }}>{s.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .activity-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .hover-bg-slate-100:hover {
                    background-color: #f1f5f9;
                }
            `}</style>
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
    Users, CheckCircle, XCircle, Clock, ArrowLeft, Save, 
    AlertCircle, UserCheck, UserX, Search, Sparkles, HelpCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherSessionAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const [sessionData, setSessionData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Search & Keyboard Navigation states
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<number>(0);

    useEffect(() => {
        if (params.id) {
            fetchSessionData();
        }
    }, [params.id]);

    const fetchSessionData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/attendance/session/${params.id}`);
            setSessionData(res.data.data.session);
            // Default status to 'present' if 'unmarked'
            setStudents(res.data.data.students.map((s: any) => ({
                ...s,
                status: s.status === 'unmarked' ? 'present' : s.status
            })));
        } catch (err) {
            console.error(err);
            toast.error('Failed to load session data');
            router.push('/teacher/attendance');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, newStatus: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    };

    const markAll = (status: string) => {
        const confirmBulk = window.confirm(`Are you sure you want to mark all students as "${status.toUpperCase()}"?`);
        if (!confirmBulk) return;
        setStudents(prev => prev.map(s => ({ ...s, status })));
        toast.success(`All marked as ${status}`);
    };

    const submitAttendance = async () => {
        setIsSaving(true);
        try {
            const payload = {
                timetable_id: params.id,
                date: sessionData.date,
                records: students.map(s => ({
                    student_id: s.id,
                    status: s.status
                }))
            };

            await api.post('/attendance/mark', payload);
            toast.success('Attendance recorded and logged successfully!');
            setTimeout(() => router.push('/teacher/attendance'), 1000);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save attendance');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter students by Search term
    const filteredStudents = students.filter(s => {
        const term = searchQuery.toLowerCase();
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const proId = (s.PRO_ID || '').toLowerCase();
        return fullName.includes(term) || proId.includes(term);
    });

    // Reset focused index when search term changes
    useEffect(() => {
        setFocusedIndex(0);
    }, [searchQuery]);

    // Keyboard Shortcuts Event Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is currently typing in search input
            if (document.activeElement?.tagName === 'INPUT') {
                return;
            }

            if (filteredStudents.length === 0) return;
            const currentStudent = filteredStudents[focusedIndex];
            if (!currentStudent) return;

            const key = e.key.toLowerCase();

            if (key === 'p') {
                e.preventDefault();
                handleStatusChange(currentStudent.id, 'present');
                toast.success(`Marked ${currentStudent.first_name} Present`, { duration: 800, id: 'kb-toast' });
                if (focusedIndex < filteredStudents.length - 1) {
                    setFocusedIndex(prev => prev + 1);
                }
            } else if (key === 'a') {
                e.preventDefault();
                handleStatusChange(currentStudent.id, 'absent');
                toast.error(`Marked ${currentStudent.first_name} Absent`, { duration: 800, id: 'kb-toast' });
                if (focusedIndex < filteredStudents.length - 1) {
                    setFocusedIndex(prev => prev + 1);
                }
            } else if (key === 'l') {
                e.preventDefault();
                handleStatusChange(currentStudent.id, 'late');
                toast(`Marked ${currentStudent.first_name} Late ⏰`, { duration: 800, id: 'kb-toast' });
                if (focusedIndex < filteredStudents.length - 1) {
                    setFocusedIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (focusedIndex < filteredStudents.length - 1) {
                    setFocusedIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (focusedIndex > 0) {
                    setFocusedIndex(prev => prev - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [focusedIndex, filteredStudents]);

    // Stats calculations
    const totalCount = students.length;
    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const lateCount = students.filter(s => s.status === 'late').length;

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--primary)', width: '40px', height: '40px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading batch records...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="bg-mesh min-h-screen" style={{ padding: '0 8px 32px 8px' }}>
                
                {/* Sticky Top Header Panel */}
                <div style={{ 
                    position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-primary)',
                    padding: '16px 24px', margin: '0 -24px 32px -24px', display: 'flex', 
                    justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                }}>
                    <div>
                        <button 
                            onClick={() => router.back()}
                            style={{ 
                                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', 
                                alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', 
                                fontWeight: 700, fontSize: '13px', marginBottom: '8px', transition: 'color 0.2s' 
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            <ArrowLeft size={14} /> Back to Timetable
                        </button>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>
                            Roll Call: {sessionData?.subject?.canonical_name || sessionData?.subject || 'N/A'}
                        </h1>
                        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={14} color="var(--primary)" /> {sessionData?.class_ref?.class_name}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} color="var(--primary)" /> {sessionData?.start_time} - {sessionData?.end_time || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <button 
                        className="hover-lift"
                        onClick={submitAttendance}
                        disabled={isSaving}
                        style={{ 
                            padding: '12px 28px', borderRadius: '14px', background: 'var(--gradient-primary)',
                            color: '#FFFFFF', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(229, 57, 53, 0.35)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSaving ? 'Submitting...' : <><Save size={16} /> Save Attendance</>}
                    </button>
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    
                    {/* Live Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                        {[
                            { label: 'Total Students', value: totalCount, bg: 'var(--bg-primary)', text: 'var(--text-primary)' },
                            { label: 'Present', value: presentCount, bg: 'var(--success-light)', text: 'var(--success)' },
                            { label: 'Absent', value: absentCount, bg: 'var(--error-light)', text: 'var(--error)' },
                            { label: 'Late Arrival', value: lateCount, bg: 'var(--warning-light)', text: 'var(--warning)' }
                        ].map((stat, idx) => (
                            <div 
                                key={idx} 
                                className="glass-panel" 
                                style={{ 
                                    padding: '16px 20px', borderRadius: '16px', textAlign: 'center', 
                                    border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</p>
                                <p style={{ fontSize: '28px', fontWeight: 800, color: stat.text, fontFamily: 'Poppins, sans-serif' }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Keyboard Shortcut Pro-Tip Helper */}
                    <div style={{ 
                        background: 'var(--gradient-dark)', color: 'white', padding: '16px 24px', 
                        borderRadius: '20px', marginBottom: '28px', display: 'flex', 
                        alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-md)' 
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Sparkles size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, fontFamily: 'Poppins, sans-serif' }}>Lightning-Fast Keyboard Entry Enabled!</h4>
                            <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px', lineHeight: 1.5, fontWeight: 500 }}>
                                Click anywhere (not in search) and use <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>↓ ↑ Arrow Keys</span> to select a student. Press <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>P</span> (Present), <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>A</span> (Absent), or <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>L</span> (Late) to mark and automatically advance to the next line.
                            </p>
                        </div>
                    </div>

                    {/* Bulk Actions & Search Toolbar */}
                    <div className="glass-panel" style={{ 
                        padding: '20px 24px', borderRadius: '20px', marginBottom: '24px', 
                        display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center',
                        justifyContent: 'space-between', border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        {/* Instant Search */}
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '10px', 
                            background: 'var(--bg-secondary)', border: '1.5px solid var(--border-secondary)',
                            borderRadius: '12px', padding: '0 16px', flex: 1, minWidth: '260px'
                        }}>
                            <Search size={16} color="var(--text-tertiary)" />
                            <input 
                                placeholder="Filter students by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none', background: 'transparent', padding: '12px 0',
                                    outline: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', width: '100%'
                                }}
                            />
                        </div>

                        {/* Bulk Operations */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Bulk:</span>
                            <button 
                                onClick={() => markAll('present')} 
                                className="hover-lift"
                                style={{ 
                                    padding: '8px 16px', borderRadius: '10px', border: 'none', 
                                    background: 'var(--success-light)', color: 'var(--success)', 
                                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' 
                                }}
                            >
                                All Present
                            </button>
                            <button 
                                onClick={() => markAll('absent')} 
                                className="hover-lift"
                                style={{ 
                                    padding: '8px 16px', borderRadius: '10px', border: 'none', 
                                    background: 'var(--error-light)', color: 'var(--error)', 
                                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' 
                                }}
                            >
                                All Absent
                            </button>
                        </div>
                    </div>

                    {/* High-Performance Students Grid */}
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-md)', background: '#FFFFFF' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                                    <th style={{ padding: '20px 24px', width: '140px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID / Code</th>
                                    <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Name</th>
                                    <th style={{ padding: '20px 24px', width: '360px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roll Status Marking</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((s, index) => {
                                        const isFocused = index === focusedIndex;
                                        return (
                                            <tr 
                                                key={s.id} 
                                                style={{ 
                                                    transition: 'all 0.2s',
                                                    borderBottom: '1px solid var(--border-primary)',
                                                    background: isFocused ? 'rgba(229, 57, 53, 0.04)' : 'transparent',
                                                    boxShadow: isFocused ? 'inset 4px 0 0 var(--primary)' : 'none'
                                                }}
                                            >
                                                <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                    {s.PRO_ID}
                                                </td>
                                                <td style={{ padding: '18px 24px', fontWeight: 800, color: 'var(--text-primary)', fontSize: '15px' }}>
                                                    {s.first_name} {s.last_name}
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', gap: '4px', border: '1px solid var(--border-primary)' }}>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'present'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'present' ? 'var(--success)' : 'transparent',
                                                                color: s.status === 'present' ? 'white' : 'var(--text-secondary)',
                                                                fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <UserCheck size={14} /> Present
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'absent'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'absent' ? 'var(--error)' : 'transparent',
                                                                color: s.status === 'absent' ? 'white' : 'var(--text-secondary)',
                                                                fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <UserX size={14} /> Absent
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'late'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'late' ? 'var(--warning)' : 'transparent',
                                                                color: s.status === 'late' ? 'white' : 'var(--text-secondary)',
                                                                fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <Clock size={14} /> Late
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-tertiary)' }}>
                                            <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                                            <p style={{ fontWeight: 600, fontSize: '14px' }}>No students found matching your search.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

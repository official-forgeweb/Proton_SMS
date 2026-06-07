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
            <div className="bg-mesh min-h-screen" style={{ padding: '0 12px 32px 12px' }}>
                
                {/* Sticky Top Header Panel */}
                <div style={{ 
                    position: 'sticky', top: '-24px', zIndex: 10, 
                    background: 'rgba(255, 255, 255, 0.85)', 
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                    padding: '18px 32px', margin: '-24px -24px 32px -24px', display: 'flex', 
                    justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)'
                }}>
                    <div>
                        <button 
                            onClick={() => router.back()}
                            style={{ 
                                background: '#FFFFFF', border: '1px solid rgba(226, 232, 240, 0.8)', 
                                borderRadius: '10px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', 
                                alignItems: 'center', gap: '6px', color: '#5E6278', 
                                fontWeight: 700, fontSize: '12px', marginBottom: '12px', transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = '#E53935';
                                e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.2)';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = '#5E6278';
                                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <ArrowLeft size={13} strokeWidth={2.5} /> Back to Timetable
                        </button>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Roll Call
                            <span style={{ color: '#E53935' }}>•</span>
                            <span style={{ fontWeight: 600, color: '#5E6278', fontSize: '22px' }}>
                                {sessionData?.subject?.canonical_name || sessionData?.subject || 'N/A'}
                            </span>
                        </h1>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(26, 29, 59, 0.04)', color: '#1A1D3B', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', fontWeight: 700 }}>
                                <Users size={13} style={{ color: '#E53935' }} /> {sessionData?.class_ref?.class_name}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(26, 29, 59, 0.04)', color: '#1A1D3B', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', fontWeight: 700 }}>
                                <Clock size={13} style={{ color: '#E53935' }} /> {sessionData?.start_time} - {sessionData?.end_time || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={submitAttendance}
                        disabled={isSaving}
                        style={{ 
                            padding: '12px 28px', borderRadius: '14px', 
                            background: isSaving ? '#CBD5E1' : 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                            color: '#FFFFFF', fontWeight: 800, fontSize: '14px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            boxShadow: isSaving ? 'none' : '0 8px 24px -4px rgba(229, 57, 53, 0.4)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            if (!isSaving) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(229, 57, 53, 0.5)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isSaving) {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(229, 57, 53, 0.4)';
                            }
                        }}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff', borderLeftColor: '#fff', borderRightColor: '#fff', margin: 0 }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} strokeWidth={2.5} /> Save Attendance
                            </>
                        )}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                    
                    {/* Live Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        {[
                            { label: 'Total Enrolled', value: totalCount, bg: 'rgba(26, 29, 59, 0.03)', border: 'rgba(26, 29, 59, 0.08)', text: '#1A1D3B', icon: <Users size={20} color="#1A1D3B" /> },
                            { label: 'Marked Present', value: presentCount, bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', text: '#10B981', icon: <UserCheck size={20} color="#10B981" /> },
                            { label: 'Marked Absent', value: absentCount, bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', icon: <UserX size={20} color="#EF4444" /> },
                            { label: 'Late Arrival', value: lateCount, bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', icon: <Clock size={20} color="#F59E0B" /> }
                        ].map((stat, idx) => (
                            <div 
                                key={idx} 
                                className="glass-card" 
                                style={{ 
                                    padding: '20px 24px', borderRadius: '20px', 
                                    background: '#FFFFFF', border: `1px solid ${stat.border}`, 
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                                    e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.2)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.02)';
                                    e.currentTarget.style.borderColor = stat.border;
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {stat.label}
                                    </span>
                                    <span style={{ fontSize: '28px', fontWeight: 800, color: stat.text, fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
                                        {stat.value}
                                    </span>
                                </div>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stat.icon}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Keyboard Shortcut Pro-Tip Helper */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', 
                        color: 'white', padding: '16px 24px', 
                        borderRadius: '20px', display: 'flex', 
                        alignItems: 'center', gap: '16px', 
                        boxShadow: '0 8px 32px rgba(30, 27, 75, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Sparkles size={20} color="#E53935" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Lightning-Fast Keyboard Entry Enabled!
                                <span style={{ background: 'rgba(229, 57, 53, 0.2)', color: '#FF8A80', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '50px', letterSpacing: '0.05em' }}>PRO FEATURE</span>
                            </h4>
                            <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', lineHeight: 1.5, fontWeight: 500 }}>
                                Click anywhere outside inputs and use <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)' }}>↓ ↑ Arrow Keys</kbd> to select a student. Press <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)' }}>P</kbd> (Present), <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)' }}>A</kbd> (Absent), or <kbd style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)' }}>L</kbd> (Late) to log marks and advance automatically.
                            </p>
                        </div>
                    </div>

                    {/* Bulk Actions & Search Toolbar */}
                    <div className="glass-card" style={{ 
                        padding: '16px 24px', borderRadius: '20px', 
                        display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center',
                        justifyContent: 'space-between', border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: '#FFFFFF', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.01)'
                    }}>
                        {/* Instant Search */}
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            background: '#F8F9FD', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '0 16px', flex: 1, minWidth: '280px',
                            transition: 'all 0.2s'
                        }}
                        onFocusCapture={e => {
                            e.currentTarget.style.borderColor = '#E53935';
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(229, 57, 53, 0.05)';
                        }}
                        onBlurCapture={e => {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.background = '#F8F9FD';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        >
                            <Search size={18} color="#A1A5B7" />
                            <input 
                                placeholder="Filter class register by student name or roll ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none', background: 'transparent', padding: '12px 0',
                                    outline: 'none', fontSize: '14px', fontWeight: 600, color: '#1A1D3B', width: '100%'
                                }}
                            />
                        </div>

                        {/* Bulk Operations */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bulk Actions:</span>
                            <button 
                                onClick={() => markAll('present')} 
                                style={{ 
                                    padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', 
                                    background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', 
                                    fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' 
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#10B981';
                                    e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                                    e.currentTarget.style.color = '#10B981';
                                }}
                            >
                                All Present
                            </button>
                            <button 
                                onClick={() => markAll('absent')} 
                                style={{ 
                                    padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', 
                                    background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', 
                                    fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' 
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#EF4444';
                                    e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                    e.currentTarget.style.color = '#EF4444';
                                }}
                            >
                                All Absent
                            </button>
                        </div>
                    </div>

                    {/* High-Performance Students Grid */}
                    <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)', background: '#FFFFFF' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8F9FD', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', textAlign: 'left' }}>
                                    <th style={{ padding: '20px 24px', width: '150px', fontSize: '12px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roll Number</th>
                                    <th style={{ padding: '20px 24px', fontSize: '12px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Details</th>
                                    <th style={{ padding: '20px 24px', width: '360px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roll Status Marking</th>
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
                                                    transition: 'all 0.2s ease',
                                                    borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                                                    background: isFocused ? 'rgba(229, 57, 53, 0.03)' : 'transparent',
                                                    boxShadow: isFocused ? 'inset 6px 0 0 #E53935' : 'none'
                                                }}
                                            >
                                                <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontWeight: 700, color: '#E53935', fontSize: '14px' }}>
                                                    {s.PRO_ID}
                                                </td>
                                                <td style={{ padding: '18px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ 
                                                            width: '38px', height: '38px', borderRadius: '50%', 
                                                            background: isFocused ? 'rgba(229, 57, 53, 0.1)' : '#EEF2F6', 
                                                            color: isFocused ? '#E53935' : '#475569', 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            fontWeight: 800, fontSize: '13px', transition: 'all 0.2s'
                                                        }}>
                                                            {s.first_name?.[0] || 'S'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: '#1A1D3B', fontSize: '15px' }}>
                                                                {s.first_name} {s.last_name}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600, marginTop: '2px' }}>
                                                                Enrolled Student
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', background: '#F8F9FD', padding: '4px', borderRadius: '12px', gap: '4px', border: '1px solid #E2E8F0' }}>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'present'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'present' ? '#10B981' : 'transparent',
                                                                color: s.status === 'present' ? 'white' : '#5E6278',
                                                                fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s',
                                                                boxShadow: s.status === 'present' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if(s.status !== 'present') e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                if(s.status !== 'present') e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <UserCheck size={14} strokeWidth={2.5} /> Present
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'absent'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'absent' ? '#EF4444' : 'transparent',
                                                                color: s.status === 'absent' ? 'white' : '#5E6278',
                                                                fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s',
                                                                boxShadow: s.status === 'absent' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if(s.status !== 'absent') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                if(s.status !== 'absent') e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <UserX size={14} strokeWidth={2.5} /> Absent
                                                        </button>
                                                        <button 
                                                            onClick={() => { handleStatusChange(s.id, 'late'); setFocusedIndex(index); }}
                                                            style={{ 
                                                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                                background: s.status === 'late' ? '#F59E0B' : 'transparent',
                                                                color: s.status === 'late' ? 'white' : '#5E6278',
                                                                fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                transition: 'all 0.2s',
                                                                boxShadow: s.status === 'late' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if(s.status !== 'late') e.currentTarget.style.background = 'rgba(245, 158, 11, 0.06)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                if(s.status !== 'late') e.currentTarget.style.background = 'transparent';
                                                            }}
                                                        >
                                                            <Clock size={14} strokeWidth={2.5} /> Late
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '60px 24px', color: '#8F92A1' }}>
                                            <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#E53935' }} />
                                            <p style={{ fontWeight: 700, fontSize: '15px' }}>No students found matching your search.</p>
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

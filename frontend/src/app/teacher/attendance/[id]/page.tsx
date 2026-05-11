'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Users, CheckCircle, XCircle, Clock, ArrowLeft, Save, AlertCircle, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherSessionAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const [sessionData, setSessionData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
        setStudents(prev => prev.map(s => ({ ...s, status })));
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
            toast.success('Attendance recorded successfully!');
            setTimeout(() => router.push('/teacher/attendance'), 1500);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save attendance');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <DashboardLayout requiredRole="teacher"><div className="spinner" style={{ margin: '100px auto' }} /></DashboardLayout>;

    return (
        <DashboardLayout requiredRole="teacher">
            <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <button 
                            onClick={() => router.back()}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}
                        >
                            <ArrowLeft size={16} /> Back to Sessions
                        </button>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{sessionData?.subject}</h1>
                        <div style={{ display: 'flex', gap: '16px', color: '#64748B', fontSize: '14px', marginTop: '8px', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={16} color="#6366F1" /> {sessionData?.class_ref?.class_name}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} color="#6366F1" /> {sessionData?.start_time} - {sessionData?.end_time || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={submitAttendance}
                        disabled={isSaving}
                        style={{ padding: '12px 28px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Save Attendance</>}
                    </button>
                </div>

                {/* Bulk Actions */}
                <div style={{ background: '#F8FAFC', padding: '16px 24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>Quick Mark:</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => markAll('present')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#DCFCE7', color: '#16A34A', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Mark All Present</button>
                        <button onClick={() => markAll('absent')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Mark All Absent</button>
                    </div>
                </div>

                {/* Student List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
                    <table className="data-table">
                        <thead style={{ background: '#F8FAFC' }}>
                            <tr>
                                <th style={{ padding: '20px 24px', width: '120px' }}>PRO ID</th>
                                <th>Student Name</th>
                                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => (
                                <tr key={s.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontWeight: 600, color: '#64748B' }}>{s.PRO_ID}</td>
                                    <td style={{ fontWeight: 700, color: '#1E293B' }}>{s.first_name} {s.last_name}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'present')}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                    background: s.status === 'present' ? '#10B981' : 'transparent',
                                                    color: s.status === 'present' ? 'white' : '#64748B',
                                                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <UserCheck size={14} /> Present
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'absent')}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                    background: s.status === 'absent' ? '#EF4444' : 'transparent',
                                                    color: s.status === 'absent' ? 'white' : '#64748B',
                                                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <UserX size={14} /> Absent
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'late')}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                                    background: s.status === 'late' ? '#F59E0B' : 'transparent',
                                                    color: s.status === 'late' ? 'white' : '#64748B',
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

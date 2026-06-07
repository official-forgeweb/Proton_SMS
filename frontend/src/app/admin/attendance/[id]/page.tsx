'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Users, Clock, ArrowLeft, Save, UserCheck, UserX, BookOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSessionAttendancePage() {
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
            // Admin can see current status, if unmarked default to 'present'
            setStudents(res.data.data.students.map((s: any) => ({
                ...s,
                status: s.status === 'unmarked' ? 'present' : s.status
            })));
        } catch (err) {
            console.error(err);
            toast.error('Failed to load session data');
            router.push('/admin/attendance');
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
            toast.success('Attendance records updated successfully!');
            setTimeout(() => router.push('/admin/attendance'), 1500);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save attendance');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <DashboardLayout requiredRole="admin"><div className="spinner" style={{ margin: '100px auto' }} /></DashboardLayout>;

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '24px', width: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <button 
                            onClick={() => router.push('/admin/attendance')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}
                        >
                            <ArrowLeft size={16} /> Back to Management
                        </button>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B' }}>Edit Attendance</h1>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#64748B', fontSize: '15px', marginTop: '12px', fontWeight: 600 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px' }}>
                                <BookOpen size={18} color="#6366F1" /> {sessionData?.subject?.canonical_name || sessionData?.subject || 'N/A'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px' }}>
                                <Users size={18} color="#6366F1" /> {sessionData?.class_ref?.class_name}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px' }}>
                                <Clock size={18} color="#6366F1" /> {sessionData?.start_time} - {sessionData?.end_time || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary"
                        onClick={submitAttendance}
                        disabled={isSaving}
                        style={{ padding: '14px 32px', borderRadius: '16px', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)', fontSize: '16px', fontWeight: 700 }}
                    >
                        {isSaving ? 'Processing...' : <><Save size={20} /> Save Changes</>}
                    </button>
                </div>

                {/* Info Alert */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '16px 24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <AlertCircle color="#3B82F6" size={24} />
                    <p style={{ color: '#1E40AF', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                        As an administrator, you are manually overriding the attendance records for this session. All changes will be audited.
                    </p>
                </div>

                {/* Bulk Actions */}
                <div style={{ background: 'white', padding: '20px 24px', borderRadius: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Batch Operations:</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => markAll('present')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#10B981', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Mark All Present</button>
                        <button onClick={() => markAll('absent')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Mark All Absent</button>
                    </div>
                </div>

                {/* Student List */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <table className="data-table">
                        <thead style={{ background: '#F8FAFC' }}>
                            <tr>
                                <th style={{ padding: '20px 24px', width: '150px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B' }}>PRO ID</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B' }}>Student Details</th>
                                <th style={{ textAlign: 'right', paddingRight: '24px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B' }}>Attendance Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => (
                                <tr key={s.id} style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px', fontFamily: 'monospace', fontWeight: 700, color: '#6366F1' }}>{s.PRO_ID}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F1F5F9', color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                                                {s.first_name?.[0] || 'S'}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 800, color: '#1E293B', margin: 0, fontSize: '16px' }}>{s.first_name} {s.last_name}</p>
                                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Active Enrollment</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '6px', borderRadius: '16px', gap: '6px' }}>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'present')}
                                                style={{ 
                                                    padding: '10px 24px', borderRadius: '12px', border: 'none', 
                                                    background: s.status === 'present' ? '#10B981' : 'transparent',
                                                    color: s.status === 'present' ? 'white' : '#64748B',
                                                    fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    transition: 'all 0.2s', boxShadow: s.status === 'present' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                                }}
                                            >
                                                <UserCheck size={16} /> Present
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'absent')}
                                                style={{ 
                                                    padding: '10px 24px', borderRadius: '12px', border: 'none', 
                                                    background: s.status === 'absent' ? '#EF4444' : 'transparent',
                                                    color: s.status === 'absent' ? 'white' : '#64748B',
                                                    fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    transition: 'all 0.2s', boxShadow: s.status === 'absent' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                                                }}
                                            >
                                                <UserX size={16} /> Absent
                                            </button>
                                            <button 
                                                onClick={() => handleStatusChange(s.id, 'late')}
                                                style={{ 
                                                    padding: '10px 24px', borderRadius: '12px', border: 'none', 
                                                    background: s.status === 'late' ? '#F59E0B' : 'transparent',
                                                    color: s.status === 'late' ? 'white' : '#64748B',
                                                    fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    transition: 'all 0.2s', boxShadow: s.status === 'late' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                                                }}
                                            >
                                                <Clock size={16} /> Late
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

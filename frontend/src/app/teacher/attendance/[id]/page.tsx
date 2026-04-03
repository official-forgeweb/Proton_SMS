'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Users, CheckCircle, XCircle, Clock, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function TeacherClassAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const [classData, setClassData] = useState<any>(null);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchAttendance();
            // Fetch class details for header info
            api.get(`/classes/${params.id}`).then(res => setClassData(res.data.data)).catch(console.error);
        }
    }, [params.id, attendanceDate]);

    const fetchAttendance = () => {
        setIsLoading(true);
        api.get(`/classes/${params.id}/attendance?date=${attendanceDate}`)
            .then(res => {
                // Initialize default 'present' status if no existing record found for the day
                const initializedData = res.data.data.students.map((s: any) => ({
                    ...s,
                    current_status: s.attendance_status || 'present'
                }));
                setAttendanceData(initializedData);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendanceData(prev => prev.map(s => s.id === studentId ? { ...s, current_status: status } : s));
    };

    const markAllAs = (status: string) => {
        setAttendanceData(prev => prev.map(s => ({ ...s, current_status: status })));
    };

    const submitAttendance = async () => {
        setIsSaving(true);
        setNotification(null);
        try {
            const payload = {
                date: attendanceDate,
                records: attendanceData.map(s => ({
                    student_id: s.id,
                    status: s.current_status
                }))
            };

            await api.post(`/classes/${params.id}/attendance`, payload);
            setNotification({ type: 'success', message: 'Attendance recorded successfully!' });

            // Clear notification after 3s
            setTimeout(() => setNotification(null), 3000);
        } catch (error: any) {
            console.error(error);
            setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to save attendance' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header">
                <div>
                    <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '12px', padding: '6px 12px' }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Record Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {classData ? `${classData.class_name} • ${classData.batch_type?.toUpperCase() || 'REGULAR'} BATCH` : 'Loading class details...'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                        <DatePicker
                            showMonthDropdown
                            showYearDropdown
                            scrollableYearDropdown
                            dropdownMode="select"
                            selected={attendanceDate ? new Date(attendanceDate) : null}
                            onChange={(date: Date | null) => setAttendanceDate(date ? date.toISOString().split('T')[0] : '')}
                            maxDate={new Date()}
                            dateFormat="MMMM d, yyyy"
                            className="input-field"
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={submitAttendance}
                        disabled={isSaving || attendanceData.length === 0}
                    >
                        {isSaving ? 'Saving...' : <><Save size={16} /> Save Register</>}
                    </button>
                </div>
            </div>

            {notification && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: notification.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
                    color: notification.type === 'success' ? 'var(--success-dark)' : 'var(--error-dark)',
                    border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                    animation: 'fadeInDown 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {notification.message}
                    </div>
                </div>
            )}

            <div className="page-body">
                {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  attendanceData.length === 0 ? (
                    <div className="card empty-state">
                        <Users size={48} />
                        <h3>No Students Found</h3>
                        <p>There are no active students enrolled in this class to mark attendance for.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--bg-tertiary)'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Student Roster ({attendanceData.length})</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginRight: '8px', alignSelf: 'center' }}>Mark All:</span>
                                <button className="btn btn-sm" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }} onClick={() => markAllAs('present')}>Present</button>
                                <button className="btn btn-sm" style={{ background: 'var(--error-light)', color: 'var(--error-dark)' }} onClick={() => markAllAs('absent')}>Absent</button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>PRO ID</th>
                                        <th>Student</th>
                                        <th style={{ textAlign: 'center', width: '300px' }}>Attendance Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {student.PRO_ID}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                                        {student.first_name?.[0] || 'S'}
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{student.first_name} {student.last_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    justifyContent: 'center',
                                                    background: 'var(--bg-secondary)',
                                                    padding: '4px',
                                                    borderRadius: 'var(--radius-md)'
                                                }}>
                                                    <label style={{
                                                        flex: 1,
                                                        textAlign: 'center',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        background: student.current_status === 'present' ? 'var(--success)' : 'transparent',
                                                        color: student.current_status === 'present' ? 'white' : 'var(--text-secondary)',
                                                        fontWeight: student.current_status === 'present' ? 600 : 400,
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            checked={student.current_status === 'present'}
                                                            onChange={() => handleStatusChange(student.id, 'present')}
                                                            style={{ display: 'none' }}
                                                        />
                                                        Present
                                                    </label>
                                                    <label style={{
                                                        flex: 1,
                                                        textAlign: 'center',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        background: student.current_status === 'absent' ? 'var(--error)' : 'transparent',
                                                        color: student.current_status === 'absent' ? 'white' : 'var(--text-secondary)',
                                                        fontWeight: student.current_status === 'absent' ? 600 : 400,
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            checked={student.current_status === 'absent'}
                                                            onChange={() => handleStatusChange(student.id, 'absent')}
                                                            style={{ display: 'none' }}
                                                        />
                                                        Absent
                                                    </label>
                                                    <label style={{
                                                        flex: 1,
                                                        textAlign: 'center',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        background: student.current_status === 'late' ? 'var(--warning)' : 'transparent',
                                                        color: student.current_status === 'late' ? '#92400e' : 'var(--text-secondary)', // dark amber
                                                        fontWeight: student.current_status === 'late' ? 600 : 400,
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <input
                                                            type="radio"
                                                            name={`status-${student.id}`}
                                                            checked={student.current_status === 'late'}
                                                            onChange={() => handleStatusChange(student.id, 'late')}
                                                            style={{ display: 'none' }}
                                                        />
                                                        Late
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

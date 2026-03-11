'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { BookOpen, Users, Clock, Calendar, MapPin } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function ClassProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [cls, setCls] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/classes/${params.id}`).then(res => setCls(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    if (isLoading) return <DashboardLayout requiredRole="admin"><div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div></DashboardLayout>;

    if (!cls) return <DashboardLayout requiredRole="admin"><div className="empty-state"><h3>Class not found</h3><button className="btn btn-primary" onClick={() => router.push('/admin/classes')}>Back</button></div></DashboardLayout>;

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>{cls.class_code}</span>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{cls.class_name}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {cls.subject} • {cls.grade_level} • Batch: {cls.batch_type}
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => router.push('/admin/classes')}>Back</button>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} color="var(--primary)" /> Class Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Primary Teacher</p>
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.teacher ? cls.teacher.name : 'Unassigned'}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}><Users size={12} /> Students</p>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.current_students_count} / {cls.max_students}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}><MapPin size={12} /> Room</p>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cls.room_number || 'TBD'}</p>
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                <p style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><Calendar size={14} /> <strong>Days:</strong> {cls.class_days?.join(', ') || 'Not Configured'}</p>
                                <p style={{ display: 'flex', gap: '8px' }}><Clock size={14} /> <strong>Time:</strong> {cls.class_time_start} - {cls.class_time_end}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-primary)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} color="var(--info)" /> Enrolled Students
                            </h3>
                        </div>
                        {cls.students?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>PRO_ID</th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cls.students.map((student: any) => (
                                        <tr key={student._id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.PRO_ID}</td>
                                            <td style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</td>
                                            <td>{student.phone}</td>
                                            <td><button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/students/${student._id}`)}>View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <p>No students enrolled in this class yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

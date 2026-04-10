import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { BookOpen, Users, Clock, Calendar, MapPin } from 'lucide-react';
import { requireRole } from '@/lib/sharedAuth';
import { getClassDetailData } from '@/services/dataAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ClassProfilePage({ params }: { params: { id: string } }) {
    const session = await requireRole('admin');
    if (!session) redirect('/login');

    const data = await getClassDetailData(params.id);

    if (!data || !data.class) {
         return (
             <DashboardLayout requiredRole="admin">
                 <div className="empty-state">
                     <h3>Class not found</h3>
                     <Link href="/admin/classes" className="btn btn-primary">Back</Link>
                 </div>
             </DashboardLayout>
         );
    }

    const { class: cls, students, subject_counts } = data;

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
                <Link href="/admin/classes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Back</Link>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} color="var(--primary)" /> Batch Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
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
                            
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', marginTop: '8px' }}>Schedule</h4>
                            
                            {cls.schedule && cls.schedule.length > 0 ? cls.schedule.map((session: any, i: number) => (
                                <div key={i} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{session.subject}</p>
                                    <p style={{ fontSize: '13px', display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                        <Users size={14} /> <strong>Teacher:</strong> {session.teacher?.first_name ? `${session.teacher.first_name} ${session.teacher.last_name}` : 'Unassigned'}
                                    </p>
                                    <p style={{ fontSize: '13px', display: 'flex', gap: '8px' }}>
                                        <Clock size={14} /> <strong>Time:</strong> {session.time_start} - {session.time_end}
                                    </p>
                                </div>
                            )) : (
                                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                    <p style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><Calendar size={14} /> <strong>Days:</strong> {cls.class_days?.join(', ') || 'Not Configured'}</p>
                                    <p style={{ display: 'flex', gap: '8px' }}><Clock size={14} /> <strong>Time:</strong> {cls.class_time_start} - {cls.class_time_end}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-primary)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={18} color="var(--info)" /> Enrolled Students
                            </h3>
                        </div>
                        {students && students.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>PRO_ID</th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Enrolled Subjects</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student: any) => (
                                        <tr key={student.id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{student.PRO_ID}</td>
                                            <td style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</td>
                                            <td>{student.phone}</td>
                                            <td>
                                                {student.enrolled_subjects?.map((sub: string) => (
                                                    <span key={sub} className="badge badge-info" style={{ marginRight: '4px' }}>{sub}</span>
                                                ))}
                                                {(!student.enrolled_subjects || student.enrolled_subjects.length === 0) && '-'}
                                            </td>
                                            <td>
                                                <Link href={`/admin/students/${student.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                                    View
                                                </Link>
                                            </td>
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

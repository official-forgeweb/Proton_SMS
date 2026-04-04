'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Users, BookOpen, Clock, Calendar, ArrowLeft, Mail, Phone, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function TeacherClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [classData, setClassData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/classes/${params.id}`)
                .then(res => setClassData(res.data.data))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [params.id]);

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header">
                <div>
                    <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '12px', padding: '6px 12px' }}>
                        <ArrowLeft size={14} /> Back to Classes
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                            {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : classData?.class_name}
                        </h1>
                        {!isLoading && classData && (
                            <span className="badge badge-primary">{classData.batch_type?.toUpperCase() || 'REGULAR'} BATCH</span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : `${classData?.subject} • Grade ${classData?.grade_level}`}
                    </p>
                </div>
                {!isLoading && classData && (
                    <Link href={`/teacher/attendance/${classData.id}`}>
                        <button className="btn btn-primary">
                            Mark Attendance <ChevronRight size={16} />
                        </button>
                    </Link>
                )}
            </div>

            <div className="page-body">
                {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  !classData ? (
                    <div className="card empty-state">
                        <BookOpen size={48} />
                        <h3>Class Not Found</h3>
                        <p>The class you are looking for does not exist or you don't have access.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} color="var(--primary)" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>TOTAL STUDENTS</p>
                                    <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{classData.students?.length || 0}</h3>
                                </div>
                            </div>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={24} color="var(--success)" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>TIMING</p>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                                        {classData.schedule?.length > 0
                                            ? classData.schedule.map((s: any) => `${s.time_start}-${s.time_end}`).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')
                                            : `${classData.class_time_start} - ${classData.class_time_end}`}
                                    </h3>
                                </div>
                            </div>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={24} color="var(--warning)" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>DAYS</p>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'capitalize' }}>
                                        {classData.schedule?.length > 0
                                            ? Array.from(new Set(classData.schedule.flatMap((s: any) => s.days || []))).join(', ') || 'Not set'
                                            : classData.class_days?.join(', ') || 'Not set'}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
                                Enrolled Students
                            </h3>

                            {classData.students?.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <Users size={40} color="var(--text-tertiary)" />
                                    <h4 style={{ marginTop: '16px', fontWeight: 600 }}>No Students Yet</h4>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>There are currently no active students enrolled in this batch.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>PRO ID</th>
                                                <th>Student Name</th>
                                                <th>Contact</th>
                                                <th>Join Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classData.students.map((student: any) => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                            {student.PRO_ID}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div className="avatar">
                                                                {student.first_name?.[0] || 'S'}
                                                            </div>
                                                            <div style={{ fontWeight: 500 }}>
                                                                {student.first_name} {student.last_name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                <Phone size={12} /> {student.phone}
                                                            </span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
                                                                <Mail size={12} /> {student.email}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                        {new Date(student.enrollment?.enrollment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-success">Active</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

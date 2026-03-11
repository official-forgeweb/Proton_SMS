'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { User, Phone, Mail, Award, BookOpen } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [teacher, setTeacher] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/teachers/${params.id}`).then(res => setTeacher(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    if (isLoading) return <DashboardLayout requiredRole="admin"><div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div></DashboardLayout>;

    if (!teacher) return <DashboardLayout requiredRole="admin"><div className="empty-state"><h3>Teacher not found</h3><button className="btn btn-primary" onClick={() => router.push('/admin/teachers')}>Back</button></div></DashboardLayout>;

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <span className={`badge ${teacher.employment_status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{teacher.employment_status.toUpperCase()}</span>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{teacher.first_name} {teacher.last_name}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', fontFamily: 'monospace' }}>
                        ID: {teacher.employee_id}
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => router.push('/admin/teachers')}>Back</button>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="var(--primary)" /> Profile Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <p style={{ display: 'flex', gap: '8px' }}><Phone size={16} /> <strong>Phone:</strong> {teacher.phone}</p>
                            <p style={{ display: 'flex', gap: '8px' }}><Mail size={16} /> <strong>Email:</strong> {teacher.email}</p>
                            <p style={{ display: 'flex', gap: '8px' }}><Award size={16} /> <strong>Qualification:</strong> {teacher.qualification}</p>
                            <p style={{ display: 'flex', gap: '8px' }}><BookOpen size={16} /> <strong>Specialization:</strong> {teacher.specialization}</p>
                            <p><strong>Experience:</strong> {teacher.experience_years} Years</p>
                            <p><strong>Role:</strong> {teacher.role_type.replace('_', ' ')}</p>
                            <p><strong>Joined:</strong> {new Date(teacher.date_of_joining).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} color="var(--info)" /> Assigned Classes
                        </h3>
                        {teacher.classes?.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {teacher.classes.map((cls: any) => (
                                    <li key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{cls.class_name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{cls.subject} ({cls.grade_level})</p>
                                        </div>
                                        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>{cls.class_code}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No classes currently assigned to this teacher.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

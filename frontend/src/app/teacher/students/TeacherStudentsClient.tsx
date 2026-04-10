'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { Users, Search, GraduationCap } from 'lucide-react';
import api from '@/lib/api';

interface Props {
    initialData: {
        students: any[];
    };
}

export default function TeacherStudentsClient({ initialData }: Props) {
    const [students, setStudents] = useState<any[]>(initialData.students);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (search === '' && students === initialData.students) return;
        fetchStudents();
    }, [search]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/students', { params: { search, limit: 20 } });
            setStudents(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <PermissionGuard permissionKey="students">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Students</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        View academic profiles of students.
                    </p>
                </div>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="input-field"
                            placeholder="Search by student name, phone, or PRO ID..."
                            style={{ paddingLeft: '38px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {isLoading && students.length === 0 ? (
                        <div className="spinner" style={{ margin: '40px auto' }} />
                    ) : students.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>No Students Found</h3>
                            <p>{search ? 'No matches found for your search.' : 'There are no active students to display.'}</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>PRO ID</th>
                                        <th>Student</th>
                                        <th>Class(es)</th>
                                        <th>Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '13px' }}>
                                                {student.PRO_ID}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px', background: 'var(--bg-secondary)' }}>
                                                        {student.first_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 600, display: 'block' }}>{student.first_name} {student.last_name}</span>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{student.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {student.classes?.length > 0 ? student.classes.map((c: any) => (
                                                        <span key={c.id} className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                                            {c.name || 'Unknown Class'}
                                                        </span>
                                                    )) : <span style={{ color: 'var(--text-tertiary)' }}>N/A</span>}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                                                {student.phone}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
        </PermissionGuard>
    );
}

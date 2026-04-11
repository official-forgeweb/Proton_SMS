'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { PenTool, Plus, Clock, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherHomeworkPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [homework, setHomework] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHomework();
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const fetchHomework = () => {
        api.get('/homework').then(res => setHomework(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };



    return (
        <PermissionGuard permissionKey="homework">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Homework Assignments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Assign and track student homework progress.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/teacher/homework/assign')}><Plus size={16} /> Assign Homework</button>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  homework.length === 0 ? (
                        <div className="empty-state">
                            <PenTool size={48} />
                            <h3>No Homework Found</h3>
                            <p>Assign new homework to students.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title / Subject</th>
                                        <th>Class</th>
                                        <th>Assigned Date</th>
                                        <th>Due Date</th>
                                        <th>Submissions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {homework.map((hw, idx) => (
                                        <tr key={hw.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{hw.title}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{hw.subject}</div>
                                            </td>
                                            <td><span style={{ fontSize: '13px' }}>{hw.class_name}</span></td>
                                            <td>
                                                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={12} color="var(--text-tertiary)" /> {hw.assigned_date}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${new Date(hw.due_date) < new Date() ? 'badge-error' : 'badge-warning'}`}>
                                                    {hw.due_date}
                                                </span>
                                            </td>
                                             <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="progress-bar" style={{ width: '80px' }}>
                                                            <div className="progress-fill" style={{ width: `${(hw.submitted / (hw.total_students || 1)) * 100}%`, background: 'var(--success)' }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{hw.submitted}/{hw.total_students}</span>
                                                    </div>
                                                    <Link href={`/teacher/homework/${hw.id}`}>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px 8px' }}>
                                                            <FileText size={14} /> View
                                                        </button>
                                                    </Link>
                                                </div>
                                             </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ToolBottomBar />
        </DashboardLayout>
        </PermissionGuard>
    );
}


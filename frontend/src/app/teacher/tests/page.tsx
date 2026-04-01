'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList, Plus, Search, CheckCircle, FileText, BarChart, X } from 'lucide-react';

export default function TeacherTestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, scheduled: 0 });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            // Fetch tests across all classes this teacher teaches
            const res = await api.get('/tests');
            const sortedTests = res.data.data.sort((a: any, b: any) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());

            setTests(sortedTests);
            setStats({
                total: sortedTests.length,
                completed: sortedTests.filter((t: any) => t.status === 'completed').length,
                scheduled: sortedTests.filter((t: any) => t.status === 'scheduled').length,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PermissionGuard permissionKey="tests">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Assessments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        {stats.total} total assessments • {stats.scheduled} upcoming
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/teacher/tests/create')}>
                    <Plus size={16} /> New Assessment
                </button>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : tests.length === 0 ? (
                    <div className="empty-state card">
                        <ClipboardList size={48} />
                        <h3>No Assessments Found</h3>
                        <p>You haven't created any tests or quizzes yet. Click "New Assessment" to get started.</p>
                        <button className="btn btn-primary mt-4" onClick={() => router.push('/teacher/tests/create')}>
                            Create First Assessment
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                        {tests.map((test, idx) => (
                            <div key={test.id} className="card hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                            {test.test_code}
                                        </span>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{test.test_name}</h3>
                                    </div>
                                    <span className={`badge ${test.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                        {test.status}
                                    </span>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={14} color="var(--text-tertiary)" /> {test.test_type?.replace('_', ' ').toUpperCase() || 'EXAM'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BarChart size={14} color="var(--text-tertiary)" /> Total Marks: {test.total_marks} | Passing: {test.passing_marks}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={14} color="var(--text-tertiary)" /> Evaluated: {test.results_count || 0} students
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        {new Date(test.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => window.location.href = `/teacher/tests/${test.id}`}
                                    >
                                        Evaluate Scores
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </DashboardLayout>
        </PermissionGuard>
    );
}

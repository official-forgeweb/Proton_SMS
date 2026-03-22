'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { ClipboardList, Plus, Search, CheckCircle, FileText, BarChart, X } from 'lucide-react';

export default function TeacherTestsPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
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
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
                        <button className="btn btn-primary mt-4" onClick={() => setShowAddModal(true)}>
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

            {showAddModal && (
                <AddTestModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); fetchTests(); }}
                />
            )}
        </DashboardLayout>
        </PermissionGuard>
    );
}

function AddTestModal({ onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        test_name: '', test_date: '', class_id: '', test_type: 'monthly_test',
        total_marks: 100, passing_marks: 33, syllabus: ''
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async () => {
        if (!formData.test_name || !formData.class_id || !formData.test_date) return;
        setIsSubmitting(true);
        try {
            await api.post('/tests', formData);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal model-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Schedule New Assessment</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Assessment Name *</label>
                        <input className="input-field" value={formData.test_name} onChange={e => setFormData(p => ({ ...p, test_name: e.target.value }))} placeholder="e.g., Mathematics Mid-Term" />
                    </div>

                    <div className="input-group">
                        <label>Target Class *</label>
                        <select className="input-field" value={formData.class_id} onChange={e => setFormData(p => ({ ...p, class_id: e.target.value }))}>
                            <option value="">Select a class...</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.class_name} • {c.batch_type?.toUpperCase()} BATCH</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Assessment Date *</label>
                        <input type="date" className="input-field" value={formData.test_date} onChange={e => setFormData(p => ({ ...p, test_date: e.target.value }))} />
                    </div>

                    <div className="input-group">
                        <label>Test Type *</label>
                        <select className="input-field" value={formData.test_type} onChange={e => setFormData(p => ({ ...p, test_type: e.target.value }))}>
                            <option value="weekly_test">Weekly Test</option>
                            <option value="monthly_test">Monthly Test</option>
                            <option value="term_exam">Term Exam</option>
                            <option value="mock_test">Mock Test</option>
                            <option value="surprise_test">Surprise Test</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Total Marks *</label>
                            <input type="number" className="input-field" value={formData.total_marks} onChange={e => setFormData(p => ({ ...p, total_marks: Number(e.target.value) }))} />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Passing Marks *</label>
                            <input type="number" className="input-field" value={formData.passing_marks} onChange={e => setFormData(p => ({ ...p, passing_marks: Number(e.target.value) }))} />
                        </div>
                    </div>

                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Syllabus / Topics Covered</label>
                        <input className="input-field" value={formData.syllabus} onChange={e => setFormData(p => ({ ...p, syllabus: e.target.value }))} placeholder="e.g., Algebra, Probability" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting || !formData.test_name || !formData.class_id || !formData.test_date}>
                        {isSubmitting ? 'Scheduling...' : 'Schedule Assessment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

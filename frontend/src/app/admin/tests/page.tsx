'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { ClipboardList, Search, Plus, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';

export default function TestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        test_name: '', class_id: '', subject: '', test_type: 'weekly_test', test_date: new Date().toISOString().split('T')[0], duration_minutes: 60, total_marks: 100, passing_marks: 33
    });

    useEffect(() => {
        fetchTests();
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const fetchTests = () => {
        api.get('/tests').then(res => setTests(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tests', formData);
            setIsAddOpen(false);
            fetchTests();
            setFormData({ test_name: '', class_id: '', subject: '', test_type: 'weekly_test', test_date: new Date().toISOString().split('T')[0], duration_minutes: 60, total_marks: 100, passing_marks: 33 });
        } catch (error) {
            console.error('Error adding test:', error);
            alert('Failed to add test');
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Tests & Examinations</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage assessments, marks, and student performance.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}><Plus size={16} /> Create Test</button>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)
                    ) : tests.length === 0 ? (
                        <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                            <ClipboardList size={48} />
                            <h3>No Tests Found</h3>
                            <p>Create a test assessment to track student performance.</p>
                        </div>
                    ) : (
                        tests.map((test, idx) => (
                            <div key={test.id} className="card hover-lift animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--primary-100)', padding: '2px 8px', borderRadius: '4px' }}>
                                            {test.test_type.toUpperCase()}
                                        </span>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>{test.test_name}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {test.subject} • {test.class_name}
                                        </p>
                                    </div>
                                    <span className={`badge ${test.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                        {test.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> Date
                                        </p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{test.test_date}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FileText size={12} /> Total Marks
                                        </p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{test.total_marks}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={12} /> Avg Marks
                                        </p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px', color: 'var(--success)' }}>
                                            {test.average_marks}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push(`/admin/tests/${test.id}`)}>
                                        View Results
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Test">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Test Name</label>
                            <input required className="input-field" value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Test Type</label>
                            <select className="input-field" value={formData.test_type} onChange={e => setFormData({ ...formData, test_type: e.target.value })}>
                                <option value="weekly_test">Weekly Test</option>
                                <option value="mock_test">Mock Test</option>
                                <option value="final_exam">Final Exam</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Class</label>
                            <select required className="input-field" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select Class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Subject</label>
                            <input required className="input-field" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Test Date</label>
                            <input type="date" required className="input-field" value={formData.test_date} onChange={e => setFormData({ ...formData, test_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Duration (Minutes)</label>
                            <input type="number" required className="input-field" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Total Marks</label>
                            <input type="number" required className="input-field" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="label">Passing Marks</label>
                            <input type="number" required className="input-field" value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Test</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

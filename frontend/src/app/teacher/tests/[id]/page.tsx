'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Save, Users, AlertCircle } from 'lucide-react';

export default function EvaluateTestPage() {
    const params = useParams();
    const router = useRouter();
    const [testData, setTestData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [results, setResults] = useState<Record<string, { marks: string, present: boolean }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchTestData();
        }
    }, [params.id]);

    const fetchTestData = async () => {
        setIsLoading(true);
        try {
            // First get test details
            const res = await api.get(`/tests/${params.id}`);
            const test = res.data.data;
            setTestData(test);

            // Fetch students enrolled in the target class
            const classIdToFetch = test.class_id?._id || test.class_id;
            const classRes = await api.get(`/classes/${classIdToFetch}`);
            const classStudents = classRes.data.data.students || [];

            setStudents(classStudents);

            // Initialize results map based on existing results OR default to empty
            const initialResults: Record<string, { marks: string, present: boolean }> = {};
            const existingResults = test.results || [];

            classStudents.forEach((student: any) => {
                const existing = existingResults.find((r: any) => r.student_id === student.id);
                initialResults[student.id] = {
                    marks: existing ? existing.marks_obtained.toString() : '',
                    present: existing ? existing.was_present : true
                };
            });

            setResults(initialResults);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarksChange = (studentId: string, value: string) => {
        // Validation to ensure marks don't exceed total_marks
        let numValue = Number(value);
        if (numValue > testData?.total_marks) numValue = testData.total_marks;
        if (numValue < 0) numValue = 0;

        setResults(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], marks: value === '' ? '' : numValue.toString() }
        }));
    };

    const togglePresence = (studentId: string) => {
        setResults(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                present: !prev[studentId].present,
                marks: !prev[studentId].present ? '' : '0' // Clear marks if absent
            }
        }));
    };

    const submitEvaluation = async () => {
        setIsSaving(true);
        setNotification(null);
        try {
            const payload = {
                results: students.map(s => ({
                    student_id: s.id,
                    marks_obtained: results[s.id]?.present ? Number(results[s.id]?.marks || 0) : 0,
                    was_present: results[s.id]?.present
                }))
            };

            await api.post(`/tests/${params.id}/results`, payload);
            setNotification({ type: 'success', message: 'Evaluation saved! Test is now marked completed.' });

            setTimeout(() => {
                setNotification(null);
                setTestData({ ...testData, status: 'completed' });
            }, 3000);
        } catch (error: any) {
            console.error(error);
            setNotification({ type: 'error', message: error.response?.data?.message || 'Failed to save evaluation.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header">
                <div>
                    <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '12px', padding: '6px 12px' }}>
                        <ArrowLeft size={14} /> Back to Tests
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                            {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : testData?.test_name}
                        </h1>
                        {!isLoading && testData && (
                            <span className={`badge ${testData.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                {testData.status}
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        {testData?.class_name} • Max Marks: {testData?.total_marks} • Passing: {testData?.passing_marks}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={submitEvaluation}
                        disabled={isSaving || students.length === 0}
                    >
                        {isSaving ? 'Publishing...' : <><Save size={16} /> Publish Scores</>}
                    </button>
                </div>
            </div>

            {notification && (
                <div style={{
                    padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                    ) :  students.length === 0 ? (
                    <div className="card empty-state">
                        <Users size={48} />
                        <h3>No Enrolled Students</h3>
                        <p>There are no students in this class to evaluate.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border-primary)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--bg-tertiary)'
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Evaluation Roster ({students.length})</h3>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Enter marks out of <strong>{testData.total_marks}</strong>
                            </span>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>PRO ID</th>
                                        <th>Student</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Present</th>
                                        <th style={{ width: '180px' }}>Marks Obtained</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => {
                                        const res = results[student.id];
                                        const marksNum = Number(res?.marks || 0);
                                        const isPassing = marksNum >= testData.passing_marks;

                                        return (
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
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={res?.present || false}
                                                        onChange={() => togglePresence(student.id)}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{
                                                                padding: '6px 12px',
                                                                opacity: res?.present ? 1 : 0.5,
                                                                background: res?.present ? 'var(--bg-primary)' : 'var(--bg-tertiary)'
                                                            }}
                                                            placeholder="0"
                                                            value={res?.marks ?? ''}
                                                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                            disabled={!res?.present}
                                                            min="0"
                                                            max={testData.total_marks}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    {!res?.present ? (
                                                        <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Absent</span>
                                                    ) : res?.marks === '' ? (
                                                        <span className="badge" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}>Pending</span>
                                                    ) : isPassing ? (
                                                        <span className="badge badge-success">Pass</span>
                                                    ) : (
                                                        <span className="badge badge-error">Fail</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

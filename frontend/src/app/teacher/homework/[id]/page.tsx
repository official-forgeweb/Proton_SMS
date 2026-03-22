'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Save, Users, AlertCircle, FileText, Download, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EvaluateHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const [hwData, setHwData] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<Record<string, { marks: string, feedback: string }>>({});

    useEffect(() => {
        if (params.id) {
            fetchHwData();
        }
    }, [params.id]);

    const fetchHwData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/homework/${params.id}`);
            const hw = res.data.data;
            setHwData(hw);
            setSubmissions(hw.submissions || []);

            const initialEval: Record<string, { marks: string, feedback: string }> = {};
            hw.submissions?.forEach((s: any) => {
                initialEval[s.student_id] = {
                    marks: s.marks_obtained?.toString() || '',
                    feedback: s.feedback || ''
                };
            });
            setEvaluation(initialEval);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load homework data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEvalChange = (studentId: string, field: 'marks' | 'feedback', value: string) => {
        if (field === 'marks') {
            let numValue = Number(value);
            if (numValue > (hwData?.total_marks || 100)) numValue = hwData.total_marks;
            if (numValue < 0) numValue = 0;
            value = value === '' ? '' : numValue.toString();
        }

        setEvaluation(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const submitGrade = async (studentId: string) => {
        setIsSaving(studentId);
        try {
            await api.post(`/homework/${params.id}/evaluate`, {
                student_id: studentId,
                marks_obtained: Number(evaluation[studentId]?.marks || 0),
                feedback: evaluation[studentId]?.feedback
            });
            toast.success('Grade saved successfully');
            
            // Update local state status
            setSubmissions(prev => prev.map(s => 
                s.student_id === studentId ? { ...s, status: 'evaluated' } : s
            ));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save grade');
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header">
                <div>
                    <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '12px', padding: '6px 12px' }}>
                        <ArrowLeft size={14} /> Back to Homework
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                            {isLoading ? 'Loading...' : hwData?.title}
                        </h1>
                        {!isLoading && (
                            <span className="badge badge-info">{hwData?.subject}</span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Max Marks: {hwData?.total_marks} • Due: {hwData?.due_date}
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div className="spinner" style={{ margin: '40px auto' }} />
                ) : submissions.length === 0 ? (
                    <div className="card empty-state">
                        <Users size={48} />
                        <h3>No Student Enrollments Found</h3>
                        <p>No students are assigned to the class for this homework.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Submission</th>
                                    <th>Grading</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                                    {sub.student_name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 600, display: 'block' }}>{sub.student_name}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sub.pro_id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                sub.status === 'evaluated' ? 'badge-success' : 
                                                sub.status === 'submitted' ? 'badge-info' : 
                                                sub.status === 'late' ? 'badge-error' : 'badge-neutral'
                                            }`}>
                                                {sub.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {sub.submission_date ? (
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    <p>{new Date(sub.submission_date).toLocaleDateString()}</p>
                                                    {sub.attachments?.length > 0 && (
                                                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)', padding: 0, marginTop: '4px' }}>
                                                            <Download size={12} /> View File
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No submission yet</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '80px' }}>
                                                    <input 
                                                        type="number" 
                                                        className="input-field" 
                                                        style={{ padding: '6px 10px', fontSize: '13px' }}
                                                        placeholder="Marks"
                                                        value={evaluation[sub.student_id]?.marks}
                                                        onChange={(e) => handleEvalChange(sub.student_id, 'marks', e.target.value)}
                                                        disabled={sub.status === 'pending'}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <input 
                                                        type="text" 
                                                        className="input-field" 
                                                        style={{ padding: '6px 10px', fontSize: '13px' }}
                                                        placeholder="Feedback..."
                                                        value={evaluation[sub.student_id]?.feedback}
                                                        onChange={(e) => handleEvalChange(sub.student_id, 'feedback', e.target.value)}
                                                        disabled={sub.status === 'pending'}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => submitGrade(sub.student_id)}
                                                disabled={isSaving === sub.student_id || sub.status === 'pending'}
                                            >
                                                {isSaving === sub.student_id ? '...' : <Save size={14} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>
        </DashboardLayout>
    );
}

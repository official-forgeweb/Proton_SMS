'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList } from 'lucide-react';

export default function CreateTestPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        test_name: '', class_id: '', subject: '', test_type: 'weekly_test',
        test_date: new Date().toISOString().split('T')[0],
        duration_minutes: 60, total_marks: 100, passing_marks: 33
    });

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tests', formData);
            router.push('/admin/tests');
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Failed to create test');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Create New Assessment"
            subtitle="Design and schedule a new test or examination"
            backHref="/admin/tests"
            backLabel="Back to Examinations"
            requiredRole="admin"
            icon={<ClipboardList size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">Basic Configuration</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Test Title / Name *</label>
                            <input required className="form-input" placeholder="e.g. Mathematics Midterm" value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Assessment Category *</label>
                            <select className="form-input" value={formData.test_type} onChange={e => setFormData({ ...formData, test_type: e.target.value })}>
                                <option value="weekly_test">Weekly Assessment</option>
                                <option value="monthly_test">Monthly Test</option>
                                <option value="mock_test">Mock Examination</option>
                                <option value="term_exam">Term Exam</option>
                                <option value="final_exam">Final Semester Exam</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Target & Subject</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Target Batch / Class *</label>
                            <select required className="form-input" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select Target Audience...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Academic Subject *</label>
                            <input required className="form-input" placeholder="e.g. Physics" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Schedule & Scoring</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Examination Date *</label>
                            <DatePicker showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" required selected={formData.test_date ? new Date(formData.test_date) : null} onChange={(date: Date | null) => setFormData({ ...formData, test_date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" placeholderText="Set schedule" />
                        </div>
                        <div>
                            <label className="form-label">Time Duration (Min) *</label>
                            <input type="number" required className="form-input" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="form-label">Maximum Score (Total Marks) *</label>
                            <input type="number" required className="form-input" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="form-label">Qualifying Score (Pass Marks) *</label>
                            <input type="number" required className="form-input" value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/tests')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Initialize Test'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

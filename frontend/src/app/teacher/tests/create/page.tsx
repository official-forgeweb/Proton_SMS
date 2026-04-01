'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList } from 'lucide-react';

export default function CreateTeacherTestPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        test_name: '', test_date: '', class_id: '', test_type: 'monthly_test',
        total_marks: 100, passing_marks: 33, syllabus: ''
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.test_name || !formData.class_id || !formData.test_date) return;
        setIsSubmitting(true);
        try {
            await api.post('/tests', formData);
            router.push('/teacher/tests');
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Failed to schedule assessment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Schedule New Assessment"
            subtitle="Create a new test or quiz for your classes."
            backHref="/teacher/tests"
            backLabel="Back to Assessments"
            requiredRole="teacher"
            icon={<ClipboardList size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">Test Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <label className="form-label">Assessment Name *</label>
                            <input 
                                required
                                className="form-input" 
                                value={formData.test_name} 
                                onChange={e => setFormData(p => ({ ...p, test_name: e.target.value }))} 
                                placeholder="e.g., Mathematics Mid-Term" 
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">Target Class *</label>
                                <select 
                                    required
                                    className="form-input" 
                                    value={formData.class_id} 
                                    onChange={e => setFormData(p => ({ ...p, class_id: e.target.value }))}
                                >
                                    <option value="">Select a class...</option>
                                    {classes.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.class_name} • {c.batch_type?.toUpperCase()} BATCH</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Assessment Date *</label>
                                <DatePicker 
                                    showMonthDropdown 
                                    showYearDropdown 
                                    scrollableYearDropdown 
                                    dropdownMode="select" 
                                    required 
                                    selected={formData.test_date ? new Date(formData.test_date) : null} 
                                    onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, test_date: date ? date.toISOString().split('T')[0] : '' }))} 
                                    dateFormat="MMMM d, yyyy" 
                                    placeholderText="Select date" 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">Test Type *</label>
                                <select 
                                    required
                                    className="form-input" 
                                    value={formData.test_type} 
                                    onChange={e => setFormData(p => ({ ...p, test_type: e.target.value }))}
                                >
                                    <option value="weekly_test">Weekly Test</option>
                                    <option value="monthly_test">Monthly Test</option>
                                    <option value="term_exam">Term Exam</option>
                                    <option value="mock_test">Mock Test</option>
                                    <option value="surprise_test">Surprise Test</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="form-label">Total Marks *</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="form-input" 
                                        value={formData.total_marks} 
                                        onChange={e => setFormData(p => ({ ...p, total_marks: Number(e.target.value) }))} 
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Passing Marks *</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="form-input" 
                                        value={formData.passing_marks} 
                                        onChange={e => setFormData(p => ({ ...p, passing_marks: Number(e.target.value) }))} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Syllabus / Topics Covered</label>
                            <textarea 
                                className="form-input" 
                                rows={4}
                                value={formData.syllabus} 
                                onChange={e => setFormData(p => ({ ...p, syllabus: e.target.value }))} 
                                placeholder="List chapters or topics covered in this assessment..." 
                                style={{ resize: 'vertical', minHeight: '120px' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/teacher/tests')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Scheduling...' : 'Schedule Assessment'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PenTool } from 'lucide-react';

export default function AssignTeacherHomeworkPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '', 
        description: '', 
        class_id: '', 
        subject: '', 
        assigned_date: new Date().toISOString().split('T')[0], 
        due_date: '', 
        total_marks: 10
    });

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/homework', formData);
            router.push('/teacher/homework');
        } catch (error) {
            console.error('Error adding homework:', error);
            alert('Failed to add homework');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Assign New Homework"
            subtitle="Create and distribute a new assignment to your students."
            backHref="/teacher/homework"
            backLabel="Back to Homework"
            requiredRole="teacher"
            icon={<PenTool size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">Assignment Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Title *</label>
                                <input 
                                    required 
                                    className="form-input" 
                                    value={formData.title} 
                                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                    placeholder="e.g., Chapter 5 Practice Problems"
                                />
                            </div>
                            <div>
                                <label className="form-label">Subject *</label>
                                <input 
                                    required 
                                    className="form-input" 
                                    value={formData.subject} 
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                                    placeholder="e.g., Physics"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Class *</label>
                            <select 
                                required 
                                className="form-input" 
                                value={formData.class_id} 
                                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                            >
                                <option value="">Select Class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} • {c.batch_type?.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Description / Instructions *</label>
                            <textarea 
                                required 
                                className="form-input" 
                                rows={5} 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                placeholder="Detail the homework requirements, pages to read, or specific problems to solve..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Assigned Date *</label>
                                <DatePicker 
                                    showMonthDropdown 
                                    showYearDropdown 
                                    scrollableYearDropdown 
                                    dropdownMode="select" 
                                    required 
                                    selected={formData.assigned_date ? new Date(formData.assigned_date) : null} 
                                    onChange={(date: Date | null) => setFormData({ ...formData, assigned_date: date ? date.toISOString().split('T')[0] : '' })} 
                                    dateFormat="MMMM d, yyyy" 
                                />
                            </div>
                            <div>
                                <label className="form-label">Due Date *</label>
                                <DatePicker 
                                    showMonthDropdown 
                                    showYearDropdown 
                                    scrollableYearDropdown 
                                    dropdownMode="select" 
                                    required 
                                    selected={formData.due_date ? new Date(formData.due_date) : null} 
                                    onChange={(date: Date | null) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })} 
                                    dateFormat="MMMM d, yyyy" 
                                    placeholderText="Select due date"
                                />
                            </div>
                            <div>
                                <label className="form-label">Total Marks *</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="form-input" 
                                    value={formData.total_marks} 
                                    onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/teacher/homework')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Assigning...' : 'Assign Homework'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

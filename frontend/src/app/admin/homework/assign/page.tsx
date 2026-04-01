'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PenTool } from 'lucide-react';

export default function AssignHomeworkPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', class_id: '', subject: '',
        assigned_date: new Date().toISOString().split('T')[0], due_date: '', total_marks: 10
    });

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/homework', formData);
            router.push('/admin/homework');
        } catch (error) {
            console.error('Error assigning homework:', error);
            alert('Failed to assign homework');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Assign New Homework"
            subtitle="Create and distribute a homework assignment to students"
            backHref="/admin/homework"
            backLabel="Back to Homework"
            requiredRole="admin"
            icon={<PenTool size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">
                        <PenTool size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Assignment Metadata
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Homework Title *</label>
                            <input required className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Chapter 5 Exercises" />
                        </div>
                        <div>
                            <label className="form-label">Associated Subject *</label>
                            <input required className="form-input" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Mathematics" />
                        </div>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                        <label className="form-label">Target Batch / Class *</label>
                        <select required className="form-input" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                            <option value="">Choose a class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                        <label className="form-label">Detailed Instructions *</label>
                        <textarea required className="form-input" rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the homework assignment requirements..." style={{ resize: 'vertical' }} />
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Timeline & Assessment</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Release Date</label>
                            <DatePicker showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" required selected={formData.assigned_date ? new Date(formData.assigned_date) : null} onChange={(date: Date | null) => setFormData({ ...formData, assigned_date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" placeholderText="Publication Date" />
                        </div>
                        <div>
                            <label className="form-label">Submission Deadline *</label>
                            <DatePicker showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" required selected={formData.due_date ? new Date(formData.due_date) : null} onChange={(date: Date | null) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" placeholderText="Target Date" />
                        </div>
                        <div>
                            <label className="form-label">Max Marks</label>
                            <input type="number" required className="form-input" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/homework')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Assigning...' : 'Assign Homework'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

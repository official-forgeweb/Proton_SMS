'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Target, Calendar, Clock, User, Book } from 'lucide-react';

export default function TeacherEnquiryDemoPage() {
    const params = useParams();
    const router = useRouter();
    const [enquiry, setEnquiry] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({ 
        demo_date: '', 
        demo_time: '', 
        subject: '', 
        topic: '', 
        class_id: '', 
        teacher_id: '' 
    });

    useEffect(() => {
        if (params.id) {
            api.get(`/enquiries/${params.id}`).then(res => {
                setEnquiry(res.data.data);
                // Pre-fill subject if available in enquiry (optional)
                if (res.data.data.interested_course) {
                    setFormData(p => ({ ...p, subject: res.data.data.interested_course }));
                }
            }).catch(console.error).finally(() => setIsLoading(false));
            
            api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
            api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${params.id}/schedule-demo`, formData);
            router.push(`/teacher/enquiries/${params.id}`);
        } catch (error) {
            console.error('Error scheduling demo:', error);
            alert('Failed to schedule demo');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Schedule Demo Class"
            subtitle={`Arrange a trial session for ${enquiry?.student_name || 'Student'}`}
            backHref={`/teacher/enquiries/${params.id}`}
            backLabel="Back to Enquiry"
            requiredRole="teacher"
            icon={<Target size={20} strokeWidth={2.5} />}
            maxWidth="800px"
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">Session Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Demo Date *</label>
                            <DatePicker 
                                showMonthDropdown 
                                showYearDropdown 
                                scrollableYearDropdown 
                                dropdownMode="select" 
                                required 
                                selected={formData.demo_date ? new Date(formData.demo_date) : null} 
                                onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_date: date ? date.toISOString().split('T')[0] : '' }))} 
                                dateFormat="MMMM d, yyyy" 
                                placeholderText="Select date" 
                            />
                        </div>
                        <div>
                            <label className="form-label">Demo Time *</label>
                            <DatePicker 
                                required 
                                selected={formData.demo_time ? new Date(`1970-01-01T${formData.demo_time}:00`) : null} 
                                onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_time: date ? date.toTimeString().slice(0, 5) : '' }))} 
                                showTimeSelect 
                                showTimeSelectOnly 
                                timeIntervals={15} 
                                timeCaption="Time" 
                                dateFormat="h:mm aa" 
                                placeholderText="Select time" 
                            />
                        </div>
                        <div>
                            <label className="form-label">Subject</label>
                            <div style={{ position: 'relative' }}>
                                <Book size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#A1A5B7' }} />
                                <input 
                                    className="form-input" 
                                    style={{ paddingLeft: '38px' }}
                                    value={formData.subject} 
                                    onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} 
                                    placeholder="e.g., Mathematics" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Topic</label>
                            <input 
                                className="form-input" 
                                value={formData.topic} 
                                onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))} 
                                placeholder="e.g., Quadratic Equations" 
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Assignment</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Batch / Class</label>
                            <select 
                                className="form-input" 
                                value={formData.class_id} 
                                onChange={(e) => setFormData(p => ({ ...p, class_id: e.target.value }))}
                            >
                                <option value="">Select class...</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.class_name} • {c.batch_type?.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Assigned Teacher</label>
                            <select 
                                className="form-input" 
                                value={formData.teacher_id} 
                                onChange={(e) => setFormData(p => ({ ...p, teacher_id: e.target.value }))}
                            >
                                <option value="">Select teacher...</option>
                                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.EMP_ID})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push(`/teacher/enquiries/${params.id}`)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting || isLoading}>
                        {isSubmitting ? 'Scheduling...' : 'Schedule Demo Session'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

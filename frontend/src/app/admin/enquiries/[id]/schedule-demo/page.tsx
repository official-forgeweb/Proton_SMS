'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Target, Calendar, Clock, BookOpen, User, Layers } from 'lucide-react';

export default function ScheduleDemoPage() {
    const params = useParams();
    const router = useRouter();
    const [enquiry, setEnquiry] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ 
        demo_date: '', demo_time: '', subject: '', topic: '', class_id: '', teacher_id: '' 
    });

    useEffect(() => {
        if (params.id) {
            Promise.all([
                api.get(`/enquiries/${params.id}`),
                api.get('/classes'),
                api.get('/teachers')
            ]).then(([enqRes, clsRes, teaRes]) => {
                setEnquiry(enqRes.data.data);
                setClasses(clsRes.data.data || []);
                setTeachers(teaRes.data.data || []);
                setFormData(p => ({
                    ...p,
                    subject: enqRes.data.data.interested_course || ''
                }));
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${params.id}/schedule-demo`, formData);
            router.push(`/admin/enquiries/${params.id}`);
        } catch (error) {
            console.error('Error scheduling demo:', error);
            alert('Failed to schedule demo class');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Schedule Demo Class"
            subtitle={`Set up a trial session for ${enquiry?.student_name || 'Enquiry'}`}
            backHref={`/admin/enquiries/${params.id}`}
            backLabel="Back to Enquiry"
            requiredRole="admin"
            icon={<Target size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading enquiry data...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">Schedule Information</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Date *</label>
                                <DatePicker 
                                    showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" 
                                    required 
                                    selected={formData.demo_date ? new Date(formData.demo_date) : null} 
                                    onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_date: date ? date.toISOString().split('T')[0] : '' }))} 
                                    dateFormat="MMMM d, yyyy" 
                                    placeholderText="Select date" 
                                />
                            </div>
                            <div>
                                <label className="form-label">Time *</label>
                                <DatePicker 
                                    required 
                                    selected={formData.demo_time ? new Date(`1970-01-01T${formData.demo_time}:00`) : null} 
                                    onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_time: date ? date.toTimeString().slice(0, 5) : '' }))} 
                                    showTimeSelect showTimeSelectOnly 
                                    timeIntervals={15} timeCaption="Time" 
                                    dateFormat="h:mm aa" 
                                    placeholderText="Select time" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">Academic Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Subject</label>
                                <input 
                                    className="form-input" 
                                    value={formData.subject} 
                                    onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} 
                                    placeholder="e.g., Mathematics" 
                                />
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
                                <label className="form-label">Target Class / Batch</label>
                                <select className="form-input" value={formData.class_id} onChange={(e) => setFormData(p => ({ ...p, class_id: e.target.value }))}>
                                    <option value="">Select class...</option>
                                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Teacher / Instructor</label>
                                <select className="form-input" value={formData.teacher_id} onChange={(e) => setFormData(p => ({ ...p, teacher_id: e.target.value }))}>
                                    <option value="">Select teacher...</option>
                                    {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/enquiries/${params.id}`)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

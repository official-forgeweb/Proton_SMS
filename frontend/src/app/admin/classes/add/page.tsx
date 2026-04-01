'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Layers, Plus, Clock } from 'lucide-react';

export default function AddClassPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({
        class_name: '', grade_level: '', max_students: 30,
        status: 'upcoming', schedule: [], start_date: ''
    });

    useEffect(() => {
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, []);

    const addSession = () => {
        setFormData({
            ...formData,
            schedule: [...formData.schedule, {
                subject: '', teacher_id: '', time_start: '09:00', time_end: '10:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }]
        });
    };

    const removeSession = (index: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule.splice(index, 1);
        setFormData({ ...formData, schedule: newSchedule });
    };

    const updateSession = (index: number, field: string, value: any) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setFormData({ ...formData, schedule: newSchedule });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/classes', formData);
            router.push('/admin/classes');
        } catch (error) {
            console.error('Error creating batch:', error);
            alert('Failed to create batch');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Create New Batch"
            subtitle="Set up a new class with schedule and teacher assignments"
            backHref="/admin/classes"
            backLabel="Back to Classes"
            requiredRole="admin"
            icon={<Layers size={20} strokeWidth={2.5} />}
            maxWidth="900px"
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">Batch Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Batch Name *</label>
                            <input required className="form-input" value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="e.g. Proton 1" />
                        </div>
                        <div>
                            <label className="form-label">Grade / Level *</label>
                            <input required className="form-input" value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g. Class 11" />
                        </div>
                        <div>
                            <label className="form-label">Max Students</label>
                            <input type="number" required className="form-input" value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div className="form-section-title" style={{ marginBottom: 0 }}>
                            <Clock size={16} strokeWidth={2.5} /> Class Schedule (Sessions)
                        </div>
                        <button type="button" onClick={addSession} className="btn-cancel" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={16} strokeWidth={2.5} /> Add Session
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {formData.schedule && formData.schedule.map((session: any, i: number) => (
                            <div key={i} style={{ padding: '24px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                <button type="button" onClick={() => removeSession(i)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FEE2E2', color: '#EF4444', width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontSize: '16px', fontWeight: 700 }}>×</button>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Subject</label>
                                        <input required className="form-input" value={session.subject} onChange={e => updateSession(i, 'subject', e.target.value)} placeholder="e.g. Mathematics" />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Teacher</label>
                                        <select required className="form-input" value={session.teacher_id?._id || session.teacher_id} onChange={e => updateSession(i, 'teacher_id', e.target.value)}>
                                            <option value="">Select Teacher...</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>Start Time</label>
                                        <DatePicker
                                            selected={session.time_start ? new Date(`2000-01-01T${session.time_start}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { updateSession(i, 'time_start', date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" placeholderText="Start Time"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>End Time</label>
                                        <DatePicker
                                            selected={session.time_end ? new Date(`2000-01-01T${session.time_end}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { updateSession(i, 'time_end', date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" placeholderText="End Time"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!formData.schedule || formData.schedule.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '32px', background: '#F8F9FD', borderRadius: '16px', border: '2px dashed #E2E8F0', color: '#A1A5B7', fontSize: '14px', fontWeight: 600 }}>
                                No sessions configured yet.<br /><span style={{ fontSize: '13px', fontWeight: 500 }}>Click "Add Session" to assign subjects and teachers.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Batch Settings</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Batch Status</label>
                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        {formData.status === 'upcoming' && (
                            <div>
                                <label className="form-label">Starts From</label>
                                <DatePicker
                                    showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                    selected={formData.start_date ? new Date(formData.start_date) : null}
                                    onChange={(date: Date | null) => { if (date) setFormData({ ...formData, start_date: date.toISOString().split('T')[0] }); }}
                                    dateFormat="MMMM d, yyyy" placeholderText="Pick Start Date"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/classes')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Batch'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

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
                    <div className="form-section-title">
                        <Layers size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Batch Basic Configuration
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Internal Batch Name *</label>
                            <input required className="form-input" value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="e.g. Proton Alpha 1" />
                        </div>
                        <div>
                            <label className="form-label">Grade / Target Level *</label>
                            <input required className="form-input" value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g. Class 12 / JEE" />
                        </div>
                        <div>
                            <label className="form-label">Capacity (Students)</label>
                            <input type="number" required className="form-input" value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div className="form-section-title" style={{ marginBottom: 0 }}>
                            <Clock size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                            Class Schedule & Curriculum
                        </div>
                        <button 
                            type="button" 
                            onClick={addSession} 
                            style={{
                                padding: '8px 16px', borderRadius: '10px', background: '#1A1D3B', border: 'none',
                                color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(26,29,59,0.2)'
                            }}
                        >
                            <Plus size={16} strokeWidth={3} /> Add Session
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {formData.schedule && formData.schedule.map((session: any, i: number) => (
                            <div key={i} style={{ 
                                padding: '28px', 
                                background: 'white', 
                                borderRadius: '24px', 
                                border: '1px solid #F1F2F7', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '20px', 
                                position: 'relative' 
                            }}>
                                <button 
                                    type="button" 
                                    onClick={() => removeSession(i)} 
                                    style={{ 
                                        position: 'absolute', top: '24px', right: '24px', 
                                        background: '#FEE2E2', color: '#EF4444', 
                                        width: '32px', height: '32px', borderRadius: '10px', 
                                        border: 'none', cursor: 'pointer', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        transition: 'all 0.2s', fontSize: '18px', fontWeight: 800 
                                    }}
                                >×</button>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr', gap: '20px' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Subject</label>
                                        <input required className="form-input" value={session.subject} onChange={e => updateSession(i, 'subject', e.target.value)} placeholder="e.g. Physics" />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Assigned Faculty</label>
                                        <select required className="form-input" value={session.teacher_id?._id || session.teacher_id} onChange={e => updateSession(i, 'teacher_id', e.target.value)}>
                                            <option value="">Choose Teacher...</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Start Time</label>
                                        <DatePicker
                                            selected={session.time_start ? new Date(`2000-01-01T${session.time_start}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { updateSession(i, 'time_start', date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Start" dateFormat="h:mm aa" placeholderText="Time"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>End Time</label>
                                        <DatePicker
                                            selected={session.time_end ? new Date(`2000-01-01T${session.time_end}:00`) : null}
                                            onChange={(date: Date | null) => { if (date) { updateSession(i, 'time_end', date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')); } }}
                                            showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="End" dateFormat="h:mm aa" placeholderText="Time"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!formData.schedule || formData.schedule.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(26,29,59,0.02)', borderRadius: '24px', border: '2px dashed #E2E8F0', color: '#A1A5B7', fontSize: '14px', fontWeight: 600 }}>
                                <Layers size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <div style={{ color: '#1A1D3B', opacity: 0.6 }}>No sessions configured.</div>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#A1A5B7', marginTop: '4px' }}>Add sessions to define subjects and assigned teachers.</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Batch Lifecycle</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Current Operational Status</label>
                            <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="upcoming">🗓️ Upcoming / Registration Open</option>
                                <option value="ongoing">🟢 Ongoing / In-Session</option>
                                <option value="completed">⚪ Completed</option>
                            </select>
                        </div>
                        {formData.status === 'upcoming' && (
                            <div>
                                <label className="form-label">Anticipated Start Date</label>
                                <DatePicker
                                    showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                    selected={formData.start_date ? new Date(formData.start_date) : null}
                                    onChange={(date: Date | null) => { if (date) setFormData({ ...formData, start_date: date.toISOString().split('T')[0] }); }}
                                    dateFormat="MMMM d, yyyy" placeholderText="Pick a date"
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

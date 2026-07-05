'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Layers, Plus, Clock, Trash2 } from 'lucide-react';
import SubjectSelector from '@/components/SubjectSelector';
import CustomSelect from '@/components/ui/CustomSelect';

export default function AddClassPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const basePath = user?.role === 'coordinator' ? '/coordinator' : '/admin';
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({
        class_name: '', grade_level: '', max_students: 30,
        status: 'upcoming', schedule: [], start_date: ''
    });

    const WEEKDAYS = [
        { key: 'monday', label: 'Mon' },
        { key: 'tuesday', label: 'Tue' },
        { key: 'wednesday', label: 'Wed' },
        { key: 'thursday', label: 'Thu' },
        { key: 'friday', label: 'Fri' },
        { key: 'saturday', label: 'Sat' }
    ];

    useEffect(() => {
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, []);

    const addSession = () => {
        setFormData({
            ...formData,
            schedule: [...formData.schedule, {
                subject: '', teacher_id: '', time_start: '09:00', time_end: '10:00', days: []
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

    const toggleWeekday = (index: number, dayKey: string) => {
        const newSchedule = [...formData.schedule];
        const currentDays = newSchedule[index].days || [];
        let updatedDays: string[];
        if (currentDays.includes(dayKey)) {
            updatedDays = currentDays.filter((d: string) => d !== dayKey);
        } else {
            updatedDays = [...currentDays, dayKey];
        }
        newSchedule[index] = { 
            ...newSchedule[index], 
            days: updatedDays,
            weekly_frequency: updatedDays.length 
        };
        setFormData({ ...formData, schedule: newSchedule });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation: Subject selected, but no weekday selected
        for (const session of formData.schedule) {
            const subjectName = session.subject?.canonical_name || session.subject || 'Subject';
            if (!session.subject) {
                await customAlert('Please select a subject for all curriculum entries.', 'Error');
                return;
            }
            if (!session.days || session.days.length === 0) {
                await customAlert(`${subjectName} must have at least one teaching day.`, 'Error');
                return;
            }
        }

        // 2. Validation: Compare planned lectures to available periods (Default limit 8 for new class)
        const periodsLimit = 8;
        const dayCounts: Record<string, number> = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0 };
        for (const session of formData.schedule) {
            for (const d of (session.days || [])) {
                if (dayCounts[d] !== undefined) {
                    dayCounts[d]++;
                }
            }
        }

        const dayLabels: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
        for (const [day, count] of Object.entries(dayCounts)) {
            if (count > periodsLimit) {
                await customAlert(`${dayLabels[day]} has ${count} planned lectures but only ${periodsLimit} available periods. Please adjust subject weekdays.`, 'Error');
                return;
            }
        }

        // 3. Warning: Teacher assigned but subject never scheduled
        for (const session of formData.schedule) {
            if (session.teacher_id && (!session.days || session.days.length === 0)) {
                await customAlert(`Assigned teacher for ${session.subject} will have no lectures.`, 'Warning');
            }
        }

        setIsSubmitting(true);
        try {
            await api.post('/classes', formData);
            router.push(`${basePath}/classes`);
        } catch (error) {
            console.error('Error creating batch:', error);
            await customAlert('Failed to create batch', 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Create New Batch"
            subtitle="Set up a new class with schedule and teacher assignments"
            backHref={`${basePath}/classes`}
            backLabel="Back to Classes"
            requiredRole={['admin', 'coordinator']}
            icon={<Layers size={20} strokeWidth={2.5} />}
            maxWidth="1200px"
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
                        <div className="form-section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                            Academic Planning (Weekly Subject Plan)
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
                            <Plus size={16} strokeWidth={3} /> Add Subject to Class
                        </button>
                    </div>

                    {formData.schedule && formData.schedule.length > 0 ? (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'visible', position: 'relative' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '16px' }}>Subject</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>Teaching Days</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>Assigned Teacher</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', textAlign: 'center', width: '80px' }}>Count</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', textAlign: 'center', width: '60px', borderTopRightRadius: '16px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.schedule.map((session: any, i: number) => {
                                        const activeDays = session.days || [];
                                        return (
                                            <tr key={i} style={{ borderBottom: i < formData.schedule.length - 1 ? '1px solid #F1F5F9' : 'none', position: 'relative', zIndex: formData.schedule.length - i }}>
                                                {/* Subject selection */}
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                                    <SubjectSelector 
                                                        value={session.subject} 
                                                        onChange={val => updateSession(i, 'subject', val)} 
                                                        placeholder="Select Subject..."
                                                        required
                                                    />
                                                </td>

                                                {/* Weekday toggle buttons */}
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                                                        {WEEKDAYS.map(day => {
                                                            const isSelected = activeDays.includes(day.key);
                                                            return (
                                                                <button
                                                                    key={day.key}
                                                                    type="button"
                                                                    onClick={() => toggleWeekday(i, day.key)}
                                                                    style={{
                                                                        padding: '5px 10px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer',
                                                                        border: isSelected ? 'none' : '1px solid #E2E8F0',
                                                                        transition: 'all 0.15s ease',
                                                                        background: isSelected ? '#1A1D3B' : '#FFFFFF',
                                                                        color: isSelected ? '#FFFFFF' : '#64748B',
                                                                        boxShadow: isSelected ? '0 2px 6px rgba(26,29,59,0.25)' : 'none',
                                                                        minWidth: '38px',
                                                                        textAlign: 'center' as const,
                                                                    }}
                                                                >
                                                                    {day.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>

                                                {/* Teacher selection */}
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                                    <CustomSelect
                                                        options={[
                                                            { value: '', label: 'Select Teacher...' },
                                                            ...teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
                                                        ]}
                                                        value={session.teacher_id?._id || session.teacher_id || ''}
                                                        onChange={val => updateSession(i, 'teacher_id', val)}
                                                    />
                                                </td>

                                                {/* Weekly Count read-only */}
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: 800,
                                                        color: activeDays.length > 0 ? '#1A1D3B' : '#CBD5E1',
                                                        background: activeDays.length > 0 ? 'rgba(26,29,59,0.05)' : '#F8FAFC',
                                                        border: activeDays.length > 0 ? '1.5px solid rgba(26,29,59,0.15)' : '1.5px solid #E2E8F0',
                                                    }}>
                                                        {activeDays.length}
                                                    </span>
                                                </td>

                                                {/* Remove row */}
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeSession(i)} 
                                                        style={{ 
                                                            background: '#FEE2E2', 
                                                            color: '#EF4444', 
                                                            width: '30px', 
                                                            height: '30px', 
                                                            borderRadius: '8px', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(26,29,59,0.02)', borderRadius: '24px', border: '2px dashed #E2E8F0', color: '#A1A5B7', fontSize: '14px', fontWeight: 600 }}>
                            <Clock size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                            <div style={{ color: '#1A1D3B', opacity: 0.6 }}>No sessions configured.</div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#A1A5B7', marginTop: '4px' }}>Add sessions to define subjects and assigned teachers.</div>
                        </div>
                    )}
                </div>

                <div className="form-section">
                    <div className="form-section-title">Batch Lifecycle</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Current Operational Status</label>
                            <CustomSelect
                                options={[
                                    { value: 'upcoming', label: 'Upcoming / Registration Open' },
                                    { value: 'ongoing', label: 'Ongoing / In-Session' },
                                    { value: 'completed', label: 'Completed' }
                                ]}
                                value={formData.status}
                                onChange={val => setFormData({ ...formData, status: val })}
                            />
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
                    <button type="button" className="btn-cancel" onClick={() => router.push(`${basePath}/classes`)}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Batch'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

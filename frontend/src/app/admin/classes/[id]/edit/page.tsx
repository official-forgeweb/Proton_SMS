'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit2, Plus, Clock, CalendarRange, Trash2 } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import SubjectSelector from '@/components/SubjectSelector';

export default function EditClassPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const basePath = user?.role === 'coordinator' ? '/coordinator' : '/admin';
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tcConfig, setTcConfig] = useState<any>(null);
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
        if (params.id) {
            Promise.all([
                api.get(`/classes/${params.id}`),
                api.get('/teachers'),
                api.get(`/timetable/config/${params.id}`).catch(() => ({ data: { data: null } }))
            ]).then(([classRes, teachersRes, configRes]) => {
                const cls = classRes.data.data;
                setFormData({
                    class_name: cls.class_name || '',
                    grade_level: cls.grade_level || '',
                    max_students: cls.max_students || 30,
                    status: cls.status || 'upcoming',
                    schedule: (cls.schedule || []).map((s: any) => ({
                        ...s,
                        days: (s.days || []).map((d: string) => d.toLowerCase())
                    })),
                    start_date: cls.start_date || '',
                });
                setTeachers(teachersRes.data.data || []);
                setTcConfig(configRes.data.data);
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

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

    const parseTimeToMinutes = (t: string): number => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
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

        // 2. Validation: Compare planned lectures to available periods
        let periodsLimit = 8;
        if (tcConfig) {
            const startMin = parseTimeToMinutes(tcConfig.institute_start);
            const endMin = parseTimeToMinutes(tcConfig.institute_end);
            const duration = tcConfig.lecture_duration || 45;
            const breaksCount = tcConfig.breaks?.length || 0;
            periodsLimit = Math.floor((endMin - startMin) / duration) - breaksCount;
            if (periodsLimit <= 0) periodsLimit = 8;
        }

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

        // 3. Warning: Teacher assigned but subject never scheduled (handled by first validation but added as a safety check)
        for (const session of formData.schedule) {
            if (session.teacher_id && (!session.days || session.days.length === 0)) {
                await customAlert(`Assigned teacher for ${session.subject} will have no lectures.`, 'Warning');
            }
        }

        setIsSubmitting(true);
        try {
            await api.put(`/classes/${params.id}`, formData);
            router.push(`${basePath}/classes/${params.id}`);
        } catch (error) {
            console.error('Error updating batch:', error);
            await customAlert('Failed to update batch', 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Edit Batch Details"
            subtitle="Update class schedule and teacher assignments"
            backHref={`${basePath}/classes/${params.id}`}
            backLabel="Back to Class"
            requiredRole={['admin', 'coordinator']}
            icon={<Edit2 size={20} strokeWidth={2.5} />}
            maxWidth="1200px"
        >
            {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div className="form-section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CalendarRange size={18} strokeWidth={2.5} style={{ color: '#6366F1' }} /> 
                                Academic Planning (Weekly Subject Plan)
                            </div>
                            <button 
                                type="button" 
                                onClick={addSession} 
                                className="btn-cancel" 
                                style={{ 
                                    padding: '8px 16px', 
                                    fontSize: '13px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px',
                                    background: '#EEF2FF',
                                    color: '#4F46E5',
                                    border: '1px dashed #C7D2FE',
                                    borderRadius: '10px'
                                }}
                            >
                                <Plus size={16} strokeWidth={2.5} /> Add Subject to Class
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
                                                    {/* Subject selector */}
                                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                                        <SubjectSelector 
                                                            value={typeof session.subject === 'string' ? session.subject : (session.subject?.canonical_name || '')} 
                                                            onChange={val => updateSession(i, 'subject', val)} 
                                                            placeholder="Select Subject..."
                                                            required
                                                        />
                                                    </td>

                                                    {/* Weekday toggle chips */}
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
                                                                            background: isSelected ? '#6366F1' : '#FFFFFF',
                                                                            color: isSelected ? '#FFFFFF' : '#64748B',
                                                                            boxShadow: isSelected ? '0 2px 6px rgba(99, 102, 241, 0.25)' : 'none',
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

                                                    {/* Teacher selection dropdown */}
                                                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                                        <CustomSelect
                                                            options={[
                                                                { value: '', label: 'Select Teacher...' },
                                                                ...teachers.map(t => ({ value: t.id, label: `${t.first_name || ''} ${t.last_name || ''}`.trim() }))
                                                            ]}
                                                            value={session.teacher_id?._id || session.teacher_id || ''}
                                                            onChange={val => updateSession(i, 'teacher_id', val)}
                                                        />
                                                    </td>

                                                    {/* Weekly Count Badge */}
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
                                                            color: activeDays.length > 0 ? '#4F46E5' : '#CBD5E1',
                                                            background: activeDays.length > 0 ? '#EEF2FF' : '#F8FAFC',
                                                            border: activeDays.length > 0 ? '1.5px solid #C7D2FE' : '1.5px solid #E2E8F0',
                                                        }}>
                                                            {activeDays.length}
                                                        </span>
                                                    </td>

                                                    {/* Remove Button */}
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
                                                                transition: 'background-color 0.2s'
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
                            <div style={{ textAlign: 'center', padding: '48px', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0', color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                                <CalendarRange size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3, color: '#4F46E5' }} />
                                No subjects mapped to this class yet.<br />
                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginTop: '4px', display: 'inline-block' }}>
                                    Click &quot;Add Subject to Class&quot; to assign subjects, teachers, and weekly teaching days.
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">Batch Settings</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Batch Status</label>
                                <CustomSelect
                                    options={[
                                        { value: 'upcoming', label: 'Upcoming' },
                                        { value: 'ongoing', label: 'Ongoing' },
                                        { value: 'completed', label: 'Completed' }
                                    ]}
                                    value={formData.status}
                                    onChange={val => setFormData({ ...formData, status: val })}
                                />
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
                        <button type="button" className="btn-cancel" onClick={() => router.push(`${basePath}/classes/${params.id}`)}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Batch'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

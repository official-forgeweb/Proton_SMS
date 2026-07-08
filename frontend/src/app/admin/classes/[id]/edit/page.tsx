'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit2, Plus, Clock, CalendarClock, Trash2 } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import SubjectSelector from '@/components/SubjectSelector';
import ClassTimingConfig from '@/components/ClassTimingConfig';
import { SectionCard, FormGrid, FieldGroup, FormActions } from '@/components/form';

export default function EditClassPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const basePath = user?.role === 'coordinator' ? '/coordinator' : '/admin';
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState<any>({
        class_name: '', 
        grade_level: '', 
        max_students: 30,
        status: 'upcoming', 
        schedule: [], 
        start_date: '',
        timetable_config: {
            institute_start: '08:00',
            institute_end: '14:00',
            lecture_duration: 45,
            is_manual: false,
            breaks: [],
            manual_slots: []
        }
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
                const loadedSchedule = (cls.schedule || []).map((s: any) => ({
                    ...s,
                    days: (s.days || []).map((d: string) => d.toLowerCase())
                }));
                
                const tc = configRes.data.data || {
                    institute_start: '08:00',
                    institute_end: '14:00',
                    lecture_duration: 45,
                    is_manual: false,
                    breaks: [],
                    manual_slots: []
                };

                setFormData({
                    class_name: cls.class_name || '',
                    grade_level: cls.grade_level || '',
                    max_students: cls.max_students || 30,
                    status: cls.status || 'upcoming',
                    schedule: loadedSchedule,
                    start_date: cls.start_date || '',
                    timetable_config: {
                        institute_start: tc.institute_start || '08:00',
                        institute_end: tc.institute_end || '14:00',
                        lecture_duration: tc.lecture_duration || 45,
                        is_manual: tc.is_manual || false,
                        breaks: tc.breaks || [],
                        manual_slots: typeof tc.manual_slots === 'string' ? JSON.parse(tc.manual_slots || '[]') : (tc.manual_slots || [])
                    }
                });
                setTeachers(teachersRes.data.data || []);
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

    const calculatePeriodLimit = (tc: any): number => {
        if (!tc) return 8;
        if (tc.is_manual) {
            return (tc.manual_slots || []).filter((s: any) => !s.is_break).length;
        }
        
        const timeToMin = (t: string): number => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const startMin = timeToMin(tc.institute_start || '08:00');
        const endMin = timeToMin(tc.institute_end || '14:00');
        const duration = Number(tc.lecture_duration) || 45;
        
        const breaksMap = new Map<number, any>();
        (tc.breaks || []).forEach((b: any) => {
            breaksMap.set(Number(b.after_period), b);
        });

        let currentMin = startMin;
        let periodNum = 0;

        while (currentMin + duration <= endMin) {
            periodNum++;
            currentMin += duration;
            const brk = breaksMap.get(periodNum);
            if (brk && currentMin + Number(brk.duration_minutes) <= endMin) {
                currentMin += Number(brk.duration_minutes);
            }
        }
        return periodNum;
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
        const periodsLimit = calculatePeriodLimit(formData.timetable_config);
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
                await customAlert(`${dayLabels[day]} has ${count} planned lectures but only ${periodsLimit} available periods. Please adjust subject weekdays or increase institute hours.`, 'Error');
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
            await api.put(`/classes/${params.id}`, formData);
            router.push(`${basePath}/classes/${params.id}`);
        } catch (error) {
            console.error('Error updating batch:', error);
            await customAlert('Failed to update batch', 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <FormPageLayout
                title="Edit Batch Details"
                subtitle="Update class schedule, timing config, and teacher assignments"
                backHref={`${basePath}/classes/${params.id}`}
                backLabel="Back to Class"
                requiredRole={['admin', 'coordinator']}
                icon={<Edit2 size={20} />}
                maxWidth="1300px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Basic Config Skeleton */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #F0F0F5', padding: '28px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '200px', height: '18px', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timing Config Skeleton */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #F0F0F5', padding: '28px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '180px', height: '18px', borderRadius: '8px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {[1, 2].map(i => (
                                <div key={i}>
                                    <div className="skeleton" style={{ width: '140px', height: '12px', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Academic Planning Skeleton */}
                    <div style={{ background: '#FFFFFF', border: '1px solid #F0F0F5', padding: '28px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '220px', height: '18px', borderRadius: '8px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '12px' }} />
                    </div>

                    {/* Buttons Skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #F0F0F5', paddingTop: '20px', marginTop: '12px' }}>
                        <div className="skeleton" style={{ width: '90px', height: '44px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '10px' }} />
                    </div>
                </div>
            </FormPageLayout>
        );
    }

    return (
        <FormPageLayout
            title="Edit Batch Details"
            subtitle="Update class schedule, timing config, and teacher assignments"
            backHref={`${basePath}/classes/${params.id}`}
            backLabel="Back to Class"
            requiredRole={['admin', 'coordinator']}
            icon={<Edit2 size={20} />}
            maxWidth="1300px"
        >
            <form onSubmit={handleSubmit}>
                
                {/* Basic Configuration */}
                <SectionCard title="Batch Basic Configuration" icon={<Edit2 size={18} />}>
                    <FormGrid columns={3}>
                        <FieldGroup label="Internal Batch Name" required>
                            <input required className="form-input" value={formData.class_name} onChange={e => setFormData({ ...formData, class_name: e.target.value })} placeholder="e.g. Proton Alpha 1" />
                        </FieldGroup>
                        <FieldGroup label="Grade / Target Level" required>
                            <input required className="form-input" value={formData.grade_level} onChange={e => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g. Class 12 / JEE" />
                        </FieldGroup>
                        <FieldGroup label="Capacity (Students)">
                            <input type="number" required className="form-input" value={formData.max_students} onChange={e => setFormData({ ...formData, max_students: Number(e.target.value) })} />
                        </FieldGroup>
                    </FormGrid>
                </SectionCard>

                {/* Timing Config Component */}
                <ClassTimingConfig 
                    value={formData.timetable_config} 
                    onChange={tc => setFormData({ ...formData, timetable_config: tc })} 
                />

                {/* Subject Mapping Table */}
                <SectionCard 
                    title="Academic Planning (Weekly Subject Plan)" 
                    icon={<Clock size={18} />}
                    description="Map subjects to this class, choose allowed weekdays, and allot teachers."
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button
                            type="button"
                            onClick={addSession}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', background: '#1E293B', border: 'none',
                                color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Plus size={16} /> Add Subject to Class
                        </button>
                    </div>

                    {formData.schedule && formData.schedule.length > 0 ? (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'visible', position: 'relative' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '12px' }}>Subject</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>Teaching Days</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>Assigned Teacher</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', textAlign: 'center', width: '80px' }}>Count</th>
                                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', textAlign: 'center', width: '60px', borderTopRightRadius: '12px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.schedule.map((session: any, i: number) => {
                                        const activeDays = session.days || [];
                                        return (
                                            <tr key={i} style={{ borderBottom: i < formData.schedule.length - 1 ? '1px solid #F1F5F9' : 'none', position: 'relative', zIndex: formData.schedule.length - i }}>
                                                <td style={{ padding: '12px 16px', verticalAlign: 'middle', position: 'relative' }}>
                                                    <SubjectSelector 
                                                        value={session.subject} 
                                                        onChange={val => updateSession(i, 'subject', val)} 
                                                        placeholder="Select Subject..."
                                                        required
                                                    />
                                                </td>

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
                                                                        background: isSelected ? '#E53935' : '#FFFFFF',
                                                                        color: isSelected ? '#FFFFFF' : '#64748B',
                                                                        boxShadow: isSelected ? '0 2px 6px rgba(229, 57, 53, 0.25)' : 'none',
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
                                                        color: activeDays.length > 0 ? '#E53935' : '#CBD5E1',
                                                        background: activeDays.length > 0 ? 'rgba(229,57,53,0.05)' : '#F8FAFC',
                                                        border: activeDays.length > 0 ? '1.5px solid rgba(229,57,53,0.15)' : '1.5px solid #E2E8F0',
                                                    }}>
                                                        {activeDays.length}
                                                    </span>
                                                </td>

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
                        <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #E2E8F0', borderRadius: '12px', color: '#64748B', fontSize: '13px' }}>
                            No subjects configured. Click "Add Subject to Class" to get started.
                        </div>
                    )}
                </SectionCard>

                {/* Batch Lifecycle */}
                <SectionCard title="Batch Lifecycle" icon={<CalendarClock size={18} />}>
                    <FormGrid columns={2}>
                        <FieldGroup label="Current Operational Status">
                            <CustomSelect
                                options={[
                                    { value: 'upcoming', label: 'Upcoming / Registration Open' },
                                    { value: 'ongoing', label: 'Ongoing / In-Session' },
                                    { value: 'completed', label: 'Completed' }
                                ]}
                                value={formData.status}
                                onChange={val => setFormData({ ...formData, status: val })}
                            />
                        </FieldGroup>
                        {formData.status === 'upcoming' && (
                            <FieldGroup label="Anticipated Start Date">
                                <DatePicker
                                    showMonthDropdown scrollableYearDropdown dropdownMode="select"
                                    selected={formData.start_date ? new Date(formData.start_date) : null}
                                    onChange={(date: Date | null) => { if (date) setFormData({ ...formData, start_date: date.toISOString().split('T')[0] }); }}
                                    dateFormat="MMMM d, yyyy" placeholderText="Pick a date"
                                />
                            </FieldGroup>
                        )}
                    </FormGrid>
                </SectionCard>

                {/* Form Footer Action Buttons */}
                <FormActions>
                    <button type="button" className="btn-cancel" onClick={() => router.push(`${basePath}/classes/${params.id}`)}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </FormActions>
            </form>
        </FormPageLayout>
    );
}

'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Users, BookOpen, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SectionCard, FormGrid, FieldGroup, FormActions } from '@/components/form';

export default function AddStudentPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emptyForm = {
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
        gender: 'male', school_name: '', admission_type: 'fresh',
        father_name: '', father_phone: '', mother_name: '', mother_phone: '',
        class_ids: [] as string[],
        subjects: {} as Record<string, string[]>,
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data || [])).catch(console.error);
    }, []);

    const getClassSubjects = (classId: string): string[] => {
        const cls = classes.find(c => c.id === classId);
        if (!cls?.schedule) return [];
        const subjects = cls.schedule
            .map((s: any) => s.subject)
            .filter((s: string) => s && s.trim() !== '');
        return [...new Set(subjects)] as string[];
    };

    const toggleSubject = (classId: string, subject: string) => {
        setFormData(prev => {
            const current = prev.subjects[classId] || [];
            const newSubjects = {
                ...prev.subjects,
                [classId]: current.includes(subject)
                    ? current.filter(s => s !== subject)
                    : [...current, subject]
            };
            return { ...prev, subjects: newSubjects };
        });
    };

    const selectAllSubjects = (classId: string) => {
        const allSubjects = getClassSubjects(classId);
        setFormData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                [classId]: (prev.subjects[classId]?.length === allSubjects.length) ? [] : [...allSubjects]
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (submitData.class_ids.length === 0) {
                delete submitData.class_ids;
                delete submitData.subjects;
            }
            if (submitData.subjects) {
                const cleaned: Record<string, string[]> = {};
                for (const [cid, subs] of Object.entries(submitData.subjects)) {
                    if (Array.isArray(subs) && subs.length > 0) cleaned[cid] = subs as string[];
                }
                submitData.subjects = Object.keys(cleaned).length > 0 ? cleaned : undefined;
            }
            await api.post('/students', submitData);
            router.push('/admin/students');
        } catch (error: any) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.message || 'Failed to save student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const subjectColors: Record<string, { bg: string; color: string; border: string; activeBg: string }> = {
        'Mathematics': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', activeBg: '#EDE9FE' },
        'Maths': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', activeBg: '#EDE9FE' },
        'Physics': { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', activeBg: '#DBEAFE' },
        'Chemistry': { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', activeBg: '#FFEDD5' },
        'Biology': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', activeBg: '#DCFCE7' },
        'English': { bg: '#FDF2F8', color: '#DB2777', border: '#FBCFE8', activeBg: '#FCE7F3' },
    };

    const getSubjectStyle = (subject: string, isActive: boolean) => {
        const colors = subjectColors[subject] || { bg: '#F8F9FD', color: '#5E6278', border: '#E2E8F0', activeBg: '#F1F2F6' };
        return {
            background: isActive ? colors.activeBg : '#FFFFFF',
            color: isActive ? colors.color : '#8F92A1',
            border: `2px solid ${isActive ? colors.color : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700 as const,
            display: 'flex' as const,
            alignItems: 'center' as const,
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: isActive ? `0 2px 8px ${colors.color}20` : 'none',
        };
    };

    return (
        <FormPageLayout
            title="Add New Student"
            subtitle="Register a new student into the system with parental info and batch mappings"
            backHref="/admin/students"
            backLabel="Back to Students"
            requiredRole={['admin', 'coordinator']}
            icon={<Users size={20} />}
            maxWidth="1000px"
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
                    {/* Left Column: Personal and Parents info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <SectionCard title="Personal Information" icon={<Users size={18} />}>
                            <FormGrid columns={2}>
                                <FieldGroup label="First Name" required>
                                    <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" />
                                </FieldGroup>
                                <FieldGroup label="Last Name" required>
                                    <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Enter last name" />
                                </FieldGroup>
                                <FieldGroup label="Primary Mobile Number" required>
                                    <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                                </FieldGroup>
                                <FieldGroup label="Email Address">
                                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="student@example.com" />
                                </FieldGroup>
                                <FieldGroup label="Date of Birth" required>
                                    <DatePicker
                                        required
                                        showMonthDropdown showYearDropdown scrollableYearDropdown
                                        yearDropdownItemNumber={100} dropdownMode="select"
                                        selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                                        onChange={(date: Date | null) => setFormData({ ...formData, date_of_birth: date ? date.toISOString().split('T')[0] : '' })}
                                        dateFormat="MMMM d, yyyy" placeholderText="Select date of birth"
                                    />
                                </FieldGroup>
                                <FieldGroup label="Gender">
                                    <CustomSelect
                                        value={formData.gender}
                                        onChange={val => setFormData({ ...formData, gender: val })}
                                        options={[
                                            { value: 'male', label: 'Male' },
                                            { value: 'female', label: 'Female' },
                                            { value: 'other', label: 'Other' }
                                        ]}
                                    />
                                </FieldGroup>
                            </FormGrid>
                        </SectionCard>

                        <SectionCard title="Parent / Guardian Details" icon={<Users size={18} />}>
                            <FormGrid columns={2}>
                                <FieldGroup label="Father's Name">
                                    <input className="form-input" value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value })} placeholder="Enter father's name" />
                                </FieldGroup>
                                <FieldGroup label="Father's Mobile Number">
                                    <input className="form-input" value={formData.father_phone} onChange={e => setFormData({ ...formData, father_phone: e.target.value })} placeholder="Enter father's mobile number" />
                                </FieldGroup>
                                <FieldGroup label="Mother's Name">
                                    <input className="form-input" value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} placeholder="Enter mother's name" />
                                </FieldGroup>
                                <FieldGroup label="Mother's Mobile Number">
                                    <input className="form-input" value={formData.mother_phone} onChange={e => setFormData({ ...formData, mother_phone: e.target.value })} placeholder="Enter mother's mobile number" />
                                </FieldGroup>
                            </FormGrid>
                        </SectionCard>
                    </div>

                    {/* Right Column: Academic Details and school settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <SectionCard title="Academic Details" icon={<BookOpen size={18} />}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label className="form-label">
                                        Assign Batches / Classes
                                        <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500, marginLeft: '8px' }}>
                                            ({formData.class_ids.length} selected)
                                        </span>
                                    </label>
                                    
                                    <div style={{ marginBottom: '16px' }}>
                                        <CustomSelect 
                                            value="" 
                                            onChange={classId => {
                                                if (classId) {
                                                    if (!formData.class_ids.includes(classId)) {
                                                        const classSubjects = getClassSubjects(classId);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            class_ids: [...prev.class_ids, classId],
                                                            subjects: {
                                                                ...prev.subjects,
                                                                [classId]: [...classSubjects]
                                                            }
                                                        }));
                                                    }
                                                }
                                            }}
                                            placeholder="Choose a class / batch to add..."
                                            options={classes
                                                .filter(cls => !formData.class_ids.includes(cls.id))
                                                .map(cls => ({
                                                    value: cls.id,
                                                    label: `${cls.class_name} ${cls.class_code ? `(${cls.class_code})` : ''}`
                                                }))}
                                        />
                                    </div>

                                    {formData.class_ids.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                                            {formData.class_ids.map(classId => {
                                                const cls = classes.find(c => c.id === classId);
                                                if (!cls) return null;
                                                const classSubjects = getClassSubjects(classId);
                                                const selectedSubjects = formData.subjects[classId] || [];

                                                return (
                                                    <div key={classId} style={{
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '16px',
                                                        background: '#F8F9FD',
                                                        padding: '16px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <span style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B' }}>{cls.class_name}</span>
                                                                <span style={{ fontSize: '12px', color: '#8F92A1', marginLeft: '8px', fontFamily: 'monospace' }}>{cls.class_code}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => {
                                                                        const nextClassIds = prev.class_ids.filter(id => id !== classId);
                                                                        const nextSubjects = { ...prev.subjects };
                                                                        delete nextSubjects[classId];
                                                                        return {
                                                                            ...prev,
                                                                            class_ids: nextClassIds,
                                                                            subjects: nextSubjects
                                                                        };
                                                                    });
                                                                }}
                                                                style={{
                                                                    background: '#FEE2E2',
                                                                    color: '#EF4444',
                                                                    border: 'none',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                Remove Class
                                                            </button>
                                                        </div>

                                                        {classSubjects.length > 0 ? (
                                                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#5E6278' }}>Enrolled Subjects</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => selectAllSubjects(classId)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#E53935' }}
                                                                    >
                                                                        {selectedSubjects.length === classSubjects.length ? 'Deselect All' : 'Select All'}
                                                                    </button>
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                    {classSubjects.map(subject => {
                                                                        const isActive = selectedSubjects.includes(subject);
                                                                        return (
                                                                            <button
                                                                                key={subject}
                                                                                type="button"
                                                                                onClick={() => toggleSubject(classId, subject)}
                                                                                style={getSubjectStyle(subject, isActive)}
                                                                            >
                                                                                <div style={{
                                                                                    width: '18px', height: '18px', borderRadius: '5px',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    background: isActive ? (subjectColors[subject]?.color || '#5E6278') : '#E2E8F0',
                                                                                    color: 'white', transition: 'all 0.2s', flexShrink: 0,
                                                                                }}>
                                                                                    {isActive && <Check size={11} strokeWidth={3} />}
                                                                                </div>
                                                                                {subject}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '12px', color: '#8F92A1', fontStyle: 'italic' }}>
                                                                No subjects registered for this class.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <FieldGroup label="Previous School Name">
                                    <input className="form-input" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} placeholder="Ex. Delhi Public School" />
                                </FieldGroup>
                            </div>
                        </SectionCard>
                    </div>
                </div>

                <FormActions>
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/students')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Student'}
                    </button>
                </FormActions>
            </form>
        </FormPageLayout>
    );
}

'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Users, BookOpen, Check } from 'lucide-react';

export default function AddStudentPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emptyForm = {
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
        gender: 'male', school_name: '', class_id: '', admission_type: 'fresh',
        subjects: [] as string[],
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data || [])).catch(console.error);
    }, []);

    // Get available subjects for selected batch
    const batchSubjects = useMemo(() => {
        if (!formData.class_id) return [];
        const selectedClass = classes.find(c => c.id === formData.class_id);
        if (!selectedClass?.schedule) return [];
        const subjects = selectedClass.schedule
            .map((s: any) => s.subject)
            .filter((s: string) => s && s.trim() !== '');
        return [...new Set(subjects)] as string[];
    }, [formData.class_id, classes]);

    // Reset subjects when batch changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, subjects: [] }));
    }, [formData.class_id]);

    const toggleSubject = (subject: string) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subject)
                ? prev.subjects.filter(s => s !== subject)
                : [...prev.subjects, subject]
        }));
    };

    const selectAllSubjects = () => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.length === batchSubjects.length ? [] : [...batchSubjects]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.class_id) {
                delete submitData.class_id;
                delete submitData.subjects;
            }
            if (submitData.subjects?.length === 0) delete submitData.subjects;
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
            subtitle="Register a new student into the system"
            backHref="/admin/students"
            backLabel="Back to Students"
            requiredRole="admin"
            icon={<Users size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">
                        <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                        Personal Information
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">First Name *</label>
                            <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" />
                        </div>
                        <div>
                            <label className="form-label">Last Name *</label>
                            <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Enter last name" />
                        </div>
                        <div>
                            <label className="form-label">Primary Mobile Number *</label>
                            <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div>
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="student@example.com" />
                        </div>
                        <div>
                            <label className="form-label">Date of Birth</label>
                            <DatePicker
                                required
                                showMonthDropdown showYearDropdown scrollableYearDropdown
                                yearDropdownItemNumber={100} dropdownMode="select"
                                selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                                onChange={(date: Date | null) => setFormData({ ...formData, date_of_birth: date ? date.toISOString().split('T')[0] : '' })}
                                dateFormat="MMMM d, yyyy" placeholderText="Select date of birth"
                            />
                        </div>
                        <div>
                            <label className="form-label">Gender</label>
                            <select className="form-input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <BookOpen size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                        Academic Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Assign Batch / Class</label>
                            <select className="form-input" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select a Batch...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Previous School Name</label>
                            <input className="form-input" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} placeholder="Ex. Delhi Public School" />
                        </div>
                    </div>

                    {/* Subject selection - shows when batch is selected */}
                    {formData.class_id && batchSubjects.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>
                                    Select Subjects
                                    <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500, marginLeft: '8px' }}>
                                        ({formData.subjects.length} of {batchSubjects.length} selected)
                                    </span>
                                </label>
                                <button
                                    type="button"
                                    onClick={selectAllSubjects}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 700, color: '#E53935',
                                        padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FFF0F1'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    {formData.subjects.length === batchSubjects.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {batchSubjects.map(subject => {
                                    const isActive = formData.subjects.includes(subject);
                                    return (
                                        <button
                                            key={subject}
                                            type="button"
                                            onClick={() => toggleSubject(subject)}
                                            style={getSubjectStyle(subject, isActive)}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isActive ? (subjectColors[subject]?.color || '#5E6278') : '#E2E8F0',
                                                color: 'white', transition: 'all 0.2s', flexShrink: 0,
                                            }}>
                                                {isActive && <Check size={13} strokeWidth={3} />}
                                            </div>
                                            {subject}
                                        </button>
                                    );
                                })}
                            </div>
                            {formData.subjects.length === 0 && formData.class_id && (
                                <p style={{ fontSize: '12px', color: '#D97706', marginTop: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ⚠️ No subjects selected. Student will be enrolled in the batch but not in any specific subject.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/students')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Student'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

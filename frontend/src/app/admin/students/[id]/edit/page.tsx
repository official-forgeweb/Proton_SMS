'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit2, BookOpen, Check, Users } from 'lucide-react';

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
        gender: 'male', school_name: '', academic_status: 'active',
        class_ids: [] as string[],
        subjects: {} as Record<string, string[]>,
    });

    useEffect(() => {
        if (params.id) {
            Promise.all([
                api.get(`/students/${params.id}`),
                api.get('/classes'),
            ]).then(([studentRes, classesRes]) => {
                const s = studentRes.data.data;
                const allClasses = classesRes.data.data || [];
                setClasses(allClasses);

                // Build class_ids from enrollments
                const enrolledClassIds = (s.classes || []).map((c: any) => c.id);

                // Build subjects map from subject_enrollments
                const subjectsMap: Record<string, string[]> = {};
                (s.subject_enrollments || []).forEach((se: any) => {
                    if (!subjectsMap[se.class_id]) subjectsMap[se.class_id] = [];
                    subjectsMap[se.class_id].push(se.subject);
                });

                setFormData({
                    first_name: s.first_name || '',
                    last_name: s.last_name || '',
                    email: s.email || '',
                    phone: s.phone || '',
                    date_of_birth: s.date_of_birth || '',
                    gender: s.gender || 'male',
                    school_name: s.school_name || '',
                    academic_status: s.academic_status || 'active',
                    class_ids: enrolledClassIds,
                    subjects: subjectsMap,
                });
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const getClassSubjects = (classId: string): string[] => {
        const cls = classes.find(c => c.id === classId);
        if (!cls?.schedule) return [];
        const subjects = cls.schedule
            .map((s: any) => s.subject)
            .filter((s: string) => s && s.trim() !== '');
        return [...new Set(subjects)] as string[];
    };

    const toggleClass = (classId: string) => {
        setFormData(prev => {
            const isSelected = prev.class_ids.includes(classId);
            const newClassIds = isSelected
                ? prev.class_ids.filter(id => id !== classId)
                : [...prev.class_ids, classId];
            const newSubjects = { ...prev.subjects };
            if (isSelected) {
                delete newSubjects[classId];
            } else {
                newSubjects[classId] = [];
            }
            return { ...prev, class_ids: newClassIds, subjects: newSubjects };
        });
    };

    const toggleSubject = (classId: string, subject: string) => {
        setFormData(prev => {
            const current = prev.subjects[classId] || [];
            return {
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [classId]: current.includes(subject)
                        ? current.filter(s => s !== subject)
                        : [...current, subject]
                }
            };
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
            const { class_ids, subjects, ...studentFields } = formData;
            await api.put(`/students/${params.id}`, {
                ...studentFields,
                class_ids,
                subjects,
            });
            router.push(`/admin/students/${params.id}`);
        } catch (error: any) {
            console.error('Error updating student:', error);
            alert(error.response?.data?.message || 'Failed to update student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const subjectColors: Record<string, { color: string; activeBg: string }> = {
        'Mathematics': { color: '#7C3AED', activeBg: '#EDE9FE' },
        'Maths': { color: '#7C3AED', activeBg: '#EDE9FE' },
        'Physics': { color: '#2563EB', activeBg: '#DBEAFE' },
        'Chemistry': { color: '#EA580C', activeBg: '#FFEDD5' },
        'Biology': { color: '#16A34A', activeBg: '#DCFCE7' },
        'English': { color: '#DB2777', activeBg: '#FCE7F3' },
    };

    const getSubjectStyle = (subject: string, isActive: boolean) => {
        const colors = subjectColors[subject] || { color: '#5E6278', activeBg: '#F1F2F6' };
        return {
            background: isActive ? colors.activeBg : '#FFFFFF',
            color: isActive ? colors.color : '#8F92A1',
            border: `2px solid ${isActive ? colors.color : '#E2E8F0'}`,
            borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 700 as const,
            display: 'flex' as const, alignItems: 'center' as const, gap: '8px',
            transition: 'all 0.2s',
            boxShadow: isActive ? `0 2px 8px ${colors.color}20` : 'none',
        };
    };

    return (
        <FormPageLayout
            title="Edit Student"
            subtitle="Update student information and class enrollments"
            backHref={`/admin/students/${params.id}`}
            backLabel="Back to Profile"
            requiredRole="admin"
            icon={<Edit2 size={20} strokeWidth={2.5} />}
            maxWidth="900px"
        >
            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                    ))}
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">
                            <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                            Personal Information
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">First Name *</label>
                                <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Last Name *</label>
                                <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Phone *</label>
                                <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Date of Birth</label>
                                <DatePicker
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
                            <div>
                                <label className="form-label">School Name</label>
                                <input className="form-input" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Academic Status</label>
                                <select className="form-input" value={formData.academic_status} onChange={e => setFormData({ ...formData, academic_status: e.target.value })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="alumni">Alumni</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <BookOpen size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                            Class Enrollments & Subjects
                        </div>
                        <div>
                            <label className="form-label">
                                Enrolled Batches
                                <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500, marginLeft: '8px' }}>
                                    ({formData.class_ids.length} selected)
                                </span>
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {classes.map(cls => {
                                    const isSelected = formData.class_ids.includes(cls.id);
                                    const classSubjects = getClassSubjects(cls.id);
                                    const selectedCount = (formData.subjects[cls.id] || []).length;
                                    return (
                                        <div key={cls.id} style={{
                                            border: `2px solid ${isSelected ? '#E53935' : '#E2E8F0'}`,
                                            borderRadius: '16px', overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            background: isSelected ? '#FFFBFB' : '#FFFFFF'
                                        }}>
                                            <div
                                                onClick={() => toggleClass(cls.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '14px 18px', cursor: 'pointer',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '22px', height: '22px', borderRadius: '6px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: isSelected ? '#E53935' : '#E2E8F0',
                                                        color: 'white', transition: 'all 0.2s', flexShrink: 0,
                                                    }}>
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{cls.class_name}</span>
                                                        <span style={{ fontSize: '12px', color: '#8F92A1', marginLeft: '8px', fontFamily: 'monospace' }}>{cls.class_code}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isSelected && classSubjects.length > 0 && (
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#E53935', background: '#FFF0F1', padding: '3px 8px', borderRadius: '6px' }}>
                                                            {selectedCount}/{classSubjects.length} subjects
                                                        </span>
                                                    )}
                                                    {cls.grade_level && (
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8F92A1', background: '#F4F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                                                            {cls.grade_level}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelected && classSubjects.length > 0 && (
                                                <div style={{ padding: '0 18px 16px', borderTop: '1px solid #F1F2F6' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 8px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#5E6278' }}>Select Subjects</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllSubjects(cls.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#E53935' }}
                                                        >
                                                            {(formData.subjects[cls.id]?.length || 0) === classSubjects.length ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {classSubjects.map(subject => {
                                                            const isActive = (formData.subjects[cls.id] || []).includes(subject);
                                                            return (
                                                                <button
                                                                    key={subject}
                                                                    type="button"
                                                                    onClick={() => toggleSubject(cls.id, subject)}
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
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/students/${params.id}`)}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Student'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

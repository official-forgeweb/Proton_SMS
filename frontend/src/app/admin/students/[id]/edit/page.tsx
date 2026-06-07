'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit2, BookOpen, Check, Users } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
        gender: 'male', school_name: '', academic_status: 'active',
        father_name: '', father_phone: '', mother_name: '', mother_phone: '',
        class_ids: [] as string[],
        subjects: {} as Record<string, string[]>,
        password: '',
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
                    father_name: s.father_name || '',
                    father_phone: s.father_phone || '',
                    mother_name: s.mother_name || '',
                    mother_phone: s.mother_phone || '',
                    class_ids: enrolledClassIds,
                    subjects: subjectsMap,
                    password: '',
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
            const { class_ids, subjects, password, ...studentFields } = formData;
            const submitData: any = { ...studentFields, class_ids, subjects };
            if (password) submitData.password = password;

            // Clean empty subject arrays
            if (submitData.subjects) {
                const cleaned: Record<string, string[]> = {};
                for (const [cid, subs] of Object.entries(submitData.subjects)) {
                    if (Array.isArray(subs) && subs.length > 0) cleaned[cid] = subs as string[];
                }
                submitData.subjects = Object.keys(cleaned).length > 0 ? cleaned : undefined;
            }
            
            await api.put(`/students/${params.id}`, submitData);
            router.push(`/admin/students/${params.id}`);
        } catch (error: any) {
            console.error('Error updating student:', error);
            alert(error.response?.data?.message || 'Failed to update student');
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
            title="Edit Student"
            subtitle="Update student information and class enrollments"
            backHref={`/admin/students/${params.id}`}
            backLabel="Back to Profile"
            requiredRole={['admin', 'coordinator']}
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
                                <CustomSelect
                                    value={formData.gender}
                                    onChange={val => setFormData({ ...formData, gender: val })}
                                    options={[
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="form-label">School Name</label>
                                <input className="form-input" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Academic Status</label>
                                <CustomSelect
                                    value={formData.academic_status}
                                    onChange={val => setFormData({ ...formData, academic_status: val })}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                        { value: 'suspended', label: 'Suspended' },
                                        { value: 'alumni', label: 'Alumni' }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="form-label">Password</label>
                                <input type="text" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                            Parent / Guardian Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">Father's Name</label>
                                <input className="form-input" value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value })} placeholder="Enter father's name" />
                            </div>
                            <div>
                                <label className="form-label">Father's Mobile Number</label>
                                <input className="form-input" value={formData.father_phone} onChange={e => setFormData({ ...formData, father_phone: e.target.value })} placeholder="Enter father's mobile number" />
                            </div>
                            <div>
                                <label className="form-label">Mother's Name</label>
                                <input className="form-input" value={formData.mother_name} onChange={e => setFormData({ ...formData, mother_name: e.target.value })} placeholder="Enter mother's name" />
                            </div>
                            <div>
                                <label className="form-label">Mother's Mobile Number</label>
                                <input className="form-input" value={formData.mother_phone} onChange={e => setFormData({ ...formData, mother_phone: e.target.value })} placeholder="Enter mother's mobile number" />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <BookOpen size={16} strokeWidth={2.5} style={{ color: '#E53935' }} />
                            Class Enrollments & Subjects
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">
                                    Assign Batches / Classes
                                    <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500, marginLeft: '8px' }}>
                                        ({formData.class_ids.length} selected)
                                    </span>
                                </label>
                                
                                {/* Dropdown for class selection */}
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
                                                            [classId]: [...classSubjects] // auto-select all subjects by default
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

                                {/* List of Enrolled Classes & Subjects */}
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

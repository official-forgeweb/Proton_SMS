'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Search, Loader2, CheckCircle, Hash, BookOpen, Phone, ChevronLeft, Smartphone, PhoneCall, MessageCircle, FileText, Users, GraduationCap, Mail, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const QUERY_TYPES = [
    { value: 'phone_change_student', label: 'Phone Number Change (Student)', icon: Smartphone, needsSubtype: false },
    { value: 'phone_change_parent', label: 'Phone Number Change (Parent)', icon: PhoneCall, needsSubtype: false },
    { value: 'whatsapp_student', label: 'Not Added on WhatsApp Group (Student)', icon: MessageCircle, needsSubtype: false },
    { value: 'whatsapp_parent', label: 'Not Added on WhatsApp Group (Parent)', icon: MessageCircle, needsSubtype: false },
    { value: 'old_assignment', label: 'Want Old Assignment', icon: FileText, needsSubtype: true, subtypeLabel: 'Which Assignment?' },
    { value: 'parent_meeting', label: 'Parent Wants to Meet Teacher', icon: Users, needsSubtype: true, subtypeLabel: 'Which Teacher?', needsTeacher: true },
    { value: 'personal_session', label: 'Student Wants Personal Session', icon: GraduationCap, needsSubtype: true, subtypeLabel: 'Which Teacher?', needsTeacher: true },
    { value: 'leave_application', label: 'Application for Leave', icon: Mail, needsSubtype: false },
    { value: 'other', label: 'Other', icon: HelpCircle, needsSubtype: false },
];

export default function AddQueryPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);

    // Student search
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Form
    const [formData, setFormData] = useState({
        query_type: '',
        query_subtype: '',
        description: '',
        target_teacher_id: '',
        priority: 'medium'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch teachers and all students at once for fast client-side searching
                const [teacherRes, studentRes] = await Promise.all([
                    api.get('/teachers'),
                    api.get('/students', { params: { limit: 5000, global_search: 'true' } })
                ]);
                setTeachers(teacherRes.data.data || []);
                setAllStudents(studentRes.data.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, []);

    // Client-side student search for instant results
    useEffect(() => {
        if (studentSearch.length < 2) {
            setStudentResults([]);
            setShowStudentDropdown(false);
            return;
        }
        
        const term = studentSearch.toLowerCase();
        const filtered = allStudents.filter(s => 
            s.first_name?.toLowerCase().includes(term) ||
            s.last_name?.toLowerCase().includes(term) ||
            s.PRO_ID?.toLowerCase().includes(term) ||
            s.phone?.includes(term) ||
            s.email?.toLowerCase().includes(term)
        ).slice(0, 15); // Show top 15 results
        
        setStudentResults(filtered);
        setShowStudentDropdown(true);
    }, [studentSearch, allStudents]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowStudentDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setStudentSearch(`${student.first_name} ${student.last_name} (${student.PRO_ID})`);
        setShowStudentDropdown(false);
    };

    const handleCreateQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setIsSubmitting(true);
        try {
            await api.post('/queries', {
                student_id: selectedStudent.id,
                ...formData
            });
            router.push('/teacher/queries');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create query');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQueryType = QUERY_TYPES.find(q => q.value === formData.query_type);

    return (
        <DashboardLayout requiredRole="teacher">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <Link href="/teacher/queries" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#5E6278', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                    <ChevronLeft size={16} /> Back to Queries
                </Link>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Add New Query</h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Create a new support request for a student.</p>
                </div>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: '32px', borderRadius: '24px', background: '#FFFFFF', border: '1px solid #E2E8F0', maxWidth: '800px', margin: '0 auto' }}>
                    <form onSubmit={handleCreateQuery}>
                        {/* Student Search */}
                        <div ref={searchRef} style={{ position: 'relative', marginBottom: '32px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '10px', display: 'block' }}>
                                Search Student <span style={{ color: '#E53935' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder={allStudents.length === 0 ? "Loading students..." : "Type student name, PRO ID, or phone..."}
                                    value={studentSearch}
                                    disabled={allStudents.length === 0}
                                    onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px', transition: 'all 0.2s', opacity: allStudents.length === 0 ? 0.6 : 1 }}
                                    onFocus={e => e.target.style.borderColor = '#4F60FF'}
                                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                                />
                                {allStudents.length === 0 && <Loader2 size={20} color="#A1A5B7" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />}
                            </div>

                            {/* Search Dropdown */}
                            {showStudentDropdown && studentResults.length > 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)', marginTop: '8px', maxHeight: '300px', overflowY: 'auto'
                                }}>
                                    {studentResults.map(s => (
                                        <div key={s.id} onClick={() => handleSelectStudent(s)}
                                            style={{
                                                padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontWeight: 700, color: '#1A1D3B', fontSize: '15px' }}>
                                                        {s.first_name} {s.last_name}
                                                    </span>
                                                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#A1A5B7', fontWeight: 600 }}>
                                                        {s.PRO_ID}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                    {s.class_enrollments?.[0]?.class?.class_name || 'No Class'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#8F92A1', marginTop: '6px', display: 'flex', gap: '16px' }}>
                                                {s.phone && <span>📞 {s.phone}</span>}
                                                {s.email && <span>✉️ {s.email}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Student Info Card */}
                        {selectedStudent && (
                            <div style={{
                                padding: '20px', borderRadius: '16px', background: '#F0FDF4',
                                border: '1px solid #BBF7D0', marginBottom: '32px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1A1D3B', fontSize: '16px' }}>
                                        {selectedStudent.first_name} {selectedStudent.last_name}
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={14} /> {selectedStudent.PRO_ID}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> {selectedStudent.class_enrollments?.[0]?.class?.class_name || 'N/A'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {selectedStudent.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                <CheckCircle size={28} color="#10B981" />
                            </div>
                        )}

                        {/* Query Type Selection */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '12px', display: 'block' }}>
                                Query Type <span style={{ color: '#E53935' }}>*</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                                {QUERY_TYPES.map(q => (
                                    <div key={q.value}
                                        onClick={() => setFormData({ ...formData, query_type: q.value, query_subtype: '', target_teacher_id: '' })}
                                        style={{
                                            padding: '16px', borderRadius: '14px', cursor: 'pointer',
                                            border: formData.query_type === q.value ? '2px solid #E53935' : '1.5px solid #E2E8F0',
                                            background: formData.query_type === q.value ? '#FFF5F5' : '#FFFFFF',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            transition: 'all 0.2s',
                                            boxShadow: formData.query_type === q.value ? '0 4px 12px rgba(229, 57, 53, 0.1)' : 'none'
                                        }}
                                        className="hover-lift"
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center' }}><q.icon size={24} color={formData.query_type === q.value ? '#E53935' : '#8F92A1'} /></span>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1D3B' }}>{q.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Subtype / Teacher dropdown */}
                        {currentQueryType?.needsSubtype && (
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '10px', display: 'block' }}>
                                    {currentQueryType.subtypeLabel} <span style={{ color: '#E53935' }}>*</span>
                                </label>
                                {currentQueryType.needsTeacher ? (
                                    <select
                                        required
                                        value={formData.target_teacher_id}
                                        onChange={e => setFormData({ ...formData, target_teacher_id: e.target.value, query_subtype: e.target.options[e.target.selectedIndex].text })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        required
                                        placeholder="Specify details..."
                                        value={formData.query_subtype}
                                        onChange={e => setFormData({ ...formData, query_subtype: e.target.value })}
                                        style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px' }}
                                    />
                                )}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            {/* Priority */}
                            <div>
                                <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '10px', display: 'block' }}>
                                    Priority
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {['low', 'medium', 'high'].map(p => {
                                        const isActive = formData.priority === p;
                                        let activeColor = '#4F60FF';
                                        let activeBgColor = '#EEF0FF';
                                        
                                        if (p === 'low') { activeColor = '#10B981'; activeBgColor = '#ECFDF5'; }
                                        else if (p === 'high') { activeColor = '#EF4444'; activeBgColor = '#FEF2F2'; }

                                        return (
                                            <div key={p} onClick={() => setFormData({ ...formData, priority: p })}
                                                style={{
                                                    flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer',
                                                    border: isActive ? `2px solid ${activeColor}` : '1.5px solid #E2E8F0',
                                                    background: isActive ? activeBgColor : '#FFF',
                                                    fontWeight: 700, fontSize: '14px', textTransform: 'capitalize',
                                                    color: isActive ? activeColor : '#5E6278',
                                                    transition: 'all 0.2s'
                                                }}
                                            >{p}</div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: '40px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '10px', display: 'block' }}>
                                Additional Details
                            </label>
                            <textarea
                                placeholder="Any additional details about the query..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1.5px solid #E2E8F0', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '15px' }}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                            <button
                                type="button"
                                onClick={() => router.push('/teacher/queries')}
                                className="btn-secondary"
                                style={{ padding: '14px 24px', borderRadius: '12px', fontWeight: 700 }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedStudent || !formData.query_type || isSubmitting}
                                className="btn-primary"
                                style={{
                                    padding: '14px 32px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    opacity: (!selectedStudent || !formData.query_type || isSubmitting) ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isSubmitting && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                                Submit Query
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

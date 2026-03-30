'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
    User, Phone, Mail, GraduationCap, DollarSign, Activity, 
    FileText, Plus, CheckCircle, ArrowLeft, ClipboardList, Edit2, MapPin 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [attendance, setAttendance] = useState<any>(null);
    const [testStats, setTestStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [feeInfo, setFeeInfo] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            fetchStudentDetails();
            fetchClasses();
            fetchExtraReports();
        }
    }, [params.id]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/students/${params.id}`);
            setStudent(res.data.data);
        } catch (error) {
            console.error('Error fetching student details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExtraReports = async () => {
        try {
            const [attRes, testRes, feeRes, perfRes] = await Promise.allSettled([
                api.get(`/students/${params.id}/attendance`),
                api.get(`/students/${params.id}/tests`),
                api.get(`/students/${params.id}/fees`),
                api.get(`/students/${params.id}/performance`)
            ]);

            if (attRes.status === 'fulfilled') setAttendance(attRes.value.data.data);
            if (testRes.status === 'fulfilled') setTestStats(testRes.value.data.data);
            if (feeRes.status === 'fulfilled') setFeeInfo(feeRes.value.data.data);
            if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data.data);
        } catch (error) {
            console.error('Error fetching student reports', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data || []);
        } catch (error) {
            console.error('Error fetching classes', error);
        }
    };

    const handleAssignClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return toast.error('Please select a class');
        
        setIsSubmitting(true);
        try {
            await api.post(`/students/${params.id}/enroll`, { class_id: selectedClass });
            toast.success('Student enrolled successfully');
            setIsAssignOpen(false);
            setSelectedClass('');
            fetchStudentDetails(); // Refresh to show new enrollment
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '80px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Loading student dossier...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout requiredRole="admin">
                <div className="empty-state" style={{ padding: '100px 0' }}>
                    <GraduationCap size={64} color="var(--border-primary)" />
                    <h3>Student not found</h3>
                    <p>The student with ID {params.id} could not be located in our records.</p>
                    <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => router.push('/admin/students')}>
                        Back to Students List
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole="admin">
            {/* Intelligent Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, #1e2142 0%, #10122e 100%)',
                borderRadius: '24px',
                padding: '32px 40px',
                marginBottom: '32px',
                color: 'white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ 
                        width: '80px', height: '80px', borderRadius: '20px', 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '30px',
                    }}>
                        {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{student.first_name} {student.last_name}</h1>
                            <span style={{ 
                                fontSize: '12px', fontWeight: 700, background: '#E53935', color: 'white', 
                                padding: '4px 12px', borderRadius: '50px'
                            }}>
                                {student.PRO_ID}
                            </span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginTop: '6px' }}>
                            {student.classes?.[0]?.class_name || 'No Active Batch'} • Student Dossier Entry • {student.email}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => router.push('/admin/students')}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        <ArrowLeft size={16} /> All Students
                    </button>
                    <button 
                        className="btn btn-primary" 
                        style={{ boxShadow: '0 8px 16px rgba(229,57,53,0.3)', background: '#E53935', border: 'none' }} 
                        onClick={() => setIsAssignOpen(true)}
                    >
                        <Plus size={16} /> New Enrollment
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Quick Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', background: '#FFEBEE', borderRadius: '12px', color: '#E53935' }}><Activity size={20} /></div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Attendance</p>
                            <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{attendance?.summary?.percentage || 0}%</h4>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', background: '#FFF3E0', borderRadius: '12px', color: '#FF9800' }}><ClipboardList size={20} /></div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Score</p>
                            <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{testStats?.summary?.average_percentage || 0}%</h4>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', background: '#E8F5E9', borderRadius: '12px', color: '#4CAF50' }}><DollarSign size={20} /></div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Fee Status</p>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: feeInfo?.assignment?.payment_status === 'paid' ? '#4CAF50' : '#FF5252' }}>
                                {(feeInfo?.assignment?.payment_status || 'NOT ASSIGNED').toUpperCase()}
                            </h4>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '10px', background: '#F3E5F5', borderRadius: '12px', color: '#9C27B0' }}><GraduationCap size={20} /></div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled In</p>
                            <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{student.classes?.length || 0} Classes</h4>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Course Activity */}
                        <div className="card">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GraduationCap size={18} color="#E53935" /> Current Enrollments & Results
                            </h3>
                            {student.classes?.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Class / Batch</th>
                                            <th>Code</th>
                                            <th>Time Slot</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {student.classes.map((cls: any, idx: number) => (
                                            <tr key={cls.id || cls._id || `class-${idx}`}>
                                                <td style={{ fontWeight: 800, color: '#1A1D3B' }}>{cls.class_name} ({cls.subject})</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10B981', fontWeight: 600 }}>{cls.class_code}</td>
                                                <td style={{ fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>{cls.class_time_start} - {cls.class_time_end}</td>
                                                <td><span style={{ padding: '4px 12px', borderRadius: '50px', background: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: 800 }}>ACTIVE</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No active class enrollments.</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Tests Records */}
                        <div className="card">
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} color="#9C27B0" /> Recent Assessments
                            </h3>
                            {testStats?.results?.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Test Name</th>
                                            <th>Subject</th>
                                            <th>Score</th>
                                            <th>Rank</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testStats.results.slice(0, 5).map((tr: any, idx: number) => (
                                            <tr key={tr.id || tr._id || `result-${idx}`}>
                                                <td style={{ fontWeight: 800, color: '#1A1D3B' }}>{tr.test?.test_name}</td>
                                                <td style={{ color: '#5E6278', fontWeight: 500 }}>{tr.test?.subject}</td>
                                                <td style={{ fontWeight: 800, color: '#E53935' }}>{tr.marks_obtained}/{tr.total_marks} ({tr.percentage}%)</td>
                                                <td style={{ fontWeight: 700, color: '#1A1D3B' }}>#{tr.rank_in_class || tr.rank || 'N/A'}</td>
                                                <td>
                                                    <span style={{ 
                                                        padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 800,
                                                        background: tr.pass_fail === 'pass' ? '#ECFDF5' : '#FEF2F2',
                                                        color: tr.pass_fail === 'pass' ? '#059669' : '#DC2626'
                                                    }}>
                                                        {tr.pass_fail?.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No test results available.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Profile Info Card */}
                        <div className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Profile Details</h3>
                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}><Edit2 size={14} /> Edit</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Mail size={16} color="var(--text-tertiary)" />
                                    <div>
                                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>Email Address</p>
                                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{student.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Phone size={16} color="var(--text-tertiary)" />
                                    <div>
                                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>Phone Number</p>
                                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{student.phone}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <MapPin size={16} color="var(--text-tertiary)" />
                                    <div>
                                        <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>School / Institution</p>
                                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{student.school_name || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border-primary)' }} />

                            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Parent Information</h3>
                            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                                <p style={{ fontWeight: 600, fontSize: '15px' }}>{student.parent?.first_name} {student.parent?.last_name || ''}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Relation: {student.parent_relationship || 'Father'}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Contact: {student.parent?.phone}</p>
                            </div>
                        </div>

                        {/* Recent Attendance Breakdown */}
                        <div className="card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Attendance Summary</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ flex: 1, padding: '16px', background: '#E8F5E9', borderRadius: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#2E7D32' }}>{attendance?.summary?.present || 0}</p>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#4CAF50' }}>PRESENT</p>
                                </div>
                                <div style={{ flex: 1, padding: '16px', background: '#FFEBEE', borderRadius: '12px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '20px', fontWeight: 800, color: '#C62828' }}>{attendance?.summary?.absent || 0}</p>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#F44336' }}>ABSENT</p>
                                </div>
                            </div>
                            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>View Full History</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Same Enroll Modal */}
            <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Enroll in Class">
                <form onSubmit={handleAssignClass} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Enroll <strong>{student.first_name}</strong> in a new batch or class.
                        </p>
                        <select required className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">Select a batch...</option>
                            {classes.filter(c => !student.classes?.some((ec: any) => (ec.id || ec._id) === (c.id || c._id))).map((c: any, idx: number) => (
                                <option key={c.id || c._id || `opt-${idx}`} value={c.id}>
                                    {c.class_name} | {c.subject} | {c.class_time_start}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedClass}>
                            {isSubmitting ? 'Processing...' : 'Assign Class'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

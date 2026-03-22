'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { User, Phone, Mail, GraduationCap, DollarSign, Activity, FileText, Plus, CheckCircle, ArrowLeft } from 'lucide-react';
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

    useEffect(() => {
        if (params.id) {
            fetchStudentDetails();
            fetchClasses();
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
                <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout requiredRole="admin">
                <div className="empty-state">
                    <h3>Student not found</h3>
                    <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => router.push('/admin/students')}>
                        Back to Students
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>{student.PRO_ID}</span>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{student.first_name} {student.last_name}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => router.push('/admin/students')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAssignOpen(true)}>
                        <Plus size={16} /> Assign Class
                    </button>
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="var(--primary)" /> Profile Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <p><strong>Phone:</strong> {student.phone}</p>
                            <p><strong>Email:</strong> {student.email}</p>
                            <p><strong>Gender:</strong> {student.gender}</p>
                            <p><strong>DOB:</strong> {student.date_of_birth}</p>
                            <p><strong>School:</strong> {student.school_name || 'N/A'}</p>
                            <p><strong>Status:</strong> <span className="badge badge-success">{student.academic_status}</span></p>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={18} color="var(--warning)" /> Parent / Guardian
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <p><strong>Name:</strong> {student.parent?.first_name || 'N/A'}</p>
                            <p><strong>Phone:</strong> {student.parent?.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {student.parent?.email || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GraduationCap size={18} color="var(--info)" /> Active Enrollments
                        </h3>
                        {student.classes?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Class Name</th>
                                        <th>Code</th>
                                        <th>Subject</th>
                                        <th>Schedule</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.classes.map((cls: any) => (
                                        <tr key={cls._id}>
                                            <td style={{ fontWeight: 600 }}>{cls.class_name}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{cls.class_code}</td>
                                            <td>{cls.subject} ({cls.grade_level})</td>
                                            <td>{cls.class_time_start} - {cls.class_time_end}</td>
                                            <td>
                                                <span className="badge badge-success">Active</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px' }}>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>No active class enrollments found.</p>
                                <button className="btn btn-ghost btn-sm" style={{ marginTop: '12px' }} onClick={() => setIsAssignOpen(true)}>
                                    <Plus size={14} /> Add First Enrollment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign New Batch / Class">
                <form onSubmit={handleAssignClass} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Select the class you want to enroll <strong>{student.first_name}</strong> in.
                        </p>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Available Batches</label>
                        <select 
                            required
                            className="input-field"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Choose a class...</option>
                            {classes.filter(c => !student.classes?.some((ec: any) => ec._id === c.id)).map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.class_name} | {c.subject} ({c.grade_level}) | {c.class_time_start}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedClass}>
                            {isSubmitting ? 'Assigning...' : 'Confirm Enrollment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

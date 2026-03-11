'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Filter, Plus, Download, GraduationCap, ChevronRight,
    MoreVertical, Eye, Edit, Mail, Phone, X
} from 'lucide-react';

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [feeFilter, setFeeFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchStats();
    }, [search, statusFilter, feeFilter]);

    const fetchStudents = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (feeFilter) params.fee_status = feeFilter;
            const res = await api.get('/students', { params });
            setStudents(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/students/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

    const feeStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            paid: 'badge-success', partial: 'badge-warning', pending: 'badge-neutral', overdue: 'badge-error',
        };
        return map[status] || 'badge-neutral';
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Student Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        {stats?.total || 0} total students • {stats?.active || 0} active
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary"><Download size={16} /> Export</button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add Student
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Row */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        {[
                            { label: 'Total', value: stats.total, color: '#3B82F6', bg: '#DBEAFE' },
                            { label: 'Fee Paid', value: stats.fee.fully_paid, color: '#10B981', bg: '#D1FAE5' },
                            { label: 'Partial', value: stats.fee.partial, color: '#F59E0B', bg: '#FEF3C7' },
                            { label: 'Pending', value: stats.fee.pending + (stats.fee.overdue || 0), color: '#EF4444', bg: '#FEE2E2' },
                        ].map((s) => (
                            <div key={s.label} style={{
                                padding: '16px 20px', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-primary)', background: 'var(--bg-primary)',
                            }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</p>
                                <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, marginTop: '4px' }}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div style={{
                    display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center',
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-tertiary)',
                        }} />
                        <input
                            className="input-field"
                            placeholder="Search by name, PRO_ID, phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '38px' }}
                        />
                    </div>
                    <select
                        className="input-field"
                        style={{ width: '160px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                    <select
                        className="input-field"
                        style={{ width: '160px' }}
                        value={feeFilter}
                        onChange={(e) => setFeeFilter(e.target.value)}
                    >
                        <option value="">All Fees</option>
                        <option value="paid">Fully Paid</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>

                {/* Students Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }} />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="empty-state">
                            <GraduationCap size={48} />
                            <h3>No Students Found</h3>
                            <p>Try adjusting your search or filters, or add a new student.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>PRO_ID</th>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Phone</th>
                                        <th>Fee Status</th>
                                        <th>Attendance</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, idx) => (
                                        <tr key={student.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                            <td>
                                                <span style={{
                                                    fontWeight: 600, color: 'var(--primary)',
                                                    fontFamily: 'monospace', fontSize: '13px',
                                                }}>
                                                    {student.PRO_ID}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className="avatar" style={{
                                                        background: student.gender === 'female' ? '#FCE7F3' : '#DBEAFE',
                                                        color: student.gender === 'female' ? '#EC4899' : '#3B82F6',
                                                        width: '36px', height: '36px', fontSize: '13px',
                                                    }}>
                                                        {student.first_name?.[0]}{student.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '14px' }}>
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px' }}>
                                                    {student.classes?.[0]?.name || 'Not enrolled'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{student.phone}</td>
                                            <td>
                                                <span className={`badge ${feeStatusBadge(student.fee_status)}`}>
                                                    {student.fee_status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="progress-bar" style={{ width: '60px' }}>
                                                        <div className="progress-fill" style={{
                                                            width: `${student.attendance_percentage || 0}%`,
                                                            background: (student.attendance_percentage || 0) >= 80 ? 'var(--success)' : 'var(--warning)',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                                        {(student.attendance_percentage || 0).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => router.push(`/admin/students/${student.id}`)}
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Student Modal */}
            {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchStudents(); fetchStats(); }} />}
        </DashboardLayout>
    );
}

function AddStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', date_of_birth: '', gender: 'male',
        email: '', phone: '', school_name: '', class_id: '',
        parent_name: '', parent_phone: '', parent_email: '', parent_relationship: 'father',
    });
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/students', formData);
            onSuccess();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error creating student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Enroll New Student</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} color="var(--text-tertiary)" />
                    </button>
                </div>

                {/* Progress */}
                <div className="progress-bar" style={{ marginBottom: '24px' }}>
                    <div className="progress-fill" style={{ width: `${(step / 3) * 100}%`, background: 'var(--gradient-primary)' }} />
                </div>

                {step === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>First Name *</label>
                            <input className="input-field" value={formData.first_name} onChange={(e) => updateField('first_name', e.target.value)} placeholder="Enter first name" />
                        </div>
                        <div className="input-group">
                            <label>Last Name *</label>
                            <input className="input-field" value={formData.last_name} onChange={(e) => updateField('last_name', e.target.value)} placeholder="Enter last name" />
                        </div>
                        <div className="input-group">
                            <label>Date of Birth</label>
                            <input className="input-field" type="date" value={formData.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Gender</label>
                            <select className="input-field" value={formData.gender} onChange={(e) => updateField('gender', e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input className="input-field" type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="student@email.com" />
                        </div>
                        <div className="input-group">
                            <label>Phone *</label>
                            <input className="input-field" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91-9876543210" />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>School Name</label>
                            <input className="input-field" value={formData.school_name} onChange={(e) => updateField('school_name', e.target.value)} placeholder="Enter school name" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Parent Name *</label>
                            <input className="input-field" value={formData.parent_name} onChange={(e) => updateField('parent_name', e.target.value)} placeholder="Parent full name" />
                        </div>
                        <div className="input-group">
                            <label>Relationship</label>
                            <select className="input-field" value={formData.parent_relationship} onChange={(e) => updateField('parent_relationship', e.target.value)}>
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="guardian">Guardian</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Parent Phone *</label>
                            <input className="input-field" value={formData.parent_phone} onChange={(e) => updateField('parent_phone', e.target.value)} placeholder="+91-9876543210" />
                        </div>
                        <div className="input-group">
                            <label>Parent Email</label>
                            <input className="input-field" type="email" value={formData.parent_email} onChange={(e) => updateField('parent_email', e.target.value)} placeholder="parent@email.com" />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Select Class/Batch *</label>
                            <select className="input-field" value={formData.class_id} onChange={(e) => updateField('class_id', e.target.value)}>
                                <option value="">Choose a class...</option>
                                {classes.map((cls: any) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name} ({cls.current_students_count}/{cls.max_students} seats)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Review Summary */}
                        <div style={{
                            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                            padding: '20px', marginTop: '16px',
                        }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Enrollment Summary</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Student:</span>
                                <span style={{ fontWeight: 600 }}>{formData.first_name} {formData.last_name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                                <span>{formData.phone}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>Parent:</span>
                                <span>{formData.parent_name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>Class:</span>
                                <span>{classes.find((c: any) => c.id === formData.class_id)?.class_name || 'Not selected'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
                    {step > 1 && (
                        <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        {step < 3 ? (
                            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

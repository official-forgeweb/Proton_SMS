'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Users } from 'lucide-react';

export default function AddStudentPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const emptyForm = {
        first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
        gender: 'male', school_name: '', class_id: '', admission_type: 'fresh'
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data || [])).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.class_id) delete submitData.class_id;
            await api.post('/students', submitData);
            router.push('/admin/students');
        } catch (error: any) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.message || 'Failed to save student');
        } finally {
            setIsSubmitting(false);
        }
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
                        <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Academic Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Assign Initial Class / Batch</label>
                            <select className="form-input" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select a Class...</option>
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

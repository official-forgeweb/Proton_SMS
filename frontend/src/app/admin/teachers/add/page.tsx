'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Users } from 'lucide-react';

export default function AddTeacherPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', qualification: '',
        specialization: '', experience_years: '', role_type: 'subject_teacher',
        gender: 'male', date_of_joining: new Date().toISOString().split('T')[0], password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.password) delete submitData.password;
            if (!submitData.experience_years) delete submitData.experience_years;
            await api.post('/teachers', submitData);
            router.push('/admin/teachers');
        } catch (error) {
            console.error('Error saving teacher:', error);
            alert('Failed to save teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Onboard New Teacher"
            subtitle="Register a new staff member into the system"
            backHref="/admin/teachers"
            backLabel="Back to Teachers"
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
                            <label className="form-label">Email Address *</label>
                            <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="teacher@example.com" />
                        </div>
                        <div>
                            <label className="form-label">Initial Password *</label>
                            <input type="text" required className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Create login password" />
                        </div>
                        <div>
                            <label className="form-label">Mobile Number *</label>
                            <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
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
                        Professional Qualifications
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Highest Degree *</label>
                            <input required className="form-input" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. B.Ed, M.Sc" />
                        </div>
                        <div>
                            <label className="form-label">Subject Specialization *</label>
                            <input required className="form-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="Mathematics, Physics etc." />
                        </div>
                        <div>
                            <label className="form-label">Experience</label>
                            <input type="number" className="form-input" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} placeholder="Years" />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/teachers')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Onboard Teacher'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

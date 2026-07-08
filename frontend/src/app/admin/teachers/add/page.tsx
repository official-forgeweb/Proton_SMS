'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Users, GraduationCap, Briefcase } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SectionCard, FormGrid, FieldGroup, FormActions } from '@/components/form';

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
            subtitle="Register a new staff member into the system with qualifications and credentials"
            backHref="/admin/teachers"
            backLabel="Back to Teachers"
            requiredRole="admin"
            icon={<Users size={20} />}
            maxWidth="1000px"
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
                    <SectionCard title="Personal Information" icon={<Users size={18} />}>
                        <FormGrid columns={2}>
                            <FieldGroup label="First Name" required>
                                <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" />
                            </FieldGroup>
                            <FieldGroup label="Last Name" required>
                                <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Enter last name" />
                            </FieldGroup>
                            <FieldGroup label="Email Address" required>
                                <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="teacher@example.com" />
                            </FieldGroup>
                            <FieldGroup label="Initial Password" required>
                                <input type="text" required className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Create login password" />
                            </FieldGroup>
                            <FieldGroup label="Mobile Number" required>
                                <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
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

                    <SectionCard title="Professional Qualifications" icon={<GraduationCap size={18} />}>
                        <FormGrid columns={2}>
                            <FieldGroup label="Highest Degree" required>
                                <input required className="form-input" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g. B.Ed, M.Sc" />
                            </FieldGroup>
                            <FieldGroup label="Subject Specialization" required>
                                <input required className="form-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="Mathematics, Physics etc." />
                            </FieldGroup>
                            <FieldGroup label="Experience (Years)">
                                <input type="number" className="form-input" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} placeholder="Years" />
                            </FieldGroup>
                        </FormGrid>
                    </SectionCard>
                </div>

                <FormActions>
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/teachers')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Onboard Teacher'}
                    </button>
                </FormActions>
            </form>
        </FormPageLayout>
    );
}

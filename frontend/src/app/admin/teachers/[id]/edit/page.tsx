'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Edit2, Users, GraduationCap } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SectionCard, FormGrid, FieldGroup, FormActions } from '@/components/form';

export default function EditTeacherPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', qualification: '',
        specialization: '', experience_years: '', role_type: 'subject_teacher',
        gender: 'male', password: '',
    });

    useEffect(() => {
        if (params.id) {
            api.get(`/teachers/${params.id}`).then(res => {
                const t = res.data.data;
                setFormData({
                    first_name: t.first_name || '',
                    last_name: t.last_name || '',
                    email: t.email || t.user?.email || '',
                    phone: t.phone || '',
                    qualification: t.qualification || '',
                    specialization: t.specialization || '',
                    experience_years: t.experience_years || '',
                    role_type: t.role_type || 'subject_teacher',
                    gender: t.gender || 'male',
                    password: '',
                });
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.password) delete submitData.password;
            await api.put(`/teachers/${params.id}`, submitData);
            router.push(`/admin/teachers/${params.id}`);
        } catch (error) {
            console.error('Error updating teacher:', error);
            alert('Failed to update teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return null;

    return (
        <FormPageLayout
            title="Edit Teacher Details"
            subtitle="Update staff member profile details, credentials, and settings"
            backHref={`/admin/teachers/${params.id}`}
            backLabel="Back to Profile"
            requiredRole="admin"
            icon={<Edit2 size={20} />}
            maxWidth="1000px"
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
                    <SectionCard title="Personal Information" icon={<Users size={18} />}>
                        <FormGrid columns={2}>
                            <FieldGroup label="First Name" required>
                                <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Last Name" required>
                                <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Email Address" required>
                                <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Mobile Number" required>
                                <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
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
                            <FieldGroup label="Password">
                                <input type="text" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                            </FieldGroup>
                        </FormGrid>
                    </SectionCard>

                    <SectionCard title="Professional Qualifications" icon={<GraduationCap size={18} />}>
                        <FormGrid columns={2}>
                            <FieldGroup label="Highest Degree">
                                <input className="form-input" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Subject Specialization">
                                <input className="form-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                            </FieldGroup>
                            <FieldGroup label="Experience (Years)">
                                <input type="number" className="form-input" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                            </FieldGroup>
                        </FormGrid>
                    </SectionCard>
                </div>

                <FormActions>
                    <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/teachers/${params.id}`)}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Updating...' : 'Save Changes'}
                    </button>
                </FormActions>
            </form>
        </FormPageLayout>
    );
}

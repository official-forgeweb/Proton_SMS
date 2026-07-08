'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Shield, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { SectionCard, FormGrid, FieldGroup, FormActions } from '@/components/form';

interface EditCoordinatorPageProps {
    params: Promise<{ id: string }>;
}

export default function EditCoordinatorPage({ params }: EditCoordinatorPageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '',
        gender: 'male', password: '', status: 'active',
    });

    useEffect(() => {
        const fetchCoordinator = async () => {
            try {
                const res = await api.get(`/coordinators/${id}`);
                const data = res.data?.data;
                if (data) {
                    setFormData({
                        full_name: data.full_name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        gender: data.gender || 'male',
                        password: '', // blank by default, only updated if filled
                        status: data.status || 'active',
                    });
                }
            } catch (error) {
                console.error('Error fetching coordinator:', error);
                alert('Failed to load coordinator details');
                router.push('/admin/coordinators');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCoordinator();
        }
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.password) {
                delete submitData.password;
            }
            await api.put(`/coordinators/${id}`, submitData);
            router.push('/admin/coordinators');
        } catch (error: any) {
            console.error('Error updating coordinator:', error);
            alert(error.response?.data?.message || 'Failed to update coordinator');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <FormPageLayout
                title="Edit Coordinator"
                subtitle="Loading coordinator account details..."
                backHref="/admin/coordinators"
                backLabel="Back to Coordinators"
                requiredRole="admin"
                icon={<Shield size={20} strokeWidth={2.5} />}
                accentColor="#7C3AED"
            >
                <div style={{ padding: '60px', textAlign: 'center', color: '#5E6278', fontWeight: 600 }}>
                    <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', borderWidth: '3px' }} />
                    Loading details...
                </div>
            </FormPageLayout>
        );
    }

    return (
        <FormPageLayout
            title="Edit Coordinator"
            subtitle={`Modify credentials and profile details for ${formData.full_name}`}
            backHref="/admin/coordinators"
            backLabel="Back to Coordinators"
            requiredRole="admin"
            icon={<Shield size={20} strokeWidth={2.5} />}
            accentColor="#7C3AED"
            maxWidth="1300px"
        >
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>
                    {/* Left Column */}
                    <SectionCard title="Personal Information" icon={<Shield size={18} />}>
                        <FormGrid columns={2}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <FieldGroup label="Full Name" required>
                                    <input required className="form-input" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="Enter coordinator's full name" />
                                </FieldGroup>
                            </div>
                            <FieldGroup label="Email Address" required>
                                <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="coordinator@example.com" />
                            </FieldGroup>
                            <FieldGroup label="Update Password">
                                <input type="text" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                            </FieldGroup>
                            <FieldGroup label="Mobile Number">
                                <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
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

                    {/* Right Column */}
                    <SectionCard title="Account Settings" icon={<Shield size={18} />}>
                        <FormGrid columns={1}>
                            <FieldGroup label="Status">
                                <CustomSelect
                                    value={formData.status}
                                    onChange={val => setFormData({ ...formData, status: val })}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' }
                                    ]}
                                />
                            </FieldGroup>
                        </FormGrid>
                    </SectionCard>
                </div>

                <FormActions>
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/coordinators')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </FormActions>
            </form>
        </FormPageLayout>
    );
}

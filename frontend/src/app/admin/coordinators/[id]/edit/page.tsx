'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Shield, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

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
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">
                        <Shield size={16} strokeWidth={2.5} style={{ color: '#7C3AED' }} />
                        Personal Information
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Full Name *</label>
                            <input required className="form-input" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="Enter coordinator's full name" />
                        </div>
                        <div>
                            <label className="form-label">Email Address *</label>
                            <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="coordinator@example.com" />
                        </div>
                        <div>
                            <label className="form-label">Update Password</label>
                            <input type="text" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                        </div>
                        <div>
                            <label className="form-label">Mobile Number</label>
                            <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
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
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <Shield size={16} strokeWidth={2.5} style={{ color: '#7C3AED' }} />
                        Account Settings
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', maxWidth: '50%' }}>
                        <div>
                            <label className="form-label">Status</label>
                            <CustomSelect
                                value={formData.status}
                                onChange={val => setFormData({ ...formData, status: val })}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/coordinators')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

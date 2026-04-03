'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Edit2 } from 'lucide-react';

export default function EditTeacherPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', qualification: '',
        specialization: '', experience_years: '', role_type: 'subject_teacher',
        gender: 'male',
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
                });
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/teachers/${params.id}`, formData);
            router.push(`/admin/teachers/${params.id}`);
        } catch (error) {
            console.error('Error updating teacher:', error);
            alert('Failed to update teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Edit Teacher Details"
            subtitle="Update staff member information"
            backHref={`/admin/teachers/${params.id}`}
            backLabel="Back to Profile"
            requiredRole="admin"
            icon={<Edit2 size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">Personal Information</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">First Name *</label>
                                <input required className="form-input" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Last Name *</label>
                                <input required className="form-input" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Phone *</label>
                                <input required className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Gender</label>
                                <select className="form-input" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">Professional Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Qualification</label>
                                <input className="form-input" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Specialization</label>
                                <input className="form-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Experience (Years)</label>
                                <input type="number" className="form-input" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/teachers/${params.id}`)}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

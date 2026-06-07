'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Shield, Copy, Check } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

export default function AddCoordinatorPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '',
        gender: 'male', password: '', status: 'active',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData: any = { ...formData };
            if (!submitData.password) delete submitData.password;
            const res = await api.post('/coordinators', submitData);
            const creds = res.data?.data?.credentials;
            if (creds) {
                setCredentials(creds);
            } else {
                router.push('/admin/coordinators');
            }
        } catch (error: any) {
            console.error('Error creating coordinator:', error);
            alert(error.response?.data?.message || 'Failed to create coordinator');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        if (!credentials) return;
        navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (credentials) {
        return (
            <FormPageLayout
                title="Coordinator Created!"
                subtitle="Share the following credentials securely with the new coordinator"
                backHref="/admin/coordinators"
                backLabel="Back to Coordinators"
                requiredRole="admin"
                icon={<Check size={20} strokeWidth={2.5} />}
                accentColor="#059669"
            >
                <div className="form-section" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: '#ECFDF5', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 24px',
                    }}>
                        <Check size={32} color="#059669" strokeWidth={2.5} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>
                        Account Successfully Created
                    </h3>
                    <p style={{ fontSize: '14px', color: '#5E6278', marginBottom: '32px' }}>
                        {formData.full_name} can now log in with these credentials
                    </p>

                    <div style={{
                        background: '#F8F9FD', borderRadius: '16px', padding: '24px',
                        border: '1px solid #E2E8F0', textAlign: 'left', marginBottom: '24px',
                    }}>
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Email</span>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', margin: '4px 0 0' }}>{credentials.email}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#5E6278', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Password</span>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', margin: '4px 0 0', fontFamily: 'monospace' }}>{credentials.password}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                padding: '12px 24px', background: '#FFFFFF', color: '#1A1D3B',
                                border: '1px solid #E2E8F0', borderRadius: '14px', fontWeight: 700,
                                fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                gap: '8px', transition: 'all 0.2s',
                            }}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Credentials'}
                        </button>
                        <button
                            onClick={() => router.push('/admin/coordinators')}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                                color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700,
                                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                            }}
                        >
                            Go to Coordinators
                        </button>
                    </div>
                </div>
            </FormPageLayout>
        );
    }

    return (
        <FormPageLayout
            title="Add New Coordinator"
            subtitle="Create a coordinator account with managed access"
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
                            <label className="form-label">Initial Password</label>
                            <input type="text" className="form-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Auto-generated if left blank" />
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
                        {isSubmitting ? 'Creating...' : 'Create Coordinator'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

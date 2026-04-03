'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { MessageSquare, Phone, Mail, MessageCircle, Info } from 'lucide-react';

export default function AddRemarkPage() {
    const params = useParams();
    const router = useRouter();
    const [enquiry, setEnquiry] = useState<any>(null);
    const [remark, setRemark] = useState('');
    const [remarkType, setRemarkType] = useState('call');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/enquiries/${params.id}`).then(res => {
                setEnquiry(res.data.data);
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!remark.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${params.id}/remarks`, { remark, remark_type: remarkType });
            router.push(`/admin/enquiries/${params.id}`);
        } catch (error) {
            console.error('Error adding remark:', error);
            alert('Failed to add remark');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Add Remark"
            subtitle={`Log a new interaction or note for ${enquiry?.student_name || 'Enquiry'}`}
            backHref={`/admin/enquiries/${params.id}`}
            backLabel="Back to Enquiry"
            requiredRole="admin"
            icon={<MessageSquare size={20} strokeWidth={2.5} />}
            maxWidth="600px"
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
                        <div className="form-section-title">Interaction Details</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label className="form-label">Interaction Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {[
                                        { id: 'call', label: 'Phone Call', icon: <Phone size={14} /> },
                                        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} /> },
                                        { id: 'email', label: 'Email', icon: <Mail size={14} /> },
                                        { id: 'follow_up', label: 'Follow Up', icon: <Clock size={14} /> },
                                        { id: 'meeting', label: 'Meeting', icon: <User size={14} /> },
                                        { id: 'other', label: 'Other', icon: <Info size={14} /> },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setRemarkType(type.id)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: '1px solid #E2E8F0',
                                                background: remarkType === type.id ? 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)' : 'white',
                                                color: remarkType === type.id ? 'white' : '#5E6278',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {type.icon} {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Remark / Notes *</label>
                                <textarea
                                    required
                                    className="form-input"
                                    rows={6}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    placeholder="Enter detailed notes about the interaction..."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/enquiries/${params.id}`)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Remark'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

// Minimal icons for the buttons
const Clock = ({ size, color }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const User = ({ size, color }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

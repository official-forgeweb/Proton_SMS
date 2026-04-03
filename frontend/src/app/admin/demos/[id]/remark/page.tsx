'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { MessageSquare, Calendar, Clock, Target, User } from 'lucide-react';

export default function DemoRemarkPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const enquiryId = searchParams.get('enquiry');
    
    const [demo, setDemo] = useState<any>(null);
    const [remark, setRemark] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            // We might not have a direct "get demo by id" if it's nested in enquiries, 
            // but let's assume the API can handle it or we fetch from all demos.
            api.get('/enquiries/demos/all').then(res => {
                const found = res.data.data.find((d: any) => d.id === params.id);
                setDemo(found);
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!remark.trim() || !enquiryId) return;
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${enquiryId}/remarks`, {
                remark: `(Demo Class Remark) ${remark}`,
                remark_type: 'meeting',
            });
            router.push('/admin/demos');
        } catch (error) {
            console.error('Error adding demo remark:', error);
            alert('Failed to save remark');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Demo Class Feedback"
            subtitle={`Log a remark for the demo session with ${demo?.enquiry?.student_name || 'Student'}`}
            backHref="/admin/demos"
            backLabel="Back to Demos"
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
                        <div className="form-section-title">Session Summary</div>
                        <div style={{ background: '#F8F9FD', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5E6278' }}>
                                    <Calendar size={14} color="#A1A5B7" /> {demo?.demo_date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5E6278' }}>
                                    <Clock size={14} color="#A1A5B7" /> {demo?.demo_time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5E6278' }}>
                                    <Target size={14} color="#A1A5B7" /> {demo?.subject}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5E6278' }}>
                                    <User size={14} color="#A1A5B7" /> Demo #{demo?.demo_count}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Remark / Feedback *</label>
                            <textarea
                                required
                                className="form-input"
                                rows={6}
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter notes about how the demo class went, student receptivity, and next steps..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push('/admin/demos')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Feedback'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

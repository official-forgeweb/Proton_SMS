'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { MessageSquare } from 'lucide-react';

export default function TeacherEnquiryRemarkPage() {
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
            await api.post(`/enquiries/${params.id}/remarks`, { 
                remark, 
                remark_type: remarkType 
            });
            router.push(`/teacher/enquiries/${params.id}`);
        } catch (error) {
            console.error('Error adding remark:', error);
            alert('Failed to save remark');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Add Activity Remark"
            subtitle={`Log a new interation with ${enquiry?.student_name || 'Student'}`}
            backHref={`/teacher/enquiries/${params.id}`}
            backLabel="Back to Enquiry"
            requiredRole="teacher"
            icon={<MessageSquare size={20} strokeWidth={2.5} />}
            maxWidth="600px"
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">
                        <MessageSquare size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Interaction Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Type of Interaction</label>
                            <select 
                                className="form-input" 
                                value={remarkType} 
                                onChange={(e) => setRemarkType(e.target.value)}
                            >
                                <option value="call">📞 Phone Call</option>
                                <option value="meeting">🤝 In-Person Meeting</option>
                                <option value="whatsapp">💬 WhatsApp Message</option>
                                <option value="email">📧 Email Sent</option>
                                <option value="follow_up">🔄 Follow Up</option>
                                <option value="other">📝 Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Remark / Feedback *</label>
                            <textarea 
                                required
                                className="form-input" 
                                rows={6} 
                                value={remark} 
                                onChange={(e) => setRemark(e.target.value)} 
                                placeholder="Enter specific details about the conversation, student concerns, or next steps..." 
                                style={{ resize: 'vertical', minHeight: '180px' }} 
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push(`/teacher/enquiries/${params.id}`)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting || isLoading}>
                        {isSubmitting ? 'Saving...' : 'Save Remark'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

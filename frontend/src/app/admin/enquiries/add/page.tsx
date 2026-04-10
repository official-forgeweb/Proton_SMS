'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Phone, User, Mail, MapPin, Target, MessageSquare, Users } from 'lucide-react';

export default function AddEnquiryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enquiryMode, setEnquiryMode] = useState<'walk_in' | 'on_call'>('walk_in');
    const [formData, setFormData] = useState({
        student_name: '', phone: '', email: '', parent_name: '', parent_phone: '',
        current_class: '', interested_course: '', source: 'google', priority: 'medium', note: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { note, ...payload } = formData;
            
            const res = await api.post('/enquiries', payload);
            
            if (formData.note.trim()) {
                await api.post(`/enquiries/${res.data.data.id}/remarks`, {
                    remark: formData.note,
                    remark_type: 'general'
                });
            }
            
            router.push('/admin/enquiries');
        } catch (error) {
            console.error('Error creating enquiry:', error);
            alert('Failed to create enquiry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="New Student Enquiry"
            subtitle="Record a new lead or student inquiry into the system"
            backHref="/admin/enquiries"
            backLabel="Back to Enquiries"
            requiredRole="admin"
            icon={<MessageSquare size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                {/* Mode Selector */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <div 
                        onClick={() => setEnquiryMode('walk_in')}
                        style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `2px solid ${enquiryMode === 'walk_in' ? '#3B82F6' : '#E2E8F0'}`, background: enquiryMode === 'walk_in' ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                        <User size={24} color={enquiryMode === 'walk_in' ? '#3B82F6' : '#A1A5B7'} />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: enquiryMode === 'walk_in' ? '#1E3A8A' : '#5E6278' }}>Walk-in Enquiry</span>
                        <span style={{ fontSize: '12px', color: '#A1A5B7' }}>Detailed Profile</span>
                    </div>
                    <div 
                        onClick={() => setEnquiryMode('on_call')}
                        style={{ flex: 1, padding: '16px', borderRadius: '16px', border: `2px solid ${enquiryMode === 'on_call' ? '#10B981' : '#E2E8F0'}`, background: enquiryMode === 'on_call' ? '#ECFDF5' : '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                    >
                        <Phone size={24} color={enquiryMode === 'on_call' ? '#10B981' : '#A1A5B7'} />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: enquiryMode === 'on_call' ? '#065F46' : '#5E6278' }}>On Call Enquiry</span>
                        <span style={{ fontSize: '12px', color: '#A1A5B7' }}>Quick Registration</span>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <User size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Student Information

                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Student Full Name *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.student_name}
                                onChange={(e) => setFormData(p => ({ ...p, student_name: e.target.value }))}
                                placeholder="e.g. Aryan Sharma"
                            />
                        </div>
                        <div>
                            <label className="form-label">Primary Phone Number *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>
                        {enquiryMode === 'walk_in' && (
                            <>
                                <div>
                                    <label className="form-label">Email Address</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Current Grade / Class</label>
                                    <input
                                        className="form-input"
                                        value={formData.current_class}
                                        onChange={(e) => setFormData(p => ({ ...p, current_class: e.target.value }))}
                                        placeholder="e.g. Class 10th / XII"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {enquiryMode === 'walk_in' && (
                    <div className="form-section">
                        <div className="form-section-title">
                            <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                            Parent / Guardian Details
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">Parent / Guardian Name *</label>
                                <input
                                    required={enquiryMode === 'walk_in'}
                                    className="form-input"
                                    value={formData.parent_name}
                                    onChange={(e) => setFormData(p => ({ ...p, parent_name: e.target.value }))}
                                    placeholder="Full Name of Father/Mother"
                                />
                            </div>
                            <div>
                                <label className="form-label">Emergency Phone *</label>
                                <input
                                    required={enquiryMode === 'walk_in'}
                                    className="form-input"
                                    value={formData.parent_phone}
                                    onChange={(e) => setFormData(p => ({ ...p, parent_phone: e.target.value }))}
                                    placeholder="Contact Number"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-section">
                    <div className="form-section-title">
                        <Target size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Enquiry Preferences
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Interested Course *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.interested_course}
                                onChange={(e) => setFormData(p => ({ ...p, interested_course: e.target.value }))}
                                placeholder="e.g. JEE Advanced / NEET"
                            />
                        </div>
                        <div>
                            <label className="form-label">Lead Source</label>
                            <select
                                className="form-input"
                                value={formData.source}
                                onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                            >
                                <option value="offline_publicity">📰 Offline Publicity</option>
                                <option value="social_media">📱 Social Media</option>
                                <option value="google">🌐 Google</option>
                                <option value="referral">🤝 Referral through Student/Parent</option>
                                <option value="other">💬 Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Priority</label>
                            <select
                                className="form-input"
                                value={formData.priority}
                                onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="urgent">🔴 Critical</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                        <label className="form-label">Initial Note / Remark</label>
                        <textarea
                            className="form-input"
                            style={{ height: '100px', resize: 'vertical' }}
                            value={formData.note}
                            onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
                            placeholder="Add any initial observations, requirements, or conversation summaries here..."
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/admin/enquiries')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Create Enquiry'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

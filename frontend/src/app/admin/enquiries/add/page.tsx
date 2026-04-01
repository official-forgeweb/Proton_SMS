'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Phone, User, Mail, MapPin, Target, MessageSquare, Users } from 'lucide-react';

export default function AddEnquiryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        student_name: '', phone: '', email: '', parent_name: '', parent_phone: '',
        current_class: '', interested_course: '', source: 'website', priority: 'medium',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/enquiries', formData);
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
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Parent / Guardian Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Parent / Guardian Name *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.parent_name}
                                onChange={(e) => setFormData(p => ({ ...p, parent_name: e.target.value }))}
                                placeholder="Full Name of Father/Mother"
                            />
                        </div>
                        <div>
                            <label className="form-label">Emergency Phone *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.parent_phone}
                                onChange={(e) => setFormData(p => ({ ...p, parent_phone: e.target.value }))}
                                placeholder="Contact Number"
                            />
                        </div>
                    </div>
                </div>

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
                                <option value="website">🌐 Official Website</option>
                                <option value="walk_in">🚶 Walk-in Inquiry</option>
                                <option value="phone">📞 Phone Consultation</option>
                                <option value="referral">🤝 Student Referral</option>
                                <option value="social_media">📱 Social Media</option>
                                <option value="advertisement">📢 Advertisement</option>
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

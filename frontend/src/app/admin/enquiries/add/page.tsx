'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Phone, User, Mail, MapPin, Target, MessageSquare } from 'lucide-react';

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
                    <div className="form-section-title">Student Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Student Name *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.student_name}
                                onChange={(e) => setFormData(p => ({ ...p, student_name: e.target.value }))}
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="form-label">Phone Number *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                placeholder="Contact Number"
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
                            <label className="form-label">Current Class / Grade</label>
                            <input
                                className="form-input"
                                value={formData.current_class}
                                onChange={(e) => setFormData(p => ({ ...p, current_class: e.target.value }))}
                                placeholder="e.g. Class 10"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Parent / Guardian Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Parent Name *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.parent_name}
                                onChange={(e) => setFormData(p => ({ ...p, parent_name: e.target.value }))}
                                placeholder="Father/Mother Name"
                            />
                        </div>
                        <div>
                            <label className="form-label">Parent Phone *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.parent_phone}
                                onChange={(e) => setFormData(p => ({ ...p, parent_phone: e.target.value }))}
                                placeholder="Emergency Contact"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Enquiry Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Interested Course *</label>
                            <input
                                required
                                className="form-input"
                                value={formData.interested_course}
                                onChange={(e) => setFormData(p => ({ ...p, interested_course: e.target.value }))}
                                placeholder="e.g. JEE Advanced"
                            />
                        </div>
                        <div>
                            <label className="form-label">Source of Enquiry</label>
                            <select
                                className="form-input"
                                value={formData.source}
                                onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                            >
                                <option value="website">Website</option>
                                <option value="walk_in">Walk-in</option>
                                <option value="phone">Phone Call</option>
                                <option value="referral">Referral</option>
                                <option value="social_media">Social Media</option>
                                <option value="advertisement">Advertisement</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Priority Level</label>
                            <select
                                className="form-input"
                                value={formData.priority}
                                onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent / Critical</option>
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

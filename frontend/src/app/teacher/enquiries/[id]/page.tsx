'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { 
    Phone, Clock, Calendar, MessageSquare, Target, CheckCircle, 
    User, Mail, MapPin, Info, ArrowRight, Plus
} from 'lucide-react';

export default function TeacherEnquiryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [enquiry, setEnquiry] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        fetchEnquiryDetail();
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, [params.id]);

    const fetchEnquiryDetail = async () => {
        try {
            const res = await api.get(`/enquiries/${params.id}`);
            setEnquiry(res.data.data);
        } catch (error) {
            console.error('Error fetching enquiry detail:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        new: { color: '#3B82F6', bg: '#DBEAFE', label: 'New' },
        contacted: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Contacted' },
        demo_scheduled: { color: '#F59E0B', bg: '#FEF3C7', label: 'Demo Scheduled' },
        demo_completed: { color: '#F97316', bg: '#FFEDD5', label: 'Demo Completed' },
        enrolled: { color: '#10B981', bg: '#D1FAE5', label: 'Enrolled' },
        not_interested: { color: '#6B7280', bg: '#F3F4F6', label: 'Not Interested' },
        lost: { color: '#EF4444', bg: '#FEE2E2', label: 'Lost' },
    };

    if (isLoading) {
        return (
            <FormPageLayout
                title="Loading Enquiry..."
                backHref="/teacher/enquiries"
                requiredRole="teacher"
                maxWidth="1000px"
            >
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            </FormPageLayout>
        );
    }

    if (!enquiry) {
        return (
            <FormPageLayout
                title="Enquiry Not Found"
                backHref="/teacher/enquiries"
                requiredRole="teacher"
            >
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <Info size={48} color="var(--text-tertiary)" />
                    <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>The requested enquiry could not be found.</p>
                </div>
            </FormPageLayout>
        );
    }

    const sc = statusConfig[enquiry.status] || statusConfig.new;

    return (
        <FormPageLayout
            title={enquiry.student_name}
            subtitle={`Enquiry ${enquiry.enquiry_number} • ${sc.label}`}
            backHref="/teacher/enquiries"
            requiredRole="teacher"
            maxWidth="1000px"
            icon={<User size={20} />}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Activity Timeline */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div className="form-section-title" style={{ marginBottom: 0 }}>Activity Timeline</div>
                            <button 
                                className="btn-secondary btn-sm"
                                onClick={() => router.push(`/teacher/enquiries/${enquiry.id}/remark`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Plus size={14} /> Add Remark
                            </button>
                        </div>
                        
                        {enquiry.remarks?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {enquiry.remarks.map((remark: any, idx: number) => (
                                    <div key={remark.id} style={{
                                        display: 'flex', gap: '16px', padding: '16px 0',
                                        borderBottom: idx < enquiry.remarks.length - 1 ? '1px solid var(--border-primary)' : 'none',
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--info-light)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <MessageSquare size={14} color="var(--info)" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{remark.remark}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                                    {new Date(remark.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {remark.remark_type && (
                                                    <span style={{ 
                                                        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                        color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px'
                                                    }}>
                                                        {remark.remark_type.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '12px' }}>
                                <MessageSquare size={32} color="#A1A5B7" style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <p style={{ color: '#A1A5B7', fontSize: '14px' }}>No activity recorded yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Demo Classes */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div className="form-section-title" style={{ marginBottom: 0 }}>Demo Classes</div>
                            <button 
                                className="btn-secondary btn-sm"
                                onClick={() => router.push(`/teacher/enquiries/${enquiry.id}/schedule-demo`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Calendar size={14} /> Schedule Demo
                            </button>
                        </div>

                        {enquiry.demos?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {enquiry.demos.map((demo: any) => (
                                    <div key={demo.id} style={{
                                        padding: '16px', borderRadius: '12px',
                                        border: '1px solid var(--border-primary)',
                                        background: 'white',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>Demo #{demo.demo_count}</span>
                                            <span className={`badge ${demo.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                                                {demo.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={14} /> {demo.demo_date}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} /> {demo.demo_time}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Target size={14} /> {demo.subject} • {demo.topic}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '12px' }}>
                                <Target size={32} color="#A1A5B7" style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <p style={{ color: '#A1A5B7', fontSize: '14px' }}>No demo classes scheduled.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-section" style={{ padding: '20px' }}>
                        <div className="form-section-title" style={{ fontSize: '14px' }}>Student Profile</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase' }}>Phone Number</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{enquiry.phone}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{enquiry.email || 'N/A'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Target size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase' }}>Interested Course</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{enquiry.interested_course}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase' }}>Parent Name</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{enquiry.parent_name}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: '20px', paddingTop: '20px' }}>
                            <label className="form-label">Assign To Teacher / Staff</label>
                            <select
                                className="form-input"
                                style={{ padding: '8px 12px', fontSize: '13px' }}
                                value={enquiry.assigned_to || ''}
                                onChange={async (e) => {
                                    const newAssignee = e.target.value;
                                    try {
                                        await api.put(`/enquiries/${enquiry.id}`, { assigned_to: newAssignee || null });
                                        fetchEnquiryDetail();
                                    } catch (err) {
                                        console.error("Failed to reassign user", err);
                                    }
                                }}
                            >
                                <option value="">-- Unassigned --</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.user_id}>{t.first_name} {t.last_name} ({t.EMP_ID})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section" style={{ padding: '20px', background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', border: 'none' }}>
                        <h4 style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Convert to Enrollment</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '20px', lineHeight: 1.5 }}>
                            If the student has completed their demo and is ready to join, proceed with full enrollment.
                        </p>
                        <button 
                            className="btn-submit" 
                            style={{ width: '100%', background: 'white', color: '#1A1D3B' }}
                            disabled={enquiry.status !== 'demo_completed'}
                        >
                            Complete Enrollment <ArrowRight size={14} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                </div>
            </div>
        </FormPageLayout>
    );
}

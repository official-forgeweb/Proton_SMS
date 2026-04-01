'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { 
    Phone, Clock, Calendar, MessageSquare, Target, CheckCircle, 
    User, Mail, Info, ArrowRight, Plus
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

    const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
        new: { color: '#3B82F6', bg: '#EFF6FF', label: 'New Lead', icon: <Target size={14} /> },
        contacted: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Contacted', icon: <Phone size={14} /> },
        demo_scheduled: { color: '#F59E0B', bg: '#FFFBEB', label: 'Demo Scheduled', icon: <Calendar size={14} /> },
        demo_completed: { color: '#F97316', bg: '#FFF7ED', label: 'Demo Done', icon: <CheckCircle size={14} /> },
        enrolled: { color: '#10B981', bg: '#ECFDF5', label: 'Enrolled', icon: <CheckCircle size={14} /> },
        not_interested: { color: '#6B7280', bg: '#F9FAFB', label: 'Closed', icon: <Info size={14} /> },
        lost: { color: '#EF4444', bg: '#FEF2F2', label: 'Lost', icon: <Info size={14} /> },
    };

    if (isLoading) {
        return (
            <FormPageLayout
                title="Loading Enquiry..."
                backHref="/teacher/enquiries"
                requiredRole="teacher"
                maxWidth="1100px"
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
                    <Info size={48} color="#A1A5B7" />
                    <p style={{ marginTop: '16px', color: '#5E6278' }}>The requested enquiry could not be found.</p>
                </div>
            </FormPageLayout>
        );
    }

    const sc = statusConfig[enquiry.status] || statusConfig.new;
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(enquiry.student_name)}&background=F1F2F7&color=1A1D3B&bold=true&rounded=true`;

    return (
        <FormPageLayout
            title={enquiry.student_name}
            subtitle={`Enquiry ${enquiry.enquiry_number}`}
            backHref="/teacher/enquiries"
            backLabel="All Enquiries"
            requiredRole="teacher"
            maxWidth="1100px"
            icon={<User size={24} strokeWidth={2.5} />}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Activity Feed */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <div className="form-section-title" style={{ marginBottom: 0 }}>
                                <MessageSquare size={18} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                                Performance & Activity
                            </div>
                            <button 
                                onClick={() => router.push(`/teacher/enquiries/${enquiry.id}/remark`)}
                                style={{
                                    padding: '8px 16px', borderRadius: '10px', background: '#F1F2F7', border: 'none',
                                    color: '#1A1D3B', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                }}
                            >
                                <Plus size={14} strokeWidth={3} /> Post Remark
                            </button>
                        </div>
                        
                        {enquiry.remarks?.length > 0 ? (
                            <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                {/* Timeline Line */}
                                <div style={{ 
                                    position: 'absolute', left: '11px', top: '10px', bottom: '10px', 
                                    width: '2px', background: '#F1F2F7', borderRadius: '1px' 
                                }} />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {enquiry.remarks.map((remark: any, idx: number) => (
                                        <div key={remark.id} style={{ position: 'relative' }}>
                                            {/* Timeline Dot */}
                                            <div style={{ 
                                                position: 'absolute', left: '-26px', top: '4px',
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                background: idx === 0 ? '#E53935' : '#CBD5E1',
                                                border: '2px solid white', boxShadow: '0 0 0 4px rgba(0,0,0,0.02)'
                                            }} />
                                            
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '12px', color: '#1A1D3B', fontWeight: 800 }}>
                                                        {new Date(remark.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>
                                                        {new Date(remark.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {remark.remark_type && (
                                                        <span style={{ 
                                                            fontSize: '10px', padding: '2px 8px', borderRadius: '6px', 
                                                            background: '#F1F2F7', color: '#5E6278', fontWeight: 700, textTransform: 'uppercase'
                                                        }}>
                                                            {remark.remark_type.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ 
                                                    background: 'white', padding: '16px', borderRadius: '16px',
                                                    border: idx === 0 ? '1.5px solid #F1F1F7' : '1px solid #F1F2F7',
                                                    boxShadow: idx === 0 ? '0 4px 12px rgba(0,0,0,0.02)' : 'none',
                                                    fontSize: '14px', color: '#5E6278', lineHeight: 1.6
                                                }}>
                                                    {remark.remark}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '60px 40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '24px' }}>
                                <MessageSquare size={40} color="#CBD5E1" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ color: '#A1A5B7', fontSize: '14px', fontWeight: 500 }}>No remarks or activities recorded yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Demos Section */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div className="form-section-title" style={{ marginBottom: 0 }}>
                                <Calendar size={18} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                                Demo History
                            </div>
                            <button 
                                onClick={() => router.push(`/teacher/enquiries/${enquiry.id}/schedule-demo`)}
                                style={{
                                    padding: '10px 18px', borderRadius: '12px', background: '#1A1D3B', border: 'none',
                                    color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(26,29,59,0.2)'
                                }}
                            >
                                <Calendar size={14} strokeWidth={3} /> Schedule Demo
                            </button>
                        </div>

                        {enquiry.demos?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {enquiry.demos.map((demo: any) => (
                                    <div key={demo.id} style={{
                                        padding: '24px', borderRadius: '20px', background: '#FFFFFF',
                                        border: '1px solid #F1F2F7', transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Demo Round {demo.demo_count || '1'}
                                            </span>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800,
                                                background: demo.status === 'completed' ? '#ECFDF5' : '#EFF6FF',
                                                color: demo.status === 'completed' ? '#10B981' : '#3B82F6',
                                                textTransform: 'uppercase'
                                            }}>
                                                {demo.status}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginBottom: '12px' }}>{demo.subject} • {demo.topic}</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5E6278', fontSize: '13px' }}>
                                                <Calendar size={14} color="#A1A5B7" /> {new Date(demo.demo_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5E6278', fontSize: '13px' }}>
                                                <Clock size={14} color="#A1A5B7" /> {demo.demo_time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '60px 40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '24px' }}>
                                <Target size={40} color="#CBD5E1" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ color: '#A1A5B7', fontSize: '14px', fontWeight: 500 }}>No demo classes have been scheduled yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Personal Profile */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-section shadow-sm" style={{ padding: '28px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <img src={avatarUrl} alt="Student" style={{ width: '80px', height: '80px', borderRadius: '24px', marginBottom: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }} />
                            <div style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                padding: '4px 12px', borderRadius: '50px', background: sc.bg, color: sc.color, 
                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'
                            }}>
                                {sc.icon} {sc.label}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '10px', color: '#A1A5B7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Primary Contact</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A1D3B', fontWeight: 700, fontSize: '14px' }}>
                                    <Phone size={14} color="#E53935" /> {enquiry.phone}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', color: '#A1A5B7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Email Address</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A1D3B', fontWeight: 700, fontSize: '14px' }}>
                                    <Mail size={14} color="#3B82F6" /> {enquiry.email || 'No email provided'}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', color: '#A1A5B7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Course Interest</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A1D3B', fontWeight: 700, fontSize: '14px' }}>
                                    <Target size={14} color="#8B5CF6" /> {enquiry.interested_course}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', color: '#A1A5B7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Parent / Guardian</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A1D3B', fontWeight: 700, fontSize: '14px' }}>
                                    <User size={14} color="#10B981" /> {enquiry.parent_name}
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1.5px solid #F1F2F7', marginTop: '28px', paddingTop: '28px' }}>
                            <label className="form-label" style={{ fontSize: '10px' }}>Assigned Consultant</label>
                            <select
                                className="form-input"
                                style={{ padding: '10px 14px', fontSize: '13px', background: '#F4F5F9', border: '1px solid #E2E8F0' }}
                                value={enquiry.assigned_to || ''}
                                onChange={async (e) => {
                                    const newAssignee = e.target.value;
                                    try {
                                        await api.put(`/enquiries/${enquiry.id}`, { assigned_to: newAssignee || null });
                                        fetchEnquiryDetail();
                                    } catch (err) {
                                        console.error("Failed to reassign", err);
                                    }
                                }}
                            >
                                <option value="">Select Staff...</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.user_id}>{t.first_name} {t.last_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section" style={{ 
                        padding: '28px', background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                        border: 'none', position: 'relative', overflow: 'hidden' 
                    }}>
                        {/* Decorative circle */}
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
                        
                        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>Next Steps</h4>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
                            Ready to convert this lead? Proceed with full enrollment once the demo is completed.
                        </p>
                        <button 
                            className="btn-submit" 
                            style={{ 
                                width: '100%', background: 'white', color: '#1A1D3B', 
                                border: 'none', fontSize: '13px', fontWeight: 900,
                                opacity: enquiry.status !== 'demo_completed' ? 0.4 : 1
                            }}
                            disabled={enquiry.status !== 'demo_completed'}
                        >
                            ENROLL STUDENT <ArrowRight size={14} strokeWidth={3} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                </div>
            </div>
        </FormPageLayout>
    );
}

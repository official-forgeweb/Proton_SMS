'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Phone, Mail, User, MapPin, Target, MessageSquare,
    Calendar, Clock, CheckCircle, AlertTriangle, X,
    ArrowLeft, Edit, Trash2, Plus, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function EnquiryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [enquiry, setEnquiry] = useState<any>(null);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchEnquiryDetail();
            api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
        }
    }, [params.id]);

    const fetchEnquiryDetail = async () => {
        try {
            const res = await api.get(`/enquiries/${params.id}`);
            setEnquiry(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (status: string) => {
        try {
            await api.put(`/enquiries/${params.id}`, { status });
            fetchEnquiryDetail();
        } catch (error) {
            console.error(error);
        }
    };

    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        new: { color: '#3B82F6', bg: '#DBEAFE', label: 'New Lead' },
        contacted: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Contacted' },
        demo_scheduled: { color: '#F59E0B', bg: '#FEF3C7', label: 'Demo Scheduled' },
        demo_completed: { color: '#F97316', bg: '#FFEDD5', label: 'Demo Completed' },
        enrolled: { color: '#10B981', bg: '#D1FAE5', label: 'Enrolled' },
        not_interested: { color: '#6B7280', bg: '#F3F4F6', label: 'Not Interested' },
        lost: { color: '#EF4444', bg: '#FEE2E2', label: 'Lost' },
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading enquiry details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!enquiry) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', color: '#1A1D3B' }}>Enquiry not found</h2>
                    <Link href="/admin/enquiries" style={{ color: '#E53935', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>Back to Enquiries</Link>
                </div>
            </DashboardLayout>
        );
    }

    const sc = statusConfig[enquiry.status] || statusConfig.new;

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '40px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => router.push('/admin/enquiries')} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1A1D3B' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#A1A5B7', fontWeight: 600, letterSpacing: '0.05em' }}>
                                    {enquiry.enquiry_number}
                                </span>
                                <span style={{ padding: '4px 12px', borderRadius: '50px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {sc.label}
                                </span>
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{enquiry.student_name}</h1>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Edit size={16} /> Edit
                        </button>
                        <button style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Plus size={16} /> Enroll Now
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    {/* Main Content */}
                    <div>
                        {/* Profile Info */}
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #F0F0F5', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={20} color="#E53935" /> Personal Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Contact Details</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Phone size={16} color="#1A1D3B" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>{enquiry.phone}</div>
                                                <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>Mobile</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Mail size={16} color="#1A1D3B" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>{enquiry.email || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>Email</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Parent Details</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>{enquiry.parent_name}</div>
                                            <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>Guardian Name</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B' }}>{enquiry.parent_phone}</div>
                                            <div style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>Parent Contact</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: '#F0F0F5', margin: '32px 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Interested Course</label>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#E53935' }}>{enquiry.interested_course}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Current Class</label>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>{enquiry.current_class || 'N/A'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Source</label>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', textTransform: 'capitalize' }}>{enquiry.source?.replace('_', ' ')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #F0F0F5', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Clock size={20} color="#E53935" /> Activity Timeline
                                </h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => router.push(`/admin/enquiries/${enquiry.id}/remark`)} style={{ padding: '8px 16px', background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MessageSquare size={14} /> Add Remark
                                    </button>
                                    <button onClick={() => router.push(`/admin/enquiries/${enquiry.id}/schedule-demo`)} style={{ padding: '8px 16px', background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Target size={14} /> Schedule Demo
                                    </button>
                                </div>
                            </div>

                            {enquiry.remarks?.length > 0 ? (
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '17px', top: '0', bottom: '0', width: '2px', background: '#F0F0F5' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {enquiry.remarks.map((remark: any, idx: number) => (
                                            <div key={remark.id} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: '2px solid #E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <MessageSquare size={14} color="#E53935" />
                                                </div>
                                                <div style={{ padding: '16px 20px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0', flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{remark.remark_type?.replace('_', ' ')}</span>
                                                        <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600 }}>{new Date(remark.created_at).toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <p style={{ fontSize: '14px', color: '#1A1D3B', lineHeight: 1.6, margin: 0 }}>{remark.remark}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '20px', border: '1px dashed #E2E8F0' }}>
                                    <p style={{ color: '#A1A5B7', fontSize: '14px', fontWeight: 600 }}>No activity logged yet.</p>
                                </div>
                            )}

                            {enquiry.demos?.length > 0 && (
                                <div style={{ marginTop: '40px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>Demo History</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {enquiry.demos.map((demo: any) => (
                                            <div key={demo.id} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #F0F0F5', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{demo.subject} - {demo.topic || 'General Demo'}</div>
                                                    <div style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px' }}>{demo.demo_date} at {demo.demo_time} &bull; {demo.teacher_name}</div>
                                                </div>
                                                <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: demo.status === 'completed' ? '#ECFDF5' : '#FFFBEB', color: demo.status === 'completed' ? '#059669' : '#D97706' }}>
                                                    {demo.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Assignment */}
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #F0F0F5', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>Account Ownership</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Assigned staff</label>
                                <select
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8F9FD', fontSize: '13px', outline: 'none' }}
                                    value={enquiry.assigned_to || ''}
                                    onChange={async (e) => {
                                        try {
                                            await api.put(`/enquiries/${enquiry.id}`, { assigned_to: e.target.value || null });
                                            fetchEnquiryDetail();
                                        } catch (err) { console.error(err); }
                                    }}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {teachers.map(t => <option key={t.id} value={t.user_id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                            </div>
                            <div style={{ background: '#F8F9FD', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 700, marginBottom: '4px' }}>Lead priority</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: enquiry.priority === 'urgent' ? '#EF4444' : enquiry.priority === 'high' ? '#F97316' : '#F59E0B' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase' }}>{enquiry.priority} Priority</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Quick Actions */}
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #F0F0F5', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>Update Status</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['contacted', 'not_interested', 'lost'].map(status => {
                                    const config = statusConfig[status];
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(status)}
                                            style={{
                                                padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                                background: enquiry.status === status ? config.bg : 'white',
                                                color: enquiry.status === status ? config.color : '#5E6278',
                                                fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {config.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

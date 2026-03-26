'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    Search, Plus, Phone, Clock, Calendar, ChevronRight, X,
    MessageSquare, User, Target, CheckCircle, AlertTriangle,
    Filter, Eye, ArrowRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EnquiriesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRemarkModal, setShowRemarkModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        fetchEnquiries();
        fetchStats();
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, [search, statusFilter]);

    const fetchEnquiries = async () => {
        try {
            const params: any = {};
            if (user?.id) params.assigned_to = user.id;
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/enquiries', { params });
            setEnquiries(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/enquiries/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEnquiryDetail = async (id: string) => {
        try {
            const res = await api.get(`/enquiries/${id}`);
            setSelectedEnquiry(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const updateStatus = async (id: string, status: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/enquiries/${id}`, { status });
            fetchEnquiries();
            fetchStats();
        } catch (error) {
            console.error(error);
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

    const priorityConfig: Record<string, { color: string }> = {
        urgent: { color: '#EF4444' },
        high: { color: '#F97316' },
        medium: { color: '#F59E0B' },
        low: { color: '#10B981' },
    };

    return (
        <PermissionGuard permissionKey="enquiries">
            <DashboardLayout requiredRole="teacher">
                <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Enquiry Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        {stats?.total || 0} total enquiries • {stats?.conversion_rate || 0}% conversion
                    </p>
                </div>

            </div>

            <div className="page-body">
                {/* Stats */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                            style={{
                                padding: '10px 18px', borderRadius: 'var(--radius-full)',
                                background: statusFilter === key ? config.color : config.bg,
                                color: statusFilter === key ? 'white' : config.color,
                                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                                whiteSpace: 'nowrap', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            {config.label}
                            <span style={{
                                background: statusFilter === key ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                                padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                            }}>
                                {stats?.by_status?.[key] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                    <Search size={16} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                    }} />
                    <input
                        className="input-field"
                        placeholder="Search enquiries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '38px' }}
                    />
                </div>

                {/* Enquiry Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '16px' }} />)
                    ) : enquiries.length === 0 ? (
                        <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
                            <Phone size={48} />
                            <h3>No Enquiries Found</h3>
                            <p>Start by creating a new enquiry or adjust your filters.</p>
                        </div>
                    ) : (
                        enquiries.map((enq, idx) => {
                            const sc = statusConfig[enq.status] || statusConfig.new;
                            const pc = priorityConfig[enq.priority] || priorityConfig.medium;
                            return (
                                <div
                                    key={enq.id}
                                    className="card hover-lift animate-fade-in"
                                    style={{ cursor: 'pointer', animationDelay: `${idx * 50}ms`, padding: '20px' }}
                                    onClick={() => fetchEnquiryDetail(enq.id)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{
                                                fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)',
                                                fontWeight: 600,
                                            }}>
                                                {enq.enquiry_number}
                                            </span>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{enq.student_name}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%', background: pc.color,
                                            }} />
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                                                background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 600,
                                            }}>
                                                {sc.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Phone size={13} /> {enq.phone}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Target size={13} /> {enq.interested_course}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={13} /> {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'contacted', e)}>
                                            Interested
                                        </button>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'new', e)}>
                                            Pending
                                        </button>
                                        <button className="btn btn-error btn-sm" style={{ flex: 1, padding: '4px', fontSize: '12px' }} onClick={(e) => updateStatus(enq.id, 'not_interested', e)}>
                                            Not Interested
                                        </button>
                                    </div>

                                    {enq.assigned_teacher_name && (
                                        <div style={{
                                            marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                Assigned: <strong style={{ color: 'var(--text-secondary)' }}>{enq.assigned_teacher_name}</strong>
                                            </span>
                                            <ChevronRight size={14} color="var(--text-tertiary)" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Enquiry Detail Drawer */}
            {selectedEnquiry && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedEnquiry(null)}>
                    <div style={{
                        position: 'fixed', right: 0, top: 0, bottom: 0, width: '520px',
                        background: 'var(--bg-primary)', boxShadow: 'var(--shadow-xl)',
                        overflowY: 'auto', animation: 'slideInRight 0.3s ease',
                        padding: '28px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                    {selectedEnquiry.enquiry_number}
                                </span>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{selectedEnquiry.student_name}</h2>
                            </div>
                            <button onClick={() => setSelectedEnquiry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{
                                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                                background: statusConfig[selectedEnquiry.status]?.bg || '#F3F4F6',
                                color: statusConfig[selectedEnquiry.status]?.color || '#6B7280',
                                fontSize: '13px', fontWeight: 600,
                            }}>
                                {statusConfig[selectedEnquiry.status]?.label || selectedEnquiry.status}
                            </span>
                        </div>

                        {/* Info */}
                        <div style={{
                            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                            padding: '16px', marginBottom: '20px',
                        }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                                Student Information
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-tertiary)' }}>Phone:</span>
                                <span>{selectedEnquiry.phone}</span>
                                <span style={{ color: 'var(--text-tertiary)' }}>Course:</span>
                                <span>{selectedEnquiry.interested_course}</span>
                                <span style={{ color: 'var(--text-tertiary)' }}>Source:</span>
                                <span>{selectedEnquiry.source?.replace('_', ' ')}</span>
                                <span style={{ color: 'var(--text-tertiary)' }}>Parent:</span>
                                <span>{selectedEnquiry.parent_name}</span>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Assign To Teacher / Staff</label>
                                <select
                                    className="input-field"
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    value={selectedEnquiry.assigned_to || ''}
                                    onChange={async (e) => {
                                        const newAssignee = e.target.value;
                                        try {
                                            await api.put(`/enquiries/${selectedEnquiry.id}`, { assigned_to: newAssignee || null });
                                            fetchEnquiryDetail(selectedEnquiry.id);
                                            fetchEnquiries(); // re-fetch the list behind the modal too
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

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowRemarkModal(true)}>
                                <MessageSquare size={14} /> Add Remark
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowDemoModal(true)}>
                                <Target size={14} /> Schedule Demo
                            </button>
                            {selectedEnquiry.status === 'demo_completed' && (
                                <button className="btn btn-success btn-sm">
                                    <CheckCircle size={14} /> Enroll Student
                                </button>
                            )}
                        </div>

                        {/* Timeline */}
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Activity Timeline</h4>
                        {selectedEnquiry.remarks?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {selectedEnquiry.remarks.map((remark: any, idx: number) => (
                                    <div key={remark.id} style={{
                                        display: 'flex', gap: '12px', padding: '12px 0',
                                        borderBottom: idx < selectedEnquiry.remarks.length - 1 ? '1px solid var(--border-primary)' : 'none',
                                    }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', background: 'var(--info-light)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px',
                                        }}>
                                            <MessageSquare size={12} color="var(--info)" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{remark.remark}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                {new Date(remark.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                {remark.remark_type && ` • ${remark.remark_type.replace('_', ' ')}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                                No activity yet
                            </p>
                        )}

                        {/* Demo Classes */}
                        {selectedEnquiry.demos?.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '24px 0 12px' }}>Demo Classes</h4>
                                {selectedEnquiry.demos.map((demo: any) => (
                                    <div key={demo.id} style={{
                                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)', marginBottom: '8px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600 }}>Demo #{demo.demo_count}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                {demo.demo_date} at {demo.demo_time}
                                            </p>
                                        </div>
                                        <span className={`badge ${demo.status === 'completed' ? 'badge-success' : demo.status === 'scheduled' ? 'badge-info' : 'badge-warning'}`}>
                                            {demo.status}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Add Remark Modal */}
            {showRemarkModal && selectedEnquiry && (
                <RemarkModal
                    enquiryId={selectedEnquiry.id}
                    onClose={() => setShowRemarkModal(false)}
                    onSuccess={() => { setShowRemarkModal(false); fetchEnquiryDetail(selectedEnquiry.id); }}
                />
            )}

            {/* Schedule Demo Modal */}
            {showDemoModal && selectedEnquiry && (
                <DemoModal
                    enquiryId={selectedEnquiry.id}
                    onClose={() => setShowDemoModal(false)}
                    onSuccess={() => { setShowDemoModal(false); fetchEnquiryDetail(selectedEnquiry.id); fetchEnquiries(); }}
                />
            )}
        </DashboardLayout>
        </PermissionGuard>
    );
}

function RemarkModal({ enquiryId, onClose, onSuccess }: any) {
    const [remark, setRemark] = useState('');
    const [remarkType, setRemarkType] = useState('call');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!remark.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${enquiryId}/remarks`, { remark, remark_type: remarkType });
            onSuccess();
        } catch { } finally { setIsSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 1100 }}>
            <div className="modal">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Add Remark</h3>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label>Type</label>
                    <select className="input-field" value={remarkType} onChange={(e) => setRemarkType(e.target.value)}>
                        <option value="call">Phone Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="input-group" style={{ marginBottom: '20px' }}>
                    <label>Remark *</label>
                    <textarea className="input-field" rows={4} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Enter your remark..." style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Remark'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DemoModal({ enquiryId, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({ demo_date: '', demo_time: '', subject: '', topic: '', class_id: '', teacher_id: '' });
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.post(`/enquiries/${enquiryId}/schedule-demo`, formData);
            onSuccess();
        } catch { } finally { setIsSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 1100 }}>
            <div className="modal">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Schedule Demo Class</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group"><label>Date *</label><DatePicker showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" required selected={formData.demo_date ? new Date(formData.demo_date) : null} onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_date: date ? date.toISOString().split('T')[0] : '' }))} dateFormat="MMMM d, yyyy" placeholderText="Select date" /></div>
                    <div className="input-group"><label>Time *</label><DatePicker required selected={formData.demo_time ? new Date(`1970-01-01T${formData.demo_time}:00`) : null} onChange={(date: Date | null) => setFormData((p: any) => ({ ...p, demo_time: date ? date.toTimeString().slice(0, 5) : '' }))} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa" placeholderText="Select time" /></div>
                    <div className="input-group"><label>Subject</label><input className="input-field" value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="e.g., Mathematics" /></div>
                    <div className="input-group"><label>Topic</label><input className="input-field" value={formData.topic} onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))} placeholder="e.g., Quadratic Equations" /></div>
                    <div className="input-group"><label>Class</label>
                        <select className="input-field" value={formData.class_id} onChange={(e) => setFormData(p => ({ ...p, class_id: e.target.value }))}>
                            <option value="">Select class...</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                    </div>
                    <div className="input-group"><label>Teacher</label>
                        <select className="input-field" value={formData.teacher_id} onChange={(e) => setFormData(p => ({ ...p, teacher_id: e.target.value }))}>
                            <option value="">Select teacher...</option>
                            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Scheduling...' : 'Schedule Demo'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddEnquiryModal({ onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        student_name: '', phone: '', email: '', parent_name: '', parent_phone: '',
        current_class: '', interested_course: '', source: 'website', priority: 'medium',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/enquiries', formData);
            onSuccess();
        } catch { } finally { setIsSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>New Enquiry</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group"><label>Student Name *</label><input className="input-field" value={formData.student_name} onChange={(e) => setFormData(p => ({ ...p, student_name: e.target.value }))} /></div>
                    <div className="input-group"><label>Phone *</label><input className="input-field" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div className="input-group"><label>Email</label><input className="input-field" type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="input-group"><label>Current Class</label><input className="input-field" value={formData.current_class} onChange={(e) => setFormData(p => ({ ...p, current_class: e.target.value }))} /></div>
                    <div className="input-group"><label>Parent Name *</label><input className="input-field" value={formData.parent_name} onChange={(e) => setFormData(p => ({ ...p, parent_name: e.target.value }))} /></div>
                    <div className="input-group"><label>Parent Phone *</label><input className="input-field" value={formData.parent_phone} onChange={(e) => setFormData(p => ({ ...p, parent_phone: e.target.value }))} /></div>
                    <div className="input-group"><label>Interested Course *</label><input className="input-field" value={formData.interested_course} onChange={(e) => setFormData(p => ({ ...p, interested_course: e.target.value }))} /></div>
                    <div className="input-group"><label>Source</label>
                        <select className="input-field" value={formData.source} onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}>
                            <option value="website">Website</option><option value="walk_in">Walk-in</option><option value="phone">Phone</option>
                            <option value="referral">Referral</option><option value="social_media">Social Media</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Enquiry'}
                    </button>
                </div>
            </div>
        </div>
    );
}

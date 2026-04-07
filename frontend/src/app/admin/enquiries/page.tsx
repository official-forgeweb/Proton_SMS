'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Phone, Clock, Calendar, ChevronRight, X,
    MessageSquare, User, Target, CheckCircle, AlertTriangle,
    Filter, Eye, ArrowRight
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EnquiriesPage() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        fetchEnquiries();
        fetchStats();
        api.get('/teachers').then(res => setTeachers(res.data.data)).catch(console.error);
    }, [search, statusFilter]);

    const fetchEnquiries = async () => {
        try {
            const params: any = {};
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
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Enquiry Management</h1>
                    <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                        {stats?.total || 0} total enquiries &bull; {stats?.conversion_rate || 0}% conversion
                    </p>
                </div>
                <button onClick={() => router.push('/admin/enquiries/add')} style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229,57,53,0.3)' }}>
                    <Plus size={16} /> New Enquiry
                </button>
            </div>

            <div>
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
                <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '12px', padding: '10px 16px', maxWidth: '380px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', gap: '8px' }}>
                    <Search size={16} color="#A1A5B7" strokeWidth={2.5} />
                    <input
                        placeholder="Search enquiries..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: '#1A1D3B' }}
                    />
                </div>

                {/* Enquiries Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '60px', borderRadius: '12px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) : enquiries.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '60px', textAlign: 'center', border: '1px solid #F0F0F5', color: '#A1A5B7' }}>
                            <Phone size={48} style={{ marginBottom: '16px', opacity: 0.4, margin: '0 auto' }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Enquiries Found</h3>
                            <p style={{ fontSize: '13px' }}>Start by creating a new enquiry or adjust your filters.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '4px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px', minWidth: '900px' }}>
                                <thead>
                                    <tr>
                                        {['Enquiry', 'Contact', 'Course & Date', 'Status & Priority', 'Assigned', 'Actions'].map((h, i) => (
                                            <th key={i} style={{
                                                padding: '14px 16px', textAlign: 'left',
                                                color: '#A1A5B7', fontWeight: 700, fontSize: '11px',
                                                textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {enquiries.map((enq, idx) => {
                                        const sc = statusConfig[enq.status] || statusConfig.new;
                                        const pc = priorityConfig[enq.priority] || priorityConfig.medium;
                                        return (
                                            <tr 
                                                key={enq.id} 
                                                className="table-row-hover animate-fade-in" 
                                                style={{ cursor: 'pointer', animationDelay: `${(idx % 10) * 50}ms` }}
                                                onClick={() => router.push(`/admin/enquiries/${enq.id}`)}
                                            >
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{enq.student_name}</span>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#8F92A1', fontWeight: 600 }}>{enq.enquiry_number}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#A1A5B7" /> {enq.phone}</span>
                                                        {enq.parent_name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} color="#A1A5B7" /> {enq.parent_name}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1D3B' }}>{enq.interested_course || 'Unknown'}</span>
                                                        <span style={{ fontSize: '12px', color: '#A1A5B7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} />
                                                            {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pc.color, display: 'inline-block' }} title={`Priority: ${enq.priority}`} />
                                                            <span style={{ padding: '4px 10px', borderRadius: '50px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700 }}>
                                                                {sc.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    {enq.assigned_teacher_name ? (
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278', background: '#F8F9FD', padding: '4px 10px', borderRadius: '6px' }}>
                                                            {enq.assigned_teacher_name}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: '#A1A5B7', fontStyle: 'italic' }}>Unassigned</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <button 
                                                            onClick={(e) => updateStatus(enq.id, 'contacted', e)}
                                                            title="Mark as Contacted"
                                                            style={{
                                                                background: '#E8F5E9', border: 'none', cursor: 'pointer',
                                                                color: '#2E7D32', width: '32px', height: '32px', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#2E7D32'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#E8F5E9'; e.currentTarget.style.color = '#2E7D32'; }}
                                                        >
                                                            <CheckCircle size={15} strokeWidth={2.5} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => updateStatus(enq.id, 'not_interested', e)}
                                                            title="Mark as Not Interested"
                                                            style={{
                                                                background: '#FEE2E2', border: 'none', cursor: 'pointer',
                                                                color: '#EF4444', width: '32px', height: '32px', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                                                        >
                                                            <X size={15} strokeWidth={2.5} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/enquiries/${enq.id}`); }}
                                                            title="View Details"
                                                            style={{
                                                                background: '#F0F4FF', border: 'none', cursor: 'pointer',
                                                                color: '#3B82F6', width: '32px', height: '32px', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.color = '#3B82F6'; }}
                                                        >
                                                            <ArrowRight size={15} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            </div>


        </DashboardLayout>
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

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Calendar, Clock, Users, Download, Eye, Layers, Edit, Trash2, AlertCircle, Zap, CheckCircle2, Loader2, X, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const getSubjectStyles = (subject: string) => {
    const sub = (subject || '').toLowerCase();
    if (sub.includes('physics')) {
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#DBEAFE' };
    } else if (sub.includes('chemistry')) {
        return { bg: '#ECFDF5', color: '#047857', border: '#D1FAE5' };
    } else if (sub.includes('math')) {
        return { bg: '#F5F3FF', color: '#6D28D9', border: '#EDE9FE' };
    } else if (sub.includes('biology')) {
        return { bg: '#FFF1F2', color: '#BE123C', border: '#FFE4E6' };
    } else if (sub.includes('economics')) {
        return { bg: '#FFF7ED', color: '#C2410C', border: '#FFEDD5' };
    } else if (sub.includes('account')) {
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    } else if (sub.includes('english')) {
        return { bg: '#F0FDFA', color: '#0F766E', border: '#CCFBF1' };
    } else if (sub.includes('hindi')) {
        return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    } else if (sub.includes('science')) {
        return { bg: '#ECFEFF', color: '#0891B2', border: '#CFFAFE' };
    } else if (sub.includes('social')) {
        return { bg: '#FDF2F8', color: '#BE185D', border: '#FCE7F3' };
    } else if (sub.includes('computer') || sub.includes('prep') || sub.includes('competition')) {
        return { bg: '#F1F5F9', color: '#334155', border: '#E2E8F0' };
    }
    return { bg: '#F8F9FD', color: '#475569', border: '#E2E8F0' };
};

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Bulk Seed States & Payload
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isBulking, setIsBulking] = useState(false);
    const [bulkResult, setBulkResult] = useState<any>(null);

    const bulkClassesPayload = [
        { className: 'Class 12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts'] },
        { className: 'Class 12 + Competition', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts', 'Competition Preparation'] },
        { className: 'Class 11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts'] },
        { className: 'Class 11 + Competition', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts', 'Competition Preparation'] },
        { className: 'Class 10', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
        { className: 'Class 10 Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] },
        { className: 'Class 9', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
        { className: 'Class 9 Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] },
        { className: 'Class 8 CBSE', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
        { className: 'Class 8 CBSE Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] }
    ];

    const handleBulkCreateClasses = async () => {
        setIsBulking(true);
        try {
            const res = await api.post('/classes/bulk-create', { classes: bulkClassesPayload }, { timeout: 120000 });
            if (res.data.success) {
                setBulkResult(res.data.summary);
                toast.success(`Successfully processed bulk seeding!`);
                fetchClasses();
            } else {
                toast.error(res.data.message || 'Failed to seed classes.');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to bulk import classes.');
        } finally {
            setIsBulking(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/classes/${deleteTarget.id}`);
            toast.success(`Class "${deleteTarget.class_name}" deleted successfully.`);
            setDeleteTarget(null);
            fetchClasses();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete class.');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [h, m] = time.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${m} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    useEffect(() => { fetchClasses(); fetchTeachers(); }, []);

    const fetchTeachers = async () => {
        try { const res = await api.get('/teachers'); setTeachers(res.data.data); }
        catch (error) { console.error('Error fetching teachers:', error); }
    };



    const fetchClasses = async () => {
        try { const res = await api.get('/classes'); setClasses(res.data.data); }
        catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };



    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            
            }
        .table-row-hover {
            transition: all 0.2s ease;
        }
        .table-row-hover:hover {
            background: #F8F9FD;
            transform: scale(1.005);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .table-row-hover:hover td:first-child {
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
        }
        .table-row-hover:hover td:last-child {
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.15) 0px, transparent 50%);
        }
        
        .class-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 380px;
        }
        .class-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 35px rgba(26,29,59,0.08);
            border-color: rgba(229, 57, 53, 0.3);
        }
        .class-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #E53935 0%, #6366F1 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .class-card:hover::before {
            opacity: 1;
        }
        .view-switcher-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            border: 1px solid #E2E8F0;
            background: #FFFFFF;
            color: #64748B;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .view-switcher-btn:hover {
            background: #F8F9FD;
            color: #1A1D3B;
            border-color: #CBD5E1;
        }
        .view-switcher-btn.active {
            background: #1A1D3B;
            color: #FFFFFF;
            border-color: #1A1D3B;
            box-shadow: 0 4px 10px rgba(26,29,59,0.15);
        }

        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px;
            font-size: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%;
            font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus {
            border-color: #E53935;
        }
        .react-datepicker {
            font-family: 'Inter', sans-serif; border-radius: 16px; border: 1px solid #E2E8F0;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;
        }
        .react-datepicker__header { background-color: #F8F9FD; border-bottom: 1px solid #E2E8F0; padding-top: 12px; }
        .react-datepicker__day--selected, .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
            background-color: #E53935 !important; font-weight: bold;
        }
    `;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: customStyles}} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: '#E53935', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Layers size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Batch Management
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Classes & Batches</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* View Switcher Toggle */}
                        <div style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '14px', border: '1px solid #E2E8F0', gap: '4px' }}>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`view-switcher-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none' }}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} strokeWidth={2.5} />
                            </button>
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`view-switcher-btn ${viewMode === 'table' ? 'active' : ''}`}
                                style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none' }}
                                title="Table View"
                            >
                                <List size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        <button style={{
                            background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '12px 20px', fontSize: '14px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                            onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                        >
                            <Download size={16} strokeWidth={2.5} /> Export
                        </button>
                        <button
                            onClick={() => { setShowBulkModal(true); setBulkResult(null); }}
                            style={{
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '12px 20px', fontSize: '14px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(99,102,241,0.4)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(99,102,241,0.5)');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(99,102,241,0.4)');
                            }}
                        >
                            <Zap size={16} strokeWidth={2.5} fill="currentColor" /> Bulk Seed Classes
                        </button>
                        <button
                            onClick={() => router.push('/admin/classes/add')}
                            style={{
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '12px 24px', fontSize: '14px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(229,57,53,0.4)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(229,57,53,0.5)');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(229,57,53,0.4)');
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Create Class
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="animate-fade-in" style={{
                    borderRadius: '24px',
                    animationDelay: '100ms'
                }}>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', width: '100%' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '380px', borderRadius: '20px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#FFFFFF', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ width: '80px', height: '20px', background: '#E2E8F0', borderRadius: '6px' }} />
                                        <div style={{ width: '70px', height: '20px', background: '#E2E8F0', borderRadius: '6px' }} />
                                    </div>
                                    <div style={{ width: '60%', height: '24px', background: '#E2E8F0', borderRadius: '6px', marginTop: '10px' }} />
                                    <div style={{ width: '40%', height: '16px', background: '#E2E8F0', borderRadius: '6px' }} />
                                    <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9' }} />
                                    <div style={{ width: '100%', height: '40px', background: '#E2E8F0', borderRadius: '8px' }} />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {[1, 2, 3].map(j => (
                                            <div key={j} style={{ width: '60px', height: '24px', background: '#E2E8F0', borderRadius: '6px' }} />
                                        ))}
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1, height: '36px', background: '#E2E8F0', borderRadius: '10px' }} />
                                        <div style={{ width: '70px', height: '36px', background: '#E2E8F0', borderRadius: '10px' }} />
                                        <div style={{ width: '70px', height: '36px', background: '#E2E8F0', borderRadius: '10px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : classes.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.02)' }}>
                            <BookOpen size={56} style={{ display: 'block', margin: '0 auto 20px', color: '#A1A5B7', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Classes Found</h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>Create a new class to get started.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* GRID CARD LAYOUT */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', width: '100%' }}>
                            {classes.map((cls, idx) => {
                                const enrollPercent = Math.min(100, Math.round(((cls.current_students_count || 0) / (cls.max_students || 40)) * 100));
                                return (
                                    <div key={cls.id} className="class-card animate-fade-in" onClick={() => router.push(`/admin/classes/${cls.id}`)} style={{ cursor: 'pointer', animationDelay: `${idx * 50}ms` }}>
                                        <div>
                                            {/* Top Row: Code and Status */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                <span style={{ fontWeight: 700, color: '#E53935', fontFamily: 'monospace', fontSize: '11px', background: '#FFF0F1', padding: '4px 8px', borderRadius: '6px' }}>
                                                    {cls.class_code}
                                                </span>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    background: cls.status === 'ongoing' ? '#ECFDF5' : cls.status === 'upcoming' ? '#FEF3C7' : '#F8F9FD',
                                                    color: cls.status === 'ongoing' ? '#059669' : cls.status === 'upcoming' ? '#D97706' : '#8F92A1',
                                                }}>
                                                    {cls.status}
                                                </span>
                                            </div>

                                            {/* Class Name & Grade */}
                                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 4px 0', fontFamily: 'Poppins, sans-serif' }}>
                                                {cls.class_name}
                                            </h3>
                                            <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, margin: '0 0 16px 0' }}>
                                                {cls.grade_level}
                                            </p>

                                            {/* Divider */}
                                            <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0 0 16px 0' }} />

                                            {/* Schedule / Time slots */}
                                            {cls.schedule && cls.schedule.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#1A1D3B', fontWeight: 600 }}>
                                                        <Clock size={15} color="#A1A5B7" strokeWidth={2.5} />
                                                        <span>{formatTime(cls.schedule[0].time_start)} – {formatTime(cls.schedule[cls.schedule.length - 1].time_end)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>
                                                        <Calendar size={15} color="#A1A5B7" strokeWidth={2.5} />
                                                        <span>{cls.schedule.length} sessions per week</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#A1A5B7', fontWeight: 500, marginBottom: '16px', fontStyle: 'italic' }}>
                                                    <Clock size={15} color="#A1A5B7" strokeWidth={2.5} />
                                                    <span>No schedule timing set</span>
                                                </div>
                                            )}

                                            {/* Subject Badges */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                                                {cls.schedule && cls.schedule.length > 0 ? cls.schedule.map((s: any, sIdx: number) => {
                                                    const styles = getSubjectStyles(s.subject);
                                                    const teacherName = teachers.find(t => t.id === (s.teacher_id?._id || s.teacher_id))?.first_name || 'Unassigned';
                                                    return (
                                                        <span key={sIdx} title={`Teacher: ${teacherName}`} style={{
                                                            background: styles.bg,
                                                            color: styles.color,
                                                            border: `1px solid ${styles.border}`,
                                                            padding: '4px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: styles.color }}>
                                                                {s.subject?.[0]}
                                                            </span>
                                                            {s.subject}
                                                        </span>
                                                    );
                                                }) : (
                                                    <span style={{ fontSize: '12.5px', color: '#A1A5B7', fontStyle: 'italic' }}>No subjects added</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            {/* Capacity Visual Progress Bar */}
                                            <div style={{ marginBottom: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                                                    <span style={{ color: '#8F92A1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Users size={14} color="#E53935" strokeWidth={2.5} /> Students
                                                    </span>
                                                    <span style={{ color: '#1A1D3B', fontWeight: 800 }}>
                                                        {cls.current_students_count || 0} <span style={{ color: '#A1A5B7', fontWeight: 600 }}>/ {cls.max_students || 40}</span>
                                                    </span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${enrollPercent}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #E53935 0%, #FF8A80 100%)',
                                                        borderRadius: '4px',
                                                        transition: 'width 0.5s ease-out'
                                                    }} />
                                                </div>
                                            </div>

                                            {/* Action Buttons Row */}
                                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.push(`/admin/classes/${cls.id}`)}
                                                    style={{
                                                        flex: 1,
                                                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none',
                                                        borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(26,29,59,0.1)'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                                >
                                                    <Eye size={14} strokeWidth={2.5} /> View
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/classes/${cls.id}/edit`)}
                                                    style={{
                                                        background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                                                        borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#F8F9FD'; e.currentTarget.style.borderColor = '#1A1D3B'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                                >
                                                    <Edit size={14} strokeWidth={2.5} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(cls)}
                                                    style={{
                                                        background: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.15)',
                                                        borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                                                >
                                                    <Trash2 size={14} strokeWidth={2.5} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* TABLE LIST LAYOUT */
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', minWidth: '850px' }}>
                                <thead>
                                    <tr>
                                        {['Batch Info', 'Subjects / Teachers', 'Time Slots', 'Capacity', 'Status', 'Actions'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '16px 20px', textAlign: i === 5 ? 'right' : 'left',
                                                color: '#A1A5B7', fontWeight: 700, fontSize: '12px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls, idx) => (
                                        <tr key={cls.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/classes/${cls.id}`)}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B' }}>{cls.class_name}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 700, color: '#E53935', fontFamily: 'monospace', fontSize: '12px', background: '#FFF0F1', padding: '4px 8px', borderRadius: '6px' }}>
                                                            {cls.class_code}
                                                        </span>
                                                        <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>{cls.grade_level}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '380px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? cls.schedule.map((s: any, i: number) => {
                                                        const styles = getSubjectStyles(s.subject);
                                                        const teacherName = teachers.find(t => t.id === (s.teacher_id?._id || s.teacher_id))?.first_name || 'Unassigned';
                                                        return (
                                                            <div key={i} title={`Teacher: ${teacherName}`} style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                background: styles.bg,
                                                                color: styles.color,
                                                                border: `1px solid ${styles.border}`,
                                                                borderRadius: '8px',
                                                                padding: '4px 8px',
                                                                fontSize: '12.5px',
                                                                fontWeight: 700,
                                                                transition: 'all 0.2s'
                                                            }}>
                                                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: styles.color }}>
                                                                    {s.subject?.[0]}
                                                                </span>
                                                                <span>{s.subject}</span>
                                                                {teacherName !== 'Unassigned' && (
                                                                    <span style={{ fontSize: '10px', opacity: 0.7, background: 'rgba(0,0,0,0.04)', padding: '1px 4px', borderRadius: '4px' }}>
                                                                        {teacherName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }) : <span style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500, fontStyle: 'italic' }}>No schedule</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {cls.schedule && cls.schedule.length > 0 ? (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1A1D3B', fontWeight: 600 }}>
                                                                <Clock size={14} color="#A1A5B7" strokeWidth={2.5} /> {formatTime(cls.schedule[0].time_start)} – {formatTime(cls.schedule[cls.schedule.length - 1].time_end)}
                                                            </div>
                                                            <div style={{ color: '#8F92A1', fontWeight: 500 }}>{cls.schedule.length} sessions/wk</div>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8F9FD', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                    <Users size={16} color="#E53935" strokeWidth={2.5} />
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>{cls.current_students_count} <span style={{ color: '#A1A5B7', fontWeight: 600 }}>/ {cls.max_students}</span></span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                                    <span style={{
                                                        padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                        background: cls.status === 'ongoing' ? '#ECFDF5' : cls.status === 'upcoming' ? '#FEF3C7' : '#F8F9FD',
                                                        color: cls.status === 'ongoing' ? '#059669' : cls.status === 'upcoming' ? '#D97706' : '#8F92A1',
                                                        boxShadow: cls.status === 'ongoing' ? '0 2px 6px rgba(16,185,129,0.1)' : 'none'
                                                    }}>
                                                        {cls.status}
                                                    </span>
                                                    {cls.status === 'upcoming' && cls.start_date && (
                                                        <span style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                            <Calendar size={12} strokeWidth={2.5} /> {formatDate(cls.start_date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/classes/${cls.id}/edit`); }}
                                                    style={{
                                                        background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                                                        borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                                                >
                                                    <Edit size={14} strokeWidth={2.5} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/classes/${cls.id}`); }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none',
                                                        borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(26,29,59,0.2)'
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); }}
                                                >
                                                    <Eye size={14} strokeWidth={2.5} /> View
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(cls); }}
                                                    style={{
                                                        background: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.15)',
                                                        borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 700,
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                                                >
                                                    <Trash2 size={14} strokeWidth={2.5} /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,15,33,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFFFFF', width: '440px', maxWidth: '90vw', borderRadius: '24px', boxShadow: '0 20px 50px rgba(13,15,33,0.15)', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FEF2F2', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                                <AlertCircle size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Delete Class</h3>
                                <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>This action cannot be undone.</p>
                            </div>
                        </div>

                        <div style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Class Name</span>
                                <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{deleteTarget.class_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Code</span>
                                <span style={{ color: '#E53935', fontWeight: 700, fontFamily: 'monospace' }}>{deleteTarget.class_code}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Students</span>
                                <span style={{ color: '#1A1D3B', fontWeight: 700 }}>{deleteTarget.current_students_count || 0}</span>
                            </div>
                        </div>

                        {(deleteTarget.current_students_count > 0) && (
                            <div style={{ background: '#FFFBEB', border: '1px solid rgba(217, 119, 6, 0.2)', borderRadius: '12px', padding: '12px 16px', fontSize: '12.5px', color: '#B45309', fontWeight: 600, lineHeight: 1.5 }}>
                                ⚠️ This class has active students. Deleting it will automatically unassign them and cascade-delete all associated homework, schedules, test scores, and fee configurations.
                            </div>
                        )}

                        <p style={{ fontSize: '13.5px', color: '#475569', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                            Are you sure you want to permanently delete <strong>{deleteTarget.class_name}</strong>? All associated schedules and timetable entries will be removed.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClass}
                                disabled={isDeleting}
                                style={{
                                    background: '#EF4444', color: 'white', border: 'none', borderRadius: '12px',
                                    padding: '12px 22px', fontSize: '14px', fontWeight: 700,
                                    cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1,
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.background = '#DC2626'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#EF4444'; }}
                            >
                                <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Batches Modal */}
            {showBulkModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,15,33,0.5)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFFFFF', width: '600px', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '24px', boxShadow: '0 20px 50px rgba(13,15,33,0.2)', border: '1px solid rgba(255,255,255,0.8)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                        
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                    <Zap size={22} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Bulk Import Academic Batches</h3>
                                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Deploy standard class configurations in one click.</p>
                                </div>
                            </div>
                            {!isBulking && (
                                <button onClick={() => setShowBulkModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}>
                                    <X size={16} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        {/* Content States */}
                        {isBulking ? (
                            /* Loading Syncing View */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '24px' }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#6366F1', animation: 'spin 1s linear infinite' }} />
                                    <Zap size={32} style={{ position: 'absolute', color: '#6366F1' }} fill="currentColor" />
                                </div>
                                <style dangerouslySetInnerHTML={{__html: `
                                    @keyframes spin {
                                        to { transform: rotate(360deg); }
                                    }
                                `}} />
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 8px 0' }}>Atomic Transaction in Progress</h4>
                                    <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, maxWidth: '360px', lineHeight: 1.5, fontWeight: 500 }}>
                                        Analyzing subject indices, running deduplication validations, and building relation mappings safely in the database...
                                    </p>
                                </div>
                            </div>
                        ) : bulkResult ? (
                            /* Success Report View */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                                <div style={{ background: '#ECFDF5', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ background: '#10B981', color: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <CheckCircle2 size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', margin: '0 0 4px 0' }}>Transaction Completed Successfully</h4>
                                        <p style={{ fontSize: '13px', color: '#047857', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                                            The seed operation was atomic and transaction-safe. All requested structures are active.
                                        </p>
                                    </div>
                                </div>

                                {/* Report Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    <div style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</span>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>{bulkResult.created}</div>
                                    </div>
                                    <div style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped</span>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>{bulkResult.skipped}</div>
                                    </div>
                                    <div style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Processed</span>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#1A1D3B', marginTop: '4px' }}>{bulkResult.total}</div>
                                    </div>
                                </div>

                                {/* Details of skipping or creation */}
                                <div style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
                                    {bulkResult.classesCreated.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Created Classes ({bulkResult.classesCreated.length})</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {bulkResult.classesCreated.map((c: string, idx: number) => (
                                                    <span key={idx} style={{ background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)' }}>
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {bulkResult.classesSkipped.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Skipped (Already Existed) ({bulkResult.classesSkipped.length})</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {bulkResult.classesSkipped.map((c: string, idx: number) => (
                                                    <span key={idx} style={{ background: '#FFFBEB', color: '#D97706', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(217,119,6,0.1)' }}>
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button onClick={() => setShowBulkModal(false)} style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(26,29,59,0.2)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        Perfect, Let's Go!
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Default Prompt & Selection List */
                            <>
                                {/* Info Warning */}
                                <div style={{ background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ color: '#4F46E5', flexShrink: 0 }}>
                                        <AlertCircle size={20} />
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#3730A3', fontWeight: 600, lineHeight: 1.4 }}>
                                        Subject names are normalized automatically (e.g., <em>Math &rarr; Mathematics</em>). All items are generated in a single transactional query. Existing classes are skipped safely.
                                    </div>
                                </div>

                                {/* Target Batches Preview */}
                                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#F8F9FD' }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Batch Target List</span>
                                        <span style={{ background: '#E2E8F0', color: '#1A1D3B', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                                            {bulkClassesPayload.length} Batches
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        {bulkClassesPayload.map((batch, idx) => (
                                            <div key={idx} style={{ background: '#FFFFFF', padding: '16px', borderBottom: idx === bulkClassesPayload.length - 1 ? 'none' : '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#1A1D3B' }}>{batch.className}</span>
                                                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#E53935', background: '#FFF0F1', padding: '2px 6px', borderRadius: '6px' }}>
                                                        {batch.className.includes('12') ? 'Grade 12' : batch.className.includes('11') ? 'Grade 11' : batch.className.includes('10') ? 'Grade 10' : batch.className.includes('9') ? 'Grade 9' : batch.className.includes('8') ? 'Grade 8' : 'Secondary'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {batch.subjects.map((sub, sIdx) => (
                                                        <span key={sIdx} style={{ background: '#F8F9FD', border: '1px solid #E2E8F0', color: '#475569', fontSize: '11.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                                                            {sub}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => setShowBulkModal(false)}
                                        style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkCreateClasses}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white', border: 'none', borderRadius: '12px',
                                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s',
                                            boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <Zap size={14} fill="currentColor" /> Confirm & Seed
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}

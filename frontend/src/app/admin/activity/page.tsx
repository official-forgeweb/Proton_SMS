'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
    Clock, Search, ArrowLeft, ChevronDown, ChevronUp, 
    Calendar, Award, MessageSquare, LogIn, Laptop, Globe, User, ShieldAlert, CheckCircle, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';

export default function AdminActivityPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const fetchTeacherActivities = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page: currentPage.toString(),
                limit: '15'
            };
            if (filter !== 'all') {
                params.action_type = filter;
            }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const res = await api.get('/dashboard/admin/teacher-activities', { params });
            if (res.data.success) {
                setActivities(res.data.data.logs || []);
                setTotalPages(res.data.data.pagination.pages || 1);
                setTotalLogs(res.data.data.pagination.total || 0);
            }
        } catch (error) {
            console.error('Error fetching teacher activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1); // Reset page on filter change
    }, [filter, searchQuery]);

    useEffect(() => {
        fetchTeacherActivities();
    }, [currentPage, filter, searchQuery]);

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getActivityConfig = (type: string) => {
        switch (type) {
            case 'login': 
                return { icon: LogIn, bg: '#E0F2FE', color: '#0284C7', label: 'Teacher Login' };
            case 'attendance_mark': 
                return { icon: CheckCircle, bg: 'var(--success-light)', color: 'var(--success)', label: 'Attendance Roll Call' };
            case 'marks_upload': 
                return { icon: Award, bg: '#F5F3FF', color: '#7C3AED', label: 'Evaluation Graded' };
            case 'remarks_add': 
                return { icon: MessageSquare, bg: '#FFF3E0', color: '#F97316', label: 'Remark Authored' };
            case 'schedule_create': 
                return { icon: Calendar, bg: 'var(--success-light)', color: 'var(--success)', label: 'Schedule Created' };
            case 'schedule_update': 
                return { icon: Calendar, bg: '#FEF3C7', color: '#D97706', label: 'Schedule Updated' };
            case 'schedule_delete': 
                return { icon: Trash2, bg: 'var(--primary-light)', color: 'var(--primary)', label: 'Schedule Deleted' };
            default: 
                return { icon: Clock, bg: '#F4F5F9', color: '#5E6278', label: 'System Audit' };
        }
    };

    // Diff rendering parser
    const renderDiffs = (log: any) => {
        try {
            const parseJSON = (str: string | null) => {
                if (!str) return null;
                try {
                    return JSON.parse(str);
                } catch (e) {
                    return str;
                }
            };

            const prev = parseJSON(log.previous_value);
            const next = parseJSON(log.new_value);

            // 1. Double JSON update (Timetable Schedule updates)
            if (prev && typeof prev === 'object' && next && typeof next === 'object') {
                const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));
                
                const fieldLabels: Record<string, string> = {
                    subject: 'Subject Name',
                    date: 'Date Scheduled',
                    start_time: 'Start Time',
                    room: 'Room Code',
                    online_link: 'Meeting URL',
                    status: 'Session Status'
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Side-By-Side Property Changes</span>
                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-primary)', borderRadius: '12px', background: '#FFFFFF' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#FAFBFD', borderBottom: '1px solid var(--border-primary)' }}>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Property</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--primary)' }}>Previous Value</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--success)' }}>Updated Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {keys.map(k => {
                                        const pVal = prev[k] || 'N/A';
                                        const nVal = next[k] || 'N/A';
                                        const isChanged = pVal !== nVal;
                                        
                                        return (
                                            <tr key={k} style={{ borderBottom: '1px solid var(--border-primary)', background: isChanged ? '#FFFDF5' : 'transparent' }}>
                                                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1A1D3B' }}>{fieldLabels[k] || k}</td>
                                                <td style={{ padding: '10px 14px', textDecoration: isChanged ? 'line-through' : 'none', color: isChanged ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                    {pVal.toString()}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontWeight: isChanged ? 700 : 500, color: isChanged ? 'var(--success)' : 'var(--text-secondary)' }}>
                                                    {nVal.toString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }

            // 2. Only next exists (Single JSON payload - Timetable creation, Attendance marks, Exam marks uploads)
            if (!prev && next && typeof next === 'object') {
                if (next.present !== undefined) {
                    // Attendance statistics
                    return (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Present Count', val: next.present, color: 'var(--success)', bg: 'var(--success-light)' },
                                { label: 'Absent Count', val: next.absent, color: 'var(--primary)', bg: 'var(--primary-light)' },
                                { label: 'Late Registers', val: next.late, color: 'var(--warning)', bg: 'var(--warning-light)' },
                                { label: 'Total Checked', val: next.total, color: 'var(--info)', bg: 'var(--info-light)' }
                            ].map(m => (
                                <div key={m.label} style={{ flex: 1, minWidth: '110px', background: '#FFFFFF', padding: '12px', border: '1px solid var(--border-primary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 850, color: m.color }}>{m.val}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    );
                }

                if (next.total_students !== undefined) {
                    // Test results upload statistics
                    return (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Total Students', val: next.total_students, color: '#1A1D3B', bg: '#F4F5F9' },
                                { label: 'Graded Sheets', val: next.present_students, color: 'var(--success)', bg: 'var(--success-light)' },
                                { label: 'Subject Unit', val: next.subject || 'N/A', color: 'var(--info)', bg: 'var(--info-light)' }
                            ].map(m => (
                                <div key={m.label} style={{ flex: 1, minWidth: '120px', background: '#FFFFFF', padding: '12px', border: '1px solid var(--border-primary)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: m.color, textAlign: 'center' }}>{m.val}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    );
                }

                // General Schedule creation details
                return (
                    <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {Object.entries(next).map(([k, v]: any) => (
                                <div key={k}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>{k.replace('_', ' ')}</span>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', margin: '2px 0 0 0' }}>{v?.toString() || 'N/A'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 3. Only previous exists (Schedule deleted)
            if (prev && typeof prev === 'object' && !next) {
                return (
                    <div style={{ background: '#FFF5F5', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(229,57,53,0.1)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Deleted Record Properties</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {Object.entries(prev).map(([k, v]: any) => (
                                <div key={k}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>{k.replace('_', ' ')}</span>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', margin: '2px 0 0 0', textDecoration: 'line-through' }}>{v?.toString() || 'N/A'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 4. Raw text string (e.g. Added student remark, raw logins)
            if (log.new_value || log.previous_value) {
                return (
                    <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                        {log.previous_value && (
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Previous Data</span>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{log.previous_value}</p>
                            </div>
                        )}
                        {log.new_value && (
                            <div>
                                <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Updated Data Log</span>
                                <p style={{ fontSize: '13.5px', color: '#1A1D3B', fontWeight: 600, margin: '2px 0 0 0' }}>{log.new_value}</p>
                            </div>
                        )}
                    </div>
                );
            }

            return <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No additional audit metadata available.</span>;
        } catch (e) {
            return (
                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-primary)', fontSize: '12.5px' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Raw Log Value:</p>
                    <p style={{ color: '#1A1D3B', marginTop: '4px', fontFamily: 'monospace', fontSize: '12px', background: '#FAFAFC', padding: '8px', borderRadius: '6px' }}>
                        {log.new_value || log.previous_value || 'None'}
                    </p>
                </div>
            );
        }
    };

    const actionFilters = [
        { id: 'all', label: 'All Operations' },
        { id: 'attendance_mark', label: 'Attendance Roll' },
        { id: 'marks_upload', label: 'Exam Grading' },
        { id: 'schedule_create', label: 'Schedules Added' },
        { id: 'schedule_update', label: 'Schedules Edited' },
        { id: 'schedule_delete', label: 'Schedules Deleted' },
        { id: 'remarks_add', label: 'Remarks Authored' },
        { id: 'login', label: 'Teacher Logins' }
    ];

    return (
        <DashboardLayout requiredRole="admin">
            <div className="bg-mesh min-h-screen animate-fade-in" style={{ padding: '0 8px 32px 8px' }}>
                
                {/* Header title */}
                <div className="page-header animate-slide-up" style={{ padding: '24px 0 32px 0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={() => router.push('/admin')}
                        className="hover-lift"
                        style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: '#FFFFFF', border: '1px solid var(--border-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                Institutional Audit
                            </span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Teacher Operational Audits</h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                            Comprehensive, chronological security timeline audits of classroom operations, grading, and timetabling updates.
                        </p>
                    </div>
                </div>

                {/* Filter and search card bar */}
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: '24px', marginBottom: '28px', border: '1px solid rgba(229,57,53,0.06)' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search field */}
                        <div style={{ 
                            flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', 
                            background: '#FAFBFD', borderRadius: '14px', padding: '0 16px',
                            border: '1px solid var(--border-primary)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)'
                        }}>
                            <Search size={18} color="var(--text-tertiary)" />
                            <input 
                                placeholder="Search by teacher name, affected entities, or changes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none', background: 'transparent', padding: '14px 12px',
                                    outline: 'none', color: '#1A1D3B', flex: 1, fontSize: '13.5px', fontWeight: 500
                                }}
                            />
                        </div>

                        {/* Dropdown selector for filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Operation Type:</span>
                            <div style={{ minWidth: '180px' }}>
                                <CustomSelect
                                    value={filter}
                                    onChange={val => setFilter(val)}
                                    options={actionFilters.map(f => ({ value: f.id, label: f.label }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Timeline logs list */}
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '18px' }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {activities.length > 0 ? (
                            activities.map((log) => {
                                const config = getActivityConfig(log.action_type);
                                const Icon = config.icon;
                                const isExpanded = !!expandedLogs[log.id];

                                return (
                                    <div 
                                        key={log.id} 
                                        className="glass-panel card-hover" 
                                        style={{ 
                                            borderRadius: '20px', border: '1px solid rgba(229,57,53,0.06)', 
                                            background: '#FFFFFF', overflow: 'hidden'
                                        }}
                                    >
                                        {/* Main collapsible trigger header */}
                                        <div 
                                            onClick={() => toggleExpand(log.id)}
                                            style={{ 
                                                padding: '20px 24px', display: 'flex', gap: '20px', 
                                                alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' 
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#FAFBFD'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Action icon */}
                                            <div style={{
                                                width: '46px', height: '46px', borderRadius: '14px',
                                                background: config.bg, display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', color: config.color, flexShrink: 0
                                            }}>
                                                <Icon size={22} />
                                            </div>

                                            {/* Log header text */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                                            {config.label}
                                                        </h4>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                            <User size={13} color="var(--primary)" /> By {log.teacher_name} ({log.teacher?.email || 'Teacher Portal'})
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600 }}>
                                                        <Clock size={13} />
                                                        {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '8px', fontWeight: 550, lineHeight: 1.4 }}>
                                                    {log.affected_entity || 'System event recorded.'}
                                                </p>
                                            </div>

                                            {/* Expand arrow */}
                                            <div style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>

                                        {/* Collapsible panel with details diffs */}
                                        {isExpanded && (
                                            <div style={{ padding: '24px', background: '#FAFBFE', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                
                                                {/* Diffs render */}
                                                {renderDiffs(log)}

                                                {/* Audit secondary metadata */}
                                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px dashed var(--border-secondary)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                        <Globe size={14} color="var(--primary)" />
                                                        <span>Logged IP: </span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{log.ip_address || 'Internal Router / Localhost'}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                        <Laptop size={14} color="var(--primary)" />
                                                        <span>User Agent / Browser: </span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{log.device || 'Chrome Desktop (Windows OS)'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '64px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)' }}>
                                <ShieldAlert size={48} color="var(--primary)" style={{ display: 'block', margin: '0 auto 16px auto', opacity: 0.8 }} />
                                <h3 style={{ color: '#1A1D3B', fontSize: '18px', fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>No Operational Logs Found</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>Try adjusting your filters or query parameters.</p>
                            </div>
                        )}

                        {/* Interactive Pagination controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '16px', background: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border-primary)' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    Showing page <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{currentPage}</span> of <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{totalPages}</span> ({totalLogs} operations audited)
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className="btn btn-secondary btn-sm"
                                        style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        Prev Audit
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className="btn btn-secondary btn-sm"
                                        style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    >
                                        Next Audit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

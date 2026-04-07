'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Phone, Clock, Calendar, ChevronRight, X,
    MessageSquare, User, Target, CheckCircle, AlertTriangle,
    Filter, Eye, ArrowRight, ChevronDown, Loader2
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EnquiriesPage() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchEnquiries = useCallback(async (customParams?: any) => {
        setIsFiltering(true);
        try {
            const params: any = { ...customParams };
            if (customParams === undefined) {
                if (debouncedSearch) params.search = debouncedSearch;
                if (statusFilter) params.status = statusFilter;
            }
            const res = await api.get('/enquiries', { params });
            setEnquiries(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFiltering(false);
            setIsLoading(false);
        }
    }, [debouncedSearch, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/enquiries/stats');
            setStats(res.data.data);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        setShowFilters(false);
        // Trigger immediate fetch with the new status to bypass effect latency
        fetchEnquiries({ status, search: debouncedSearch });
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [search]);

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

    const clearAllFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setStatusFilter('');
    };

    const activeFilterCount = [statusFilter].filter(Boolean).length;

    const statusConfig: Record<string, { color: string; bg: string; label: string; border: string }> = {
        new: { color: '#3B82F6', bg: '#DBEAFE', label: 'New', border: '#3B82F6' },
        contacted: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Contacted', border: '#8B5CF6' },
        demo_scheduled: { color: '#F59E0B', bg: '#FEF3C7', label: 'Demo Scheduled', border: '#F59E0B' },
        demo_completed: { color: '#F97316', bg: '#FFEDD5', label: 'Demo Completed', border: '#F97316' },
        enrolled: { color: '#10B981', bg: '#D1FAE5', label: 'Enrolled', border: '#10B981' },
        not_interested: { color: '#6B7280', bg: '#F3F4F6', label: 'Not Interested', border: '#6B7280' },
        lost: { color: '#EF4444', bg: '#FEE2E2', label: 'Lost', border: '#EF4444' },
    };

    const priorityConfig: Record<string, { color: string }> = {
        urgent: { color: '#EF4444' },
        high: { color: '#F97316' },
        medium: { color: '#F59E0B' },
        low: { color: '#10B981' },
    };

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.5s ease forwards;
                    opacity: 0;
                }
                .table-row-hover {
                    transition: all 0.2s ease;
                }
                .table-row-hover:hover {
                    background: linear-gradient(135deg, #FAFBFF 0%, #F5F7FF 100%);
                    transform: scale(1.002);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
                }
                .table-row-hover:hover td:first-child {
                    border-top-left-radius: 12px;
                    border-bottom-left-radius: 12px;
                }
                .table-row-hover:hover td:last-child {
                    border-top-right-radius: 12px;
                    border-bottom-right-radius: 12px;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.92);
                    backdrop-filter: blur(20px);
                }
                .filter-pill {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    user-select: none;
                }
                .filter-pill:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px -4px rgba(0,0,0,0.1);
                }
                .filter-pill.active {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px -4px rgba(0,0,0,0.15);
                }
                .filter-dropdown {
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 18px;
                    padding: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 320px;
                    z-index: 100;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    backdrop-filter: blur(20px);
                    background: rgba(255, 255, 255, 0.98);
                }
                .status-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 14px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 13px;
                    font-weight: 500;
                    color: #5E6278;
                }
                .status-item:hover {
                    background: #F8F9FD;
                    color: #1A1D3B;
                }
                .status-item.active {
                    background: #FFF5F5;
                    color: #E53935;
                    font-weight: 700;
                }
            ` }} />

            <div style={{ padding: '32px', margin: '-24px', minHeight: '100%', background: '#F7F8FC' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                                <Phone size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Enquiry Management
                            </h1>
                        </div>
                        <p style={{ fontSize: '14px', color: '#8F92A1', marginTop: '4px', fontWeight: 500, marginLeft: '46px' }}>
                            {stats?.total || 0} total enquiries &bull; <span style={{ color: '#10B981', fontWeight: 700 }}>{stats?.conversion_rate || 0}%</span> conversion rate
                        </p>
                    </div>
                    <button onClick={() => router.push('/admin/enquiries/add')} style={{ background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', color: 'white', border: 'none', borderRadius: '14px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(229,57,53,0.4)', transition: 'all 0.25s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px -6px rgba(229,57,53,0.5)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px -6px rgba(229,57,53,0.4)'; }}>
                        <Plus size={18} strokeWidth={2.5} /> New Enquiry
                    </button>
                </div>

                {/* Filter Section */}
                <div className="glass-panel" style={{ borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)' }}>
                    {/* Top Row: Search + Filter Toggle */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '14px', padding: '12px 18px', border: '1.5px solid #E2E8F0', gap: '12px', transition: 'all 0.2s' }}
                                onFocus={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#E53935'}
                                onBlur={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}
                            >
                                <Search size={18} color="#A1A5B7" strokeWidth={2.5} />
                                <input
                                    placeholder="Search by name, phone, enquiry number..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: '#1A1D3B', fontWeight: 500 }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ background: '#F1F2F6', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEE2E2'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F1F2F6'}
                                    >
                                        <X size={14} color="#A1A5B7" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Toggle Button */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                                    borderRadius: '14px', border: `1.5px solid ${showFilters || activeFilterCount > 0 ? '#E53935' : '#E2E8F0'}`,
                                    fontSize: '14px',
                                    color: showFilters || activeFilterCount > 0 ? '#E53935' : '#1A1D3B',
                                    background: showFilters || activeFilterCount > 0 ? '#FFF5F5' : '#FFFFFF',
                                    cursor: 'pointer', fontWeight: 700,
                                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                }}
                            >
                                <Filter size={16} strokeWidth={2.5} />
                                {statusFilter ? statusConfig[statusFilter].label : 'All Statuses'}
                                <ChevronDown size={14} strokeWidth={2.5} style={{ transition: 'transform 0.2s', transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </button>

                            {/* Expanded Filter Dropdown */}
                            {showFilters && (
                                <div className="animate-fade-in filter-dropdown">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Status</h4>
                                        {activeFilterCount > 0 && (
                                            <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Reset</button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div 
                                            className={`status-item ${!statusFilter ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                All Enquiries
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 700 }}>{stats?.total || 0}</span>
                                        </div>
                                        {Object.entries(statusConfig).map(([key, config]) => (
                                            <div 
                                                key={key}
                                                className={`status-item ${statusFilter === key ? 'active' : ''}`}
                                                onClick={() => handleStatusChange(key)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {config.label}
                                                </div>
                                                <span style={{ 
                                                    fontSize: '11px', 
                                                    color: statusFilter === key ? '#E53935' : '#A1A5B7', 
                                                    fontWeight: 700,
                                                    background: statusFilter === key ? 'rgba(229,57,53,0.1)' : '#F8F9FD',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px'
                                                }}>
                                                    {stats?.by_status?.[key] || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                {!isLoading && (
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>
                            Showing <span style={{ color: '#1A1D3B', fontWeight: 700 }}>{enquiries.length}</span> of {stats?.total || 0} enquiries
                        </p>
                        {isFiltering && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A1A5B7', fontSize: '12px' }}>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Loading...
                            </div>
                        )}
                    </div>
                )}

                {/* Enquiries Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ height: '70px', borderRadius: '14px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                            ))}
                        </div>
                    ) : enquiries.length === 0 ? (
                        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '80px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FFF0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Phone size={36} color="#E53935" strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Enquiries Found</h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', marginBottom: '20px' }}>
                                {activeFilterCount > 0 ? 'Try adjusting your filters to see more results.' : 'Start by creating a new enquiry.'}
                            </p>
                            {activeFilterCount > 0 && (
                                <button onClick={clearAllFilters} style={{
                                    background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', border: 'none',
                                    color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                                    cursor: 'pointer'
                                }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', minWidth: '1000px' }}>
                                <thead>
                                    <tr>
                                        {['Enquiry', 'Contact', 'Course', 'Status', 'Assigned', 'Actions'].map((h, i) => (
                                            <th key={i} style={{
                                                padding: '16px 20px', textAlign: 'left',
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
                                                className="table-row-hover"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => router.push(`/admin/enquiries/${enq.id}`)}
                                            >
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(enq.student_name)}&background=random&color=fff&size=44&bold=true`}
                                                            style={{ width: '44px', height: '44px', borderRadius: '12px', border: '2px solid #F4F5F9' }}
                                                            alt={enq.student_name}
                                                        />
                                                        <div>
                                                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B', display: 'block' }}>{enq.student_name}</span>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#A1A5B7', fontWeight: 600, background: '#F8F9FD', padding: '2px 8px', borderRadius: '4px' }}>{enq.enquiry_number}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Phone size={13} color="#A1A5B7" /> {enq.phone}
                                                        </span>
                                                        {enq.parent_name && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8F92A1' }}>
                                                                <User size={13} color="#A1A5B7" /> {enq.parent_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1D3B' }}>{enq.interested_course || 'Unknown'}</span>
                                                        <span style={{ fontSize: '12px', color: '#A1A5B7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} />
                                                            {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{
                                                        padding: '6px 14px', borderRadius: '50px', background: sc.bg, color: sc.color,
                                                        fontSize: '12px', fontWeight: 700, display: 'inline-block'
                                                    }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    {enq.assigned_teacher_name ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <img
                                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(enq.assigned_teacher_name)}&background=random&color=fff&size=32&bold=true`}
                                                                style={{ width: '28px', height: '28px', borderRadius: '8px' }}
                                                                alt={enq.assigned_teacher_name}
                                                            />
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#5E6278' }}>
                                                                {enq.assigned_teacher_name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: '#A1A5B7', fontStyle: 'italic', background: '#F8F9FD', padding: '4px 10px', borderRadius: '6px' }}>
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button
                                                            onClick={(e) => updateStatus(enq.id, 'contacted', e)}
                                                            title="Mark as Contacted"
                                                            style={{
                                                                background: '#E8F5E9', border: 'none', cursor: 'pointer',
                                                                color: '#2E7D32', width: '36px', height: '36px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#2E7D32'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#E8F5E9'; e.currentTarget.style.color = '#2E7D32'; }}
                                                        >
                                                            <CheckCircle size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => updateStatus(enq.id, 'not_interested', e)}
                                                            title="Mark as Not Interested"
                                                            style={{
                                                                background: '#FEE2E2', border: 'none', cursor: 'pointer',
                                                                color: '#EF4444', width: '36px', height: '36px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                                                        >
                                                            <X size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/enquiries/${enq.id}`); }}
                                                            title="View Details"
                                                            style={{
                                                                background: '#F0F4FF', border: 'none', cursor: 'pointer',
                                                                color: '#3B82F6', width: '36px', height: '36px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.color = '#3B82F6'; }}
                                                        >
                                                            <ArrowRight size={16} strokeWidth={2.5} />
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
        </DashboardLayout>
    );
}

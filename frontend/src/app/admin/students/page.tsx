'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Trash2, Edit2, ChevronLeft, ChevronRight,
    GraduationCap, Users, Filter, BookOpen, ChevronDown, X, Eye, TrendingUp, Download
} from 'lucide-react';

const INLINE_STYLES = (
    <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.92);
                    backdrop-filter: blur(20px);
                }
                .table-row-hover {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
                .bg-mesh {
                    background-color: #f7f8fc;
                    background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.12) 0px, transparent 50%),
                                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.12) 0px, transparent 50%),
                                      radial-gradient(at 0% 50%, hsla(355,100%,93%,0.12) 0px, transparent 50%);
                }
                .filter-select {
                    padding: 10px 36px 10px 14px;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1A1D3B;
                    background: #FFFFFF;
                    cursor: pointer;
                    outline: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238F92A1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    transition: all 0.2s;
                    min-width: 140px;
                }
                .filter-select:focus {
                    border-color: #E53935;
                    box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.08);
                }
                .filter-select.active {
                    border-color: #E53935;
                    background-color: #FFF5F5;
                    color: #E53935;
                }
                .subject-tag {
                    display: inline-flex;
                    align-items: center;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    margin-right: 4px;
                    margin-bottom: 2px;
                }
                .skeleton-row {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }
            `}} />
);

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedFeeStatus, setSelectedFeeStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const limit = 20;

    // Get available subjects for selected batch
    const batchSubjects = useMemo(() => {
        if (!selectedBatch) return [];
        const selectedClass = classes.find(c => c.id === selectedBatch);
        if (!selectedClass?.schedule) return [];
        const subjects = selectedClass.schedule
            .map((s: any) => s.subject)
            .filter((s: string) => s && s.trim() !== '');
        return [...new Set(subjects)] as string[];
    }, [selectedBatch, classes]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        try {
            await api.delete(`/students/${id}`);
            fetchStudents();
        } catch (error: any) {
            console.error('Error deleting student:', error);
            alert(error.response?.data?.message || 'Failed to delete student');
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const params: any = { page, limit };
            if (search) params.search = search;
            if (selectedBatch) params.class_id = selectedBatch;
            if (selectedSubject) params.subject = selectedSubject;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedFeeStatus) params.fee_status = selectedFeeStatus;
            const res = await api.get('/students', { params });
            setStudents(res.data.data || []);
            setTotalCount(res.data.pagination?.total || 0);
        } catch (error) {
            console.error(error);
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchClasses(); }, []);
    useEffect(() => { setPage(1); }, [search, selectedBatch, selectedSubject, selectedStatus, selectedFeeStatus]);
    useEffect(() => { fetchStudents(); }, [search, selectedBatch, selectedSubject, selectedStatus, selectedFeeStatus, page]);

    // Reset subject when batch changes
    useEffect(() => { setSelectedSubject(''); }, [selectedBatch]);

    const totalPages = Math.ceil(totalCount / limit);
    const activeFilterCount = [selectedBatch, selectedSubject, selectedStatus, selectedFeeStatus].filter(Boolean).length;

    const displayStudents = students.map(s => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        roll: s.PRO_ID || '#00',
        className: s.classes?.[0]?.name || 'None',
        subjects: s.subjects?.map((sub: any) => sub.subject) || [],
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        fee_status: s.fee_status || 'pending',
        attendance: s.attendance_percentage || 0,
        academic_status: s.academic_status || 'active',
        gender: s.gender || 'N/A',
    }));

    const getFeeStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return { bg: '#ECFDF5', color: '#059669', text: 'PAID' };
            case 'partial': return { bg: '#FEF3C7', color: '#D97706', text: 'PARTIAL' };
            case 'overdue': return { bg: '#FEF2F2', color: '#DC2626', text: 'OVERDUE' };
            default: return { bg: '#F8F9FD', color: '#8F92A1', text: 'PENDING' };
        }
    };

    const clearAllFilters = () => {
        setSelectedBatch('');
        setSelectedSubject('');
        setSelectedStatus('');
        setSelectedFeeStatus('');
        setSearch('');
    };

    const exportToExcel = async () => {
        try {
            const params: any = { limit: 1000000 };
            if (search) params.search = search;
            if (selectedBatch) params.class_id = selectedBatch;
            if (selectedSubject) params.subject = selectedSubject;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedFeeStatus) params.fee_status = selectedFeeStatus;
            
            const res = await api.get('/students', { params });
            const allStudents = res.data.data || [];
            
            const headers = ['PRO_ID', 'First Name', 'Last Name', 'Class Name', 'Subjects', 'Phone', 'Email', 'Fee Status', 'Attendance %', 'Academic Status', 'Gender'];
            
            const csvRows = [headers.join(',')];
            
            allStudents.forEach((s: any) => {
                const row = [
                    s.PRO_ID || '',
                    s.first_name || '',
                    s.last_name || '',
                    s.classes?.[0]?.name || 'None',
                    (s.subjects?.map((sub: any) => sub.subject) || []).join('; '),
                    s.phone || '',
                    s.email || '',
                    s.fee_status || 'pending',
                    s.attendance_percentage || 0,
                    s.academic_status || 'active',
                    s.gender || ''
                ];
                csvRows.push(row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
            });
            
            const csvData = csvRows.join('\n');
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'Students_Export_' + new Date().toISOString().split('T')[0] + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data');
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            {INLINE_STYLES}

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                                <Users size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Students
                            </h1>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#8F92A1', background: '#F1F2F6', padding: '4px 12px', borderRadius: '8px' }}>
                                {totalCount} total
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Students</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={exportToExcel}
                            style={{
                                background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                                borderRadius: '14px', padding: '12px 20px', fontSize: '15px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.borderColor = '#A1A5B7');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.borderColor = '#E2E8F0');
                            }}
                        >
                            <Download size={20} strokeWidth={2.5} color="#5E6278" /> Export
                        </button>
                        <button
                            onClick={() => router.push('/admin/students/add')}
                            style={{
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '12px 24px', fontSize: '15px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(229,57,53,0.4)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                            <Plus size={20} strokeWidth={2.5} /> Add Student
                        </button>
                    </div>
                </div>

                {/* Main Card */}
                <div className="animate-fade-in glass-panel" style={{
                    borderRadius: '24px', padding: '28px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '100ms'
                }}>
                    {/* Search + Filter Bar */}
                    <div style={{
                        paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        display: 'flex', flexDirection: 'column', gap: '16px',
                    }}>
                        {/* Top row: Search + Filter Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', background: '#FFFFFF',
                                borderRadius: '14px', padding: '10px 18px', flex: '1', maxWidth: '420px',
                                border: '1px solid #E2E8F0', gap: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}>
                                <Search size={18} color="#A1A5B7" strokeWidth={2.5} />
                                <input
                                    placeholder="Search by name, PRO ID, phone, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        border: 'none', background: 'transparent', outline: 'none',
                                        flex: 1, fontSize: '14px', color: '#1A1D3B', fontWeight: 500
                                    }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                        <X size={16} color="#A1A5B7" />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                                        borderRadius: '12px', border: `1px solid ${showFilters || activeFilterCount > 0 ? '#E53935' : '#E2E8F0'}`,
                                        fontSize: '14px',
                                        color: showFilters || activeFilterCount > 0 ? '#E53935' : '#1A1D3B',
                                        background: showFilters || activeFilterCount > 0 ? '#FFF5F5' : '#FFFFFF',
                                        cursor: 'pointer', fontWeight: 700,
                                        transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                        position: 'relative'
                                    }}
                                >
                                    <Filter size={16} strokeWidth={2.5} /> Filters
                                    {activeFilterCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '-6px', right: '-6px',
                                            background: '#E53935', color: 'white',
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 800,
                                        }}>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <ChevronDown size={14} strokeWidth={2.5} style={{ transition: 'transform 0.2s', transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>
                            </div>
                        </div>

                        {/* Filter Row - Collapsible */}
                        {showFilters && (
                            <div className="animate-fade-in" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', animationDelay: '0ms' }}>
                                {/* Batch Filter */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch / Class</label>
                                    <select
                                        className={`filter-select ${selectedBatch ? 'active' : ''}`}
                                        value={selectedBatch}
                                        onChange={e => setSelectedBatch(e.target.value)}
                                    >
                                        <option value="">All Batches</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject Filter - Only show when batch is selected */}
                                {selectedBatch && batchSubjects.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
                                        <select
                                            className={`filter-select ${selectedSubject ? 'active' : ''}`}
                                            value={selectedSubject}
                                            onChange={e => setSelectedSubject(e.target.value)}
                                        >
                                            <option value="">All Subjects</option>
                                            {batchSubjects.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Status Filter */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                                    <select
                                        className={`filter-select ${selectedStatus ? 'active' : ''}`}
                                        value={selectedStatus}
                                        onChange={e => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                    </select>
                                </div>

                                {/* Fee Status Filter */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Status</label>
                                    <select
                                        className={`filter-select ${selectedFeeStatus ? 'active' : ''}`}
                                        value={selectedFeeStatus}
                                        onChange={e => setSelectedFeeStatus(e.target.value)}
                                    >
                                        <option value="">All Fee Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="partial">Partial</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>

                                {/* Clear All */}
                                {activeFilterCount > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                        <button
                                            onClick={clearAllFilters}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '13px', fontWeight: 700, color: '#E53935',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: '8px 12px', borderRadius: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FFF0F1'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <X size={14} strokeWidth={2.5} /> Clear All
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active Filter Tags */}
                        {activeFilterCount > 0 && !showFilters && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 600 }}>Active filters:</span>
                                {selectedBatch && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#FFF0F1', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#E53935' }}>
                                        {classes.find(c => c.id === selectedBatch)?.class_name}
                                        <button onClick={() => setSelectedBatch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#E53935" /></button>
                                    </span>
                                )}
                                {selectedSubject && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#EDE7F6', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>
                                        {selectedSubject}
                                        <button onClick={() => setSelectedSubject('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#7C3AED" /></button>
                                    </span>
                                )}
                                {selectedStatus && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#E8F5E9', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#2E7D32' }}>
                                        {selectedStatus}
                                        <button onClick={() => setSelectedStatus('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#2E7D32" /></button>
                                    </span>
                                )}
                                {selectedFeeStatus && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#FEF3C7', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#D97706' }}>
                                        Fee: {selectedFeeStatus}
                                        <button onClick={() => setSelectedFeeStatus('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} color="#D97706" /></button>
                                    </span>
                                )}
                                <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#E53935', padding: '4px 8px' }}>
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skeleton-row" style={{ height: '60px', animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    ) : displayStudents.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                            <GraduationCap size={56} style={{ marginBottom: '20px', color: '#A1A5B7', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Students Found</h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>
                                {activeFilterCount > 0 ? 'Try adjusting your filters to see more results.' : 'Add a new student to get started.'}
                            </p>
                            {activeFilterCount > 0 && (
                                <button onClick={clearAllFilters} style={{
                                    marginTop: '16px', background: '#FFF0F1', border: '1px solid #E53935', color: '#E53935',
                                    padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                                }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '4px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px', minWidth: '900px' }}>
                                <thead>
                                    <tr>
                                        {['Student', 'PRO ID', 'Batch', 'Subjects', 'Fee Status', 'Phone', 'Actions'].map(h => (
                                            <th key={h} style={{
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
                                    {displayStudents.map((s, i) => {
                                        const feeStatus = getFeeStatusColor(s.fee_status);
                                        const subjectColors: Record<string, { bg: string; color: string }> = {
                                            'Mathematics': { bg: '#EDE7F6', color: '#7C3AED' },
                                            'Maths': { bg: '#EDE7F6', color: '#7C3AED' },
                                            'Physics': { bg: '#E3F2FD', color: '#1565C0' },
                                            'Chemistry': { bg: '#FFF3E0', color: '#E65100' },
                                            'Biology': { bg: '#E8F5E9', color: '#2E7D32' },
                                            'English': { bg: '#FCE4EC', color: '#AD1457' },
                                        };

                                        return (
                                            <tr
                                                key={s.id || i}
                                                className="table-row-hover"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => router.push(`/admin/students/${s.id}`)}
                                            >
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff&size=40&bold=true`}
                                                            style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid #F4F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}
                                                            alt={s.name}
                                                        />
                                                        <div>
                                                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', display: 'block', lineHeight: 1.3 }}>{s.name}</span>
                                                            <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>{s.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#E53935', background: '#FFF0F1', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                                                        {s.roll}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        background: '#F0F4FF', color: '#3B5998',
                                                        padding: '5px 12px', borderRadius: '8px',
                                                        fontSize: '12px', fontWeight: 700,
                                                        display: 'inline-block'
                                                    }}>
                                                        {s.className}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                        {s.subjects.length > 0 ? s.subjects.map((sub: string) => {
                                                            const colors = subjectColors[sub] || { bg: '#F1F2F6', color: '#5E6278' };
                                                            return (
                                                                <span key={sub} className="subject-tag" style={{ background: colors.bg, color: colors.color }}>
                                                                    {sub}
                                                                </span>
                                                            );
                                                        }) : (
                                                            <span style={{ fontSize: '12px', color: '#A1A5B7', fontStyle: 'italic' }}>No subjects</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        padding: '5px 12px', borderRadius: '8px',
                                                        fontSize: '11px', fontWeight: 800,
                                                        background: feeStatus.bg, color: feeStatus.color,
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        {feeStatus.text}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{s.phone}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <button
                                                            title="View Profile & Performance"
                                                            style={{
                                                                background: '#F0F4FF', border: 'none', cursor: 'pointer',
                                                                color: '#3B5998', width: '34px', height: '34px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#3B5998'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.color = '#3B5998'; }}
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${s.id}`); }}
                                                        >
                                                            <TrendingUp size={15} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            title="Delete Student"
                                                            style={{
                                                                background: '#FEE2E2', border: 'none', cursor: 'pointer',
                                                                color: '#EF4444', width: '34px', height: '34px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(s.id, s.name);
                                                            }}
                                                        >
                                                            <Trash2 size={15} strokeWidth={2.5} />
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            paddingTop: '20px', marginTop: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <p style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500 }}>
                                Showing <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)}</span> of <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{totalCount}</span>
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    style={{
                                        background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                        color: page <= 1 ? '#D1D5DB' : '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                        transition: 'all 0.2s', fontWeight: 600, fontSize: '13px', opacity: page <= 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            style={{
                                                background: pageNum === page ? 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' : '#FFFFFF',
                                                color: pageNum === page ? 'white' : '#1A1D3B',
                                                border: pageNum === page ? 'none' : '1px solid #E2E8F0',
                                                width: '36px', height: '36px',
                                                borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '13px',
                                                boxShadow: pageNum === page ? '0 4px 12px rgba(229,57,53,0.3)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    style={{
                                        background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                        color: page >= totalPages ? '#D1D5DB' : '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                        transition: 'all 0.2s', fontWeight: 600, fontSize: '13px', opacity: page >= totalPages ? 0.5 : 1
                                    }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

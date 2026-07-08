'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  ClipboardList, Users, CheckCircle, XCircle, Trophy, BarChart2, Info, 
  ArrowLeft, Search, FileSpreadsheet, Percent, AlertCircle,
  TrendingUp, Award, Clock, ArrowUpRight, ShieldAlert
} from 'lucide-react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TestProfilePage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const basePath = pathname.startsWith('/coordinator') ? '/coordinator' : '/admin';
    const requiredRole = pathname.startsWith('/coordinator') ? 'coordinator' : 'admin';
    const [test, setTest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail' | 'absent' | 'toppers'>('all');
    const [minMarks, setMinMarks] = useState<string>('');
    const [maxMarks, setMaxMarks] = useState<string>('');

    useEffect(() => {
        if (params.id) {
            fetchTestData();
        }
    }, [params.id]);

    const fetchTestData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/tests/${params.id}`);
            setTest(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load test analytics');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole={requiredRole}>
                <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ color: '#64748B', marginTop: '16px', fontWeight: 600 }}>Loading Test Analytics...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!test) {
        return (
            <DashboardLayout requiredRole={requiredRole}>
                <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>Test not found</h3>
                    <button className="btn btn-primary" onClick={() => router.push('${basePath}/tests')} style={{ marginTop: '16px' }}>Back to Tests</button>
                </div>
            </DashboardLayout>
        );
    }

    // Dynamic Filter calculations
    const results = test.results || [];
    const filteredResults = results.filter((r: any) => {
        // Search by name or Roll
        const nameMatch = r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.pro_id.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        let statusMatch = true;
        if (statusFilter === 'pass') statusMatch = r.pass_fail === 'pass' && r.was_present !== false;
        if (statusFilter === 'fail') statusMatch = r.pass_fail === 'fail' && r.was_present !== false;
        if (statusFilter === 'absent') statusMatch = r.was_present === false;
        if (statusFilter === 'toppers') statusMatch = r.rank_in_class <= 3 && r.was_present !== false;

        // Marks threshold
        let marksMatch = true;
        if (minMarks && r.marks_obtained !== null) {
            marksMatch = marksMatch && r.marks_obtained >= parseFloat(minMarks);
        }
        if (maxMarks && r.marks_obtained !== null) {
            marksMatch = marksMatch && r.marks_obtained <= parseFloat(maxMarks);
        }

        return nameMatch && statusMatch && marksMatch;
    });

    const exportResultsToCSV = () => {
        const headers = ['Rank', 'PRO ID', 'Student Name', 'Marks Obtained', 'Out of', 'Percentage', 'Status'];
        const rows = filteredResults.map((r: any) => [
            r.rank_in_class,
            r.pro_id,
            r.student_name,
            r.was_present === false ? 'A' : r.marks_obtained,
            test.total_marks,
            `${r.percentage}%`,
            r.was_present === false ? 'Absent' : r.pass_fail.toUpperCase()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map((e: any) => e.map((val: any) => `"${val}"`).join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${test.test_name.replace(/\s+/g, '_')}_Analytics.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalAbsent = results.filter((r: any) => r.was_present === false).length;
    const totalAppeared = results.length - totalAbsent;

    return (
        <DashboardLayout requiredRole={requiredRole}>
            <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                
                {/* CSS Keyframes & Animations */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade {
                        animation: fadeInUp 0.4s ease forwards;
                    }
                    .filter-badge {
                        padding: 10px 18px;
                        border-radius: 12px;
                        border: 1px solid #E2E8F0;
                        background: white;
                        color: #64748B;
                        font-weight: 700;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .filter-badge.active {
                        background: #E53935;
                        color: white;
                        border-color: #E53935;
                        box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
                    }
                `}} />

                {/* Header */}
                <div className="animate-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <button 
                            onClick={() => router.push('${basePath}/tests')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}
                        >
                            <ArrowLeft size={16} /> Back to Tests
                        </button>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', background: 'rgba(229, 57, 53,0.1)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {test.test_code}
                        </span>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginTop: '6px', marginInline: 0 }}>{test.test_name}</h1>
                        <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px', fontWeight: 500 }}>
                            Batch: <strong style={{ color: '#1E293B' }}>{test.class_name}</strong> • Subject: <strong style={{ color: '#1E293B' }}>{test.subject || 'N/A'}</strong> • Date: {new Date(test.test_date).toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={exportResultsToCSV}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
                              border: '1px solid #E2E8F0', background: 'white', color: '#334155', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            <FileSpreadsheet size={16} color="#10B981" /> Export CSV
                        </button>

                        <button 
                            className="btn btn-primary" 
                            onClick={() => router.push(`/admin/tests/${test.id}/evaluate`)}
                            style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, boxShadow: '0 4px 12px rgba(229, 57, 53, 0.2)' }}
                        >
                            Evaluate Scores
                        </button>
                    </div>
                </div>

                {/* KPI Test Statistics Grid */}
                <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px', animationDelay: '0.1s' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '14px', background: 'rgba(229, 57, 53,0.08)', borderRadius: '16px', color: '#E53935' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Total Appeared</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{totalAppeared} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}>/ {results.length} enrolled</span></h3>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: '16px', color: '#EF4444' }}>
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Total Absent</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444', margin: '4px 0 0 0' }}>{totalAbsent} Students</h3>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: '16px', color: '#10B981' }}>
                            <Percent size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Average Score</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{test.stats?.average}%</h3>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', borderRadius: '16px', color: '#F59E0B' }}>
                            <Award size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Highest Score</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', margin: '4px 0 0 0' }}>{test.stats?.highest} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}>/ {test.total_marks} max</span></h3>
                        </div>
                    </div>
                </div>

                {/* Dashboard Split Body */}
                <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: '32px', alignItems: 'start', animationDelay: '0.2s' }}>
                    
                    {/* Left Column: Filters and Syllabus Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Interactive query filter panel */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={18} color="#E53935" /> Smart Filters
                            </h3>

                            {/* Search bar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Keyword Search</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Name or Roll Number..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            {/* Marks Threshold */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marks Obtained Range</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input 
                                        type="number" 
                                        placeholder="Min Marks" 
                                        value={minMarks}
                                        onChange={e => setMinMarks(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Max Marks" 
                                        value={maxMarks}
                                        onChange={e => setMaxMarks(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            {/* Quick filters tag layout */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Smart Segment Preset</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button onClick={() => setStatusFilter('all')} className={`filter-badge ${statusFilter === 'all' ? 'active' : ''}`}>
                                        All Candidates ({results.length})
                                    </button>
                                    <button onClick={() => setStatusFilter('toppers')} className={`filter-badge ${statusFilter === 'toppers' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Trophy size={14} /> Toppers (Top 3)
                                    </button>
                                    <button onClick={() => setStatusFilter('pass')} className={`filter-badge ${statusFilter === 'pass' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={14} /> Passed Candidates ({results.filter((r: any) => r.pass_fail === 'pass').length})
                                    </button>
                                    <button onClick={() => setStatusFilter('fail')} className={`filter-badge ${statusFilter === 'fail' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <XCircle size={14} /> Failed Candidates ({results.filter((r: any) => r.pass_fail === 'fail').length})
                                    </button>
                                    <button onClick={() => setStatusFilter('absent')} className={`filter-badge ${statusFilter === 'absent' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={14} /> Absent Candidates ({totalAbsent})
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Test details & attachment panel */}
                        {(test.description || (test.images && test.images.length > 0)) && (
                            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <Info size={18} color="#E53935" /> Syllabus Details
                                </h3>
                                
                                {test.description && (
                                    <p style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.5, background: '#F8FAFC', padding: '16px', borderRadius: '12px', margin: 0 }}>
                                        {test.description}
                                    </p>
                                )}

                                {test.images && test.images.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                                        {test.images.map((img: string, idx: number) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', cursor: 'pointer', textDecoration: 'none' }}>
                                                <img src={img} alt={`Attachment ${idx + 1}`} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                                                <div style={{ padding: '6px', background: 'white', fontSize: '10px', fontWeight: 700, color: '#E53935', textAlign: 'center' }}>
                                                    Document {idx + 1}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Right Column: Ledger student result list */}
                    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                        
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={18} color="#E53935" /> Results Sheet Ledger
                            </h3>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '4px 12px', borderRadius: '20px' }}>
                                Showing {filteredResults.length} of {results.length} Candidates
                            </span>
                        </div>

                        {filteredResults.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#F8FAFC' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0', width: '80px' }}>Rank</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Candidate Name</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Roll Number</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Score (Absolute)</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Percentage</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Status Badge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.map((r: any) => {
                                        const isTop3 = r.rank_in_class <= 3 && r.was_present !== false;
                                        
                                        return (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ 
                                                        fontWeight: 800, 
                                                        color: r.rank_in_class === 1 ? '#F59E0B' : r.rank_in_class === 2 ? '#94A3B8' : r.rank_in_class === 3 ? '#B45309' : '#475569',
                                                        fontSize: isTop3 ? '15px' : '13px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {isTop3 ? <Trophy size={14} style={{ color: r.rank_in_class === 1 ? '#F59E0B' : r.rank_in_class === 2 ? '#94A3B8' : '#B45309', marginRight: '4px' }} /> : ''}#{r.rank_in_class}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EEF2F6', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                                                            {r.student_name?.[0] || 'S'}
                                                        </div>
                                                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{r.student_name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontWeight: 700, color: '#E53935' }}>
                                                    {r.pro_id}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155' }}>
                                                    {r.was_present === false ? '0' : r.marks_obtained} <span style={{ color: '#94A3B8', fontSize: '11px' }}>/ {test.total_marks}</span>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1E293B' }}>
                                                    {r.percentage}%
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    {r.was_present === false ? (
                                                        <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                                                            ABSENT
                                                        </span>
                                                    ) : (
                                                        <span style={{ 
                                                            background: r.pass_fail === 'pass' ? '#D1FAE5' : '#FEE2E2', 
                                                            color: r.pass_fail === 'pass' ? '#065F46' : '#B91C1C', 
                                                            padding: '4px 10px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 800 
                                                        }}>
                                                            {r.pass_fail.toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
                                <p style={{ fontWeight: 700, fontSize: '18px', margin: 0 }}>No matching candidates found</p>
                                <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your marks ranges or status presets.</p>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </DashboardLayout>
    );
}

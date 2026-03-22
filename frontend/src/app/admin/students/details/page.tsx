'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
    Search, GraduationCap, ChevronRight, User, Phone, MapPin, 
    Filter, LayoutGrid, List, ArrowUpDown, TrendingUp, Users, 
    BookOpen, CheckCircle, Clock 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentLookupPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (search.length >= 2) {
            const delayDebounceFn = setTimeout(() => {
                fetchStudents();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else if (search.length === 0) {
            fetchInitialData();
        }
    }, [search]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [studentRes, statsRes] = await Promise.all([
                api.get('/students', { params: { limit: 20 } }),
                api.get('/students/stats')
            ]);
            setStudents(studentRes.data.data || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/students', { params: { search, limit: 50 } });
            setStudents(res.data.data || []);
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
                
                {/* Modern Hero Section */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #1e2142 0%, #10122e 100%)',
                    borderRadius: '24px',
                    padding: '40px',
                    marginBottom: '40px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ 
                        position: 'absolute', top: '-50px', right: '-50px', 
                        width: '200px', height: '200px', borderRadius: '50%',
                        background: 'rgba(79, 96, 255, 0.1)', filter: 'blur(40px)'
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: 0 }}>
                                    Student Intelligence Portal
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px', maxWidth: '500px' }}>
                                    Access deep academic insights, progress tracking, and detailed performance reports for every student in your institution.
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Students</p>
                                    <h2 style={{ color: '#4F60FF', fontSize: '28px', fontWeight: 800, margin: 0 }}>{stats?.active || '...'}</h2>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Attendance</p>
                                    <h2 style={{ color: '#00E676', fontSize: '28px', fontWeight: 800, margin: 0 }}>88%</h2>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar Integrated into Hero */}
                        <div style={{ position: 'relative', marginTop: '32px', maxWidth: '700px' }}>
                            <div style={{ 
                                position: 'absolute', left: '20px', top: '50%', 
                                transform: 'translateY(-50%)', color: '#4F60FF', zIndex: 2
                            }}>
                                <Search size={20} strokeWidth={3} />
                            </div>
                            <input 
                                className="input-field"
                                placeholder="Search by student name, roll number, or phone..."
                                style={{ 
                                    padding: '16px 20px 16px 56px', fontSize: '15px', 
                                    borderRadius: '16px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                                    height: 'auto', width: '100%', outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filters & Control Bar */}
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    marginBottom: '24px', flexWrap: 'wrap', gap: '16px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{search ? `Search results for "${search}"` : 'All Enrolled Students'}</h3>
                        <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 600 }}>
                            {students.length} found
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                            <button 
                                onClick={() => setViewMode('grid')}
                                style={{ 
                                    padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: viewMode === 'grid' ? 'white' : 'transparent',
                                    color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-tertiary)',
                                    boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    display: 'flex', alignItems: 'center'
                                }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                style={{ 
                                    padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: viewMode === 'list' ? 'white' : 'transparent',
                                    color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-tertiary)',
                                    boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    display: 'flex', alignItems: 'center'
                                }}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button className="btn btn-secondary" style={{ gap: '8px' }}><Filter size={16} /> Filters</button>
                    </div>
                </div>

                {/* Results Area */}
                {isLoading ? (
                    <div style={{ padding: '100px 0', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ color: 'var(--text-tertiary)', marginTop: '20px', fontWeight: 500 }}>Fetching students...</p>
                    </div>
                ) : students.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                            {students.map((student, idx) => (
                                <div 
                                    key={student.id} 
                                    className="card animate-fade-in"
                                    style={{ 
                                        padding: '0', 
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animationDelay: `${idx * 30}ms`,
                                        border: '1px solid var(--border-primary)'
                                    }}
                                    onClick={() => router.push(`/admin/students/${student.id || student._id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                                        e.currentTarget.style.borderColor = 'var(--primary-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                                    }}
                                >
                                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <div style={{ 
                                            width: '80px', height: '80px', borderRadius: '50%',
                                            background: '#EEF0FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 16px', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}>
                                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#4F60FF' }}>{student.first_name?.[0]}{student.last_name?.[0]}</span>
                                        </div>
                                        <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>{student.first_name} {student.last_name}</h4>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F60FF', background: '#EEF0FF', padding: '2px 10px', borderRadius: '50px' }}>{student.PRO_ID}</span>
                                        
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', width: '100%', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Batch</p>
                                                <p style={{ fontSize: '13px', fontWeight: 600 }}>{student.classes?.[0]?.name || 'N/A'}</p>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>Reports</p>
                                                <p style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#00C853' }}>
                                                   <TrendingUp size={14} /> View
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ background: '#F8F9FD', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={12} color="var(--text-tertiary)" />
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Jul 12, 2023</span>
                                        </div>
                                        <ChevronRight size={14} color="#A1A5B7" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>PRO ID</th>
                                        <th>Class / Batch</th>
                                        <th>Phone Number</th>
                                        <th>Academic Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, idx) => (
                                        <tr 
                                            key={student.id} 
                                            onClick={() => router.push(`/admin/students/${student.id || student._id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEF0FF', color: '#4F60FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                                                        {student.first_name?.[0]}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{student.first_name} {student.last_name}</span>
                                                </div>
                                            </td>
                                            <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4F60FF' }}>{student.PRO_ID}</span></td>
                                            <td>{student.classes?.[0]?.name || 'N/A'}</td>
                                            <td>{student.phone}</td>
                                            <td><span className="badge badge-success">{student.academic_status}</span></td>
                                            <td style={{ textAlign: 'right' }}><ChevronRight size={16} color="#A1A5B7" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="empty-state" style={{ padding: '80px 0' }}>
                        <GraduationCap size={64} color="var(--border-primary)" />
                        <h3>No students found</h3>
                        <p>We couldn't find any students matching your criteria.</p>
                        <button className="btn btn-primary" onClick={() => {setSearch(''); fetchInitialData();}}>Reset Search</button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

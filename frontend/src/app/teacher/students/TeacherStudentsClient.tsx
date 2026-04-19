'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { Users, Search, GraduationCap, TrendingUp, X } from 'lucide-react';
import api from '@/lib/api';

interface Props {
    initialData: {
        students: any[];
    };
}

export default function TeacherStudentsClient({ initialData }: Props) {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>(initialData.students);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (search === '' && students === initialData.students) return;
        fetchStudents();
    }, [search]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/students', { params: { search, limit: 50 } });
            setStudents(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setIsLoading(false);
        }
    };

    const subjectColors: Record<string, { bg: string; color: string }> = {
        'Mathematics': { bg: '#EDE7F6', color: '#7C3AED' },
        'Maths': { bg: '#EDE7F6', color: '#7C3AED' },
        'Physics': { bg: '#E3F2FD', color: '#1565C0' },
        'Chemistry': { bg: '#FFF3E0', color: '#E65100' },
        'Biology': { bg: '#E8F5E9', color: '#2E7D32' },
        'English': { bg: '#FCE4EC', color: '#AD1457' },
    };

    return (
        <PermissionGuard permissionKey="students">
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                    .animate-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                    .glass-panel { background: #FFFFFF; border: 1px solid #E2E8F0; }
                    .table-row-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
                    .table-row-hover:hover { background: linear-gradient(135deg, #FAFBFF 0%, #F5F7FF 100%); transform: scale(1.002); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
                    .table-row-hover:hover td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
                    .table-row-hover:hover td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
                    .skeleton-row { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
                    .bg-mesh {
                        background-color: #f7f8fc;
                        background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.12) 0px, transparent 50%),
                                          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.12) 0px, transparent 50%),
                                          radial-gradient(at 0% 50%, hsla(355,100%,93%,0.12) 0px, transparent 50%);
                    }
                    .subject-tag { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; margin-right: 4px; margin-bottom: 2px; }
                `}} />

                <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>
                    {/* Header */}
                    <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                                    <Users size={18} strokeWidth={2.5} />
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                    My Students
                                </h1>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#8F92A1', background: '#F1F2F6', padding: '4px 12px', borderRadius: '8px' }}>
                                    {students.length} total
                                </span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Students</span>
                            </p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="animate-in glass-panel" style={{ borderRadius: '24px', padding: '28px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)', animationDelay: '100ms' }}>
                        {/* Search */}
                        <div style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '14px', padding: '10px 18px', flex: '1', maxWidth: '420px', border: '1px solid #E2E8F0', gap: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                <Search size={18} color="#A1A5B7" strokeWidth={2.5} />
                                <input
                                    placeholder="Search by name, PRO ID, phone, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: '#1A1D3B', fontWeight: 500 }}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                        <X size={16} color="#A1A5B7" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        {isLoading && students.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="skeleton-row" style={{ height: '60px', animationDelay: `${i * 100}ms` }} />
                                ))}
                            </div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                                <GraduationCap size={56} style={{ marginBottom: '20px', color: '#A1A5B7', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Students Found</h3>
                                <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>
                                    {search ? 'Try adjusting your search to see more results.' : 'There are no students to display.'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '4px' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px', minWidth: '750px' }}>
                                    <thead>
                                        <tr>
                                            {['Student', 'PRO ID', 'Class(es)', 'Subjects', 'Phone', ''].map(h => (
                                                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#A1A5B7', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, i) => {
                                            const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                                            return (
                                                <tr
                                                    key={student.id}
                                                    className="table-row-hover"
                                                    onClick={() => router.push(`/teacher/students/${student.id}`)}
                                                >
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <img
                                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40&bold=true`}
                                                                style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid #F4F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}
                                                                alt={name}
                                                            />
                                                            <div>
                                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', display: 'block', lineHeight: 1.3 }}>{name}</span>
                                                                <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>{student.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#E53935', background: '#FFF0F1', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                                                            {student.PRO_ID || '#00'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            {student.classes?.length > 0 ? student.classes.map((c: any) => (
                                                                <span key={c.id} style={{ background: '#F0F4FF', color: '#3B5998', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'inline-block' }}>
                                                                    {c.name || 'Unknown'}
                                                                </span>
                                                            )) : <span style={{ color: '#A1A5B7', fontSize: '12px', fontStyle: 'italic' }}>N/A</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                            {student.subjects?.length > 0 ? student.subjects.map((sub: any) => {
                                                                const sc = subjectColors[sub.subject] || { bg: '#F1F2F6', color: '#5E6278' };
                                                                return (
                                                                    <span key={sub.subject} className="subject-tag" style={{ background: sc.bg, color: sc.color }}>
                                                                        {sub.subject}
                                                                    </span>
                                                                );
                                                            }) : (
                                                                <span style={{ fontSize: '12px', color: '#A1A5B7', fontStyle: 'italic' }}>No subjects</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1A1D3B', fontWeight: 600 }}>{student.phone || 'N/A'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <button
                                                            title="View Profile"
                                                            style={{
                                                                background: '#F0F4FF', border: 'none', cursor: 'pointer',
                                                                color: '#3B5998', width: '34px', height: '34px', borderRadius: '10px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#3B5998'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.color = '#3B5998'; }}
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/teacher/students/${student.id}`); }}
                                                        >
                                                            <TrendingUp size={15} strokeWidth={2.5} />
                                                        </button>
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
        </PermissionGuard>
    );
}

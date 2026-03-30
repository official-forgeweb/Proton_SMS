'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
    Search, Calendar, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, MoreHorizontal, GraduationCap, Users
} from 'lucide-react';
import Modal from '@/components/Modal';

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    const emptyForm = { first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: 'male', school_name: '', class_id: '', admission_type: 'fresh' };
    const [formData, setFormData] = useState(emptyForm);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        try {
            await api.delete(`/students/${id}`);
            const res = await api.get('/students', { params: { search } });
            setStudents(res.data.data && res.data.data.length > 0 ? res.data.data : dummyStudents);
        } catch (error: any) {
            console.error('Error deleting student:', error);
            alert(error.response?.data?.message || 'Failed to delete student');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: any = { ...formData };
            if (!submitData.class_id) delete submitData.class_id;
            await api.post('/students', submitData);
            setIsAddOpen(false);
            setFormData(emptyForm);
            // Re-fetch
            const res = await api.get('/students', { params: { search } });
            setStudents(res.data.data && res.data.data.length > 0 ? res.data.data : dummyStudents);
        } catch (error: any) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.message || 'Failed to save student');
        }
    };

    const dummyStudents = [
        { id: 1, first_name: 'Eleanor', last_name: 'Pena', roll: '#01', address: 'TA-107 Newyork', className: '01', dob: '02/05/2001', phone: '+123 6988567' },
        { id: 2, first_name: 'Jessia', last_name: 'Rose', roll: '#10', address: 'TA-107 Newyork', className: '02', dob: '03/04/2000', phone: '+123 8988569' },
        { id: 3, first_name: 'Jenny', last_name: 'Wilson', roll: '#04', address: 'Australia, Sydney', className: '01', dob: '12/05/2001', phone: '+123 7988566' },
        { id: 4, first_name: 'Guy', last_name: 'Hawkins', roll: '#03', address: 'Australia, Sydney', className: '02', dob: '03/05/2001', phone: '+123 5988565' },
        { id: 5, first_name: 'Jacob', last_name: 'Jones', roll: '#15', address: 'Australia, Sydney', className: '04', dob: '12/05/2001', phone: '+123 9988568' },
        { id: 6, first_name: 'Jane', last_name: 'Cooper', roll: '#01', address: 'Australia, Sydney', className: '04', dob: '12/03/2001', phone: '+123 6988566' },
        { id: 7, first_name: 'Floyd', last_name: 'Miles', roll: '#11', address: 'TA-107 Newyork', className: '01', dob: '03/05/2002', phone: '+123 5988569' },
        { id: 8, first_name: 'Robert', last_name: 'Fox', roll: '#08', address: 'TA-107 Newyork', className: '03', dob: '07/11/2001', phone: '+123 4988560' },
    ];

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const params: any = {};
                if (search) params.search = search;
                const res = await api.get('/students', { params });
                setStudents(res.data.data && res.data.data.length > 0 ? res.data.data : dummyStudents);
            } catch (error) {
                console.error(error);
                setStudents(dummyStudents);
            } finally {
                setIsLoading(false);
            }
        };
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes');
                setClasses(res.data.data || []);
            } catch (error) {
                console.error('Error fetching classes', error);
            }
        };
        fetchStudents();
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const displayStudents = students.map(s => ({
        id: s.id,
        mongo_id: s.id || s._id,
        name: `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim(),
        roll: s.roll || s.PRO_ID || '#00',
        address: s.address || 'Unknown',
        className: s.classes?.[0]?.name || s.classes?.[0]?.class_name || s.className || 'None',
        dob: s.dob || s.date_of_birth || '01/01/2001',
        phone: s.phone || '+123 0000000',
    }));

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: `
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
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
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
            `}} />

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ background: '#E53935', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Users size={18} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Students List
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Home &rsaquo; <span style={{ color: '#E53935', fontWeight: 700 }}>Students</span>
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormData(emptyForm); setIsAddOpen(true); }}
                        style={{
                            background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                            color: 'white', border: 'none',
                            borderRadius: '14px', padding: '12px 24px', fontSize: '15px',
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
                        <Plus size={20} strokeWidth={2.5} /> Add Student
                    </button>
                </div>

                {/* Main Card */}
                <div className="animate-fade-in glass-panel" style={{
                    borderRadius: '24px', padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)',
                    animationDelay: '100ms'
                }}>
                    {/* Card Header */}
                    <div style={{
                        paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                Students Information
                            </h2>
                            <p style={{ fontSize: '13px', color: '#8F92A1', marginTop: '4px', fontWeight: 500 }}>
                                {displayStudents.length} total students
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {/* Search */}
                            <div style={{
                                display: 'flex', alignItems: 'center', background: '#FFFFFF',
                                borderRadius: '14px', padding: '10px 18px', width: '320px',
                                border: '1px solid #E2E8F0', gap: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}>
                                <Search size={18} color="#A1A5B7" strokeWidth={2.5} />
                                <input
                                    placeholder="Search by name or roll..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        border: 'none', background: 'transparent', outline: 'none',
                                        flex: 1, fontSize: '14px', color: '#1A1D3B', fontWeight: 500
                                    }}
                                />
                            </div>
                            {/* Filter */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                                borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '14px',
                                color: '#1A1D3B', background: '#FFFFFF', cursor: 'pointer', fontWeight: 600,
                                transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FFFFFF'}
                            >
                                <Calendar size={18} color="#E53935" /> Last 30 days
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}>
                            <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                            </div>
                            <p style={{ color: '#1A1D3B', fontSize: '15px', fontWeight: 600 }}>Loading students...</p>
                        </div>
                    ) : displayStudents.length === 0 ? (
                        <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                            <GraduationCap size={56} style={{ marginBottom: '20px', color: '#A1A5B7', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Students Found</h3>
                            <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>Try adjusting your search or add a new student.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        {['Student Name', 'Roll', 'Address', 'Class', 'Date of Birth', 'Phone', 'Action'].map(h => (
                                            <th key={h} style={{
                                                padding: '16px 20px', textAlign: 'left',
                                                color: '#A1A5B7', fontWeight: 700, fontSize: '12px',
                                                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayStudents.map((s, i) => (
                                        <tr
                                            key={s.id || i}
                                            className="table-row-hover"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => router.push(`/admin/students/${s.mongo_id}`)}
                                        >
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff&size=40&bold=true`}
                                                        style={{ width: '42px', height: '42px', borderRadius: '12px', border: '2px solid #F4F5F9', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}
                                                        alt={s.name}
                                                    />
                                                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#5E6278', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '1px' }}>{s.roll}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>{s.address}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{
                                                    background: '#FFF0F1', color: '#E53935',
                                                    padding: '6px 14px', borderRadius: '10px',
                                                    fontSize: '13px', fontWeight: 800,
                                                    display: 'inline-block', boxShadow: '0 2px 6px rgba(229, 57, 53, 0.1)'
                                                }}>
                                                    {s.className || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>{s.dob}</td>
                                            <td style={{ padding: '16px 20px', fontSize: '14px', color: '#1A1D3B', fontWeight: 600 }}>{s.phone}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <button
                                                        style={{
                                                            background: '#FEE2E2', border: 'none', cursor: 'pointer',
                                                            color: '#EF4444', width: '36px', height: '36px', borderRadius: '10px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#FECACA')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = '#FEE2E2')}
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            handleDelete(s.mongo_id, s.name); 
                                                        }}
                                                    >
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        style={{
                                                            background: '#FFF0F1', border: 'none', cursor: 'pointer',
                                                            color: '#E53935', width: '36px', height: '36px', borderRadius: '10px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(229, 57, 53, 0.1)'
                                                        }}
                                                        onMouseEnter={e => {
                                                            (e.currentTarget as HTMLElement).style.background = '#E53935';
                                                            (e.currentTarget as HTMLElement).style.color = 'white';
                                                        }}
                                                        onMouseLeave={e => {
                                                            (e.currentTarget as HTMLElement).style.background = '#FFF0F1';
                                                            (e.currentTarget as HTMLElement).style.color = '#E53935';
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/admin/students/${s.mongo_id}`);
                                                        }}
                                                    >
                                                        <Edit2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {displayStudents.length >= 15 && (
                        <div style={{
                            paddingTop: '24px', marginTop: '24px', borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <p style={{ fontSize: '14px', color: '#A1A5B7', fontWeight: 500 }}>
                                Showing <span style={{ color: '#1A1D3B', fontWeight: 800 }}>1-15</span> of <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{displayStudents.length}</span> students
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button style={{
                                    background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer',
                                    color: '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                    transition: 'all 0.2s', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                    <ChevronLeft size={18} /> Prev
                                </button>
                                {[1, 2, 3].map(p => (
                                    <button
                                        key={p}
                                        style={{
                                            background: p === 1 ? 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' : '#FFFFFF',
                                            color: p === 1 ? 'white' : '#1A1D3B',
                                            border: p === 1 ? 'none' : '1px solid #E2E8F0', width: '38px', height: '38px',
                                            borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '14px',
                                            boxShadow: p === 1 ? '0 4px 12px rgba(229,57,53,0.3)' : '0 2px 4px rgba(0,0,0,0.02)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            if (p !== 1) (e.currentTarget.style.background = '#F8F9FD');
                                        }}
                                        onMouseLeave={e => {
                                            if (p !== 1) (e.currentTarget.style.background = '#FFFFFF');
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <span style={{ color: '#A1A5B7', padding: '0 4px', fontWeight: 600 }}>...</span>
                                <button style={{
                                    background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1A1D3B',
                                    width: '38px', height: '38px', borderRadius: '10px', fontWeight: 800,
                                    cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                    12
                                </button>
                                <button style={{
                                    background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer',
                                    color: '#1A1D3B', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                                    transition: 'all 0.2s', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>
                                    Next <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Student">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                            <input type="email" style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                            <input required style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</label>
                            <DatePicker required showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={100} dropdownMode="select" selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null} onChange={(date: Date | null) => setFormData({ ...formData, date_of_birth: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" placeholderText="Select date of birth" className="w-full" customInput={<input style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
                            <select style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign Class / Batch</label>
                        <select 
                            style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} 
                            value={formData.class_id} 
                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                            onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                        >
                            <option value="">Select a Class...</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous School</label>
                        <input style={{ padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none', transition: 'border 0.2s' }} value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = '#E53935'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '12px 28px', background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FD')} onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}>Cancel</button>
                        <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(229,57,53,0.4)', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget.style.transform = 'translateY(-2px)'); (e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(229,57,53,0.5)') }} onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); (e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(229,57,53,0.4)') }}>Save Student</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

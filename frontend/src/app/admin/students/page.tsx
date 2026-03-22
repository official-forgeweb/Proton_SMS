'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Calendar, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, MoreHorizontal, GraduationCap
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
    }, [search]);

    const displayStudents = students.map(s => ({
        id: s.id,
        mongo_id: s.id || s._id,
        name: `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim(),
        roll: s.roll || s.PRO_ID || '#00',
        address: s.address || 'Unknown',
        className: s.className || s.classes?.[0]?.name || '01',
        dob: s.dob || s.date_of_birth || '01/01/2001',
        phone: s.phone || '+123 0000000',
    }));

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>

                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Students List
                        </h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Home &rsaquo; <span style={{ color: '#4F60FF', fontWeight: 600 }}>Students</span>
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormData(emptyForm); setIsAddOpen(true); }}
                        style={{
                            background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                            color: 'white', border: 'none',
                            borderRadius: '12px', padding: '11px 22px', fontSize: '14px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        <Plus size={18} /> Add Student
                    </button>
                </div>

                {/* Main Card */}
                <div style={{
                    background: '#FFFFFF', borderRadius: '18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5',
                    overflow: 'hidden',
                }}>
                    {/* Card Header */}
                    <div style={{
                        padding: '20px 24px', borderBottom: '1px solid #F0F0F5',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                Students Information
                            </h2>
                            <p style={{ fontSize: '12px', color: '#A1A5B7', marginTop: '2px' }}>
                                {displayStudents.length} total students
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Search */}
                            <div style={{
                                display: 'flex', alignItems: 'center', background: '#F4F5F9',
                                borderRadius: '12px', padding: '9px 16px', width: '280px',
                                border: '1px solid #F0F0F5', gap: '8px',
                            }}>
                                <Search size={15} color="#A1A5B7" strokeWidth={2.5} />
                                <input
                                    placeholder="Search by name or roll..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        border: 'none', background: 'transparent', outline: 'none',
                                        flex: 1, fontSize: '13px', color: '#1A1D3B',
                                    }}
                                />
                            </div>
                            {/* Filter */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px',
                                borderRadius: '12px', border: '1px solid #F0F0F5', fontSize: '13px',
                                color: '#5E6278', background: '#FFFFFF', cursor: 'pointer', fontWeight: 500,
                            }}>
                                <Calendar size={15} color="#A1A5B7" /> Last 30 days
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading students...</p>
                        </div>
                    ) : displayStudents.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#A1A5B7' }}>
                            <GraduationCap size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px' }}>No Students Found</h3>
                            <p style={{ fontSize: '13px' }}>Try adjusting your search or add a new student.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        <th style={{ padding: '13px 20px', textAlign: 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', width: '50px' }}>
                                            <input type="checkbox" style={{ accentColor: '#4F60FF', width: '15px', height: '15px' }} />
                                        </th>
                                        {['Student Name', 'Roll', 'Address', 'Class', 'Date of Birth', 'Phone', 'Action'].map(h => (
                                            <th key={h} style={{
                                                padding: '13px 16px', textAlign: 'left',
                                                color: '#A1A5B7', fontWeight: 600, fontSize: '11px',
                                                textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
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
                                            style={{ borderBottom: '1px solid #F0F0F5', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 20px' }}>
                                                <input type="checkbox" style={{ accentColor: '#4F60FF', width: '15px', height: '15px' }} defaultChecked={i === 1} />
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=4F60FF&color=fff&size=36`}
                                                        style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #EEF0FF', flexShrink: 0 }}
                                                        alt={s.name}
                                                    />
                                                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>{s.roll}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8F92A1' }}>{s.address}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    background: '#EEF0FF', color: '#4F60FF',
                                                    padding: '3px 10px', borderRadius: '50px',
                                                    fontSize: '12px', fontWeight: 700,
                                                }}>
                                                    Class {s.className}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8F92A1' }}>{s.dob}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8F92A1' }}>{s.phone}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        style={{
                                                            background: '#FEE2E2', border: 'none', cursor: 'pointer',
                                                            color: '#EF4444', width: '30px', height: '30px', borderRadius: '8px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#FECACA')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = '#FEE2E2')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        style={{
                                                            background: '#EEF0FF', border: 'none', cursor: 'pointer',
                                                            color: '#4F60FF', width: '30px', height: '30px', borderRadius: '8px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={e => {
                                                            (e.currentTarget as HTMLElement).style.background = '#4F60FF';
                                                            (e.currentTarget as HTMLElement).style.color = 'white';
                                                        }}
                                                        onMouseLeave={e => {
                                                            (e.currentTarget as HTMLElement).style.background = '#EEF0FF';
                                                            (e.currentTarget as HTMLElement).style.color = '#4F60FF';
                                                        }}
                                                        onClick={() => router.push(`/admin/students/${s.mongo_id}`)}
                                                    >
                                                        <Edit2 size={14} />
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
                    <div style={{
                        padding: '16px 24px', borderTop: '1px solid #F0F0F5',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500 }}>
                            Showing <span style={{ color: '#1A1D3B', fontWeight: 700 }}>1-{displayStudents.length}</span> of <span style={{ color: '#1A1D3B', fontWeight: 700 }}>{displayStudents.length}</span> students
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button style={{
                                background: '#F4F5F9', border: '1px solid #F0F0F5', cursor: 'pointer',
                                color: '#5E6278', padding: '7px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                            }}>
                                <ChevronLeft size={16} />
                            </button>
                            {[1, 2, 3, 4, 5].map(p => (
                                <button
                                    key={p}
                                    style={{
                                        background: p === 1 ? 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)' : '#F4F5F9',
                                        color: p === 1 ? 'white' : '#5E6278',
                                        border: '1px solid #F0F0F5', width: '34px', height: '34px',
                                        borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                                        boxShadow: p === 1 ? '0 4px 10px rgba(79,96,255,0.25)' : 'none',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                            <span style={{ color: '#A1A5B7', padding: '0 4px' }}>...</span>
                            <button style={{
                                background: '#F4F5F9', border: '1px solid #F0F0F5', color: '#5E6278',
                                width: '34px', height: '34px', borderRadius: '8px', fontWeight: 700,
                                cursor: 'pointer', fontSize: '13px',
                            }}>
                                100
                            </button>
                            <button style={{
                                background: '#F4F5F9', border: '1px solid #F0F0F5', cursor: 'pointer',
                                color: '#5E6278', padding: '7px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                            }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Student">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>First Name</label>
                            <input required style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Last Name</label>
                            <input required style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Email</label>
                            <input type="email" style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Phone</label>
                            <input required style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Date of Birth</label>
                            <input type="date" required style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Gender</label>
                            <select style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Assign Class / Batch</label>
                        <select 
                            style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} 
                            value={formData.class_id} 
                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                        >
                            <option value="">Select a Class...</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Previous School</label>
                        <input style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '10px 22px', background: '#F4F5F9', color: '#5E6278', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,96,255,0.3)' }}>Save Student</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

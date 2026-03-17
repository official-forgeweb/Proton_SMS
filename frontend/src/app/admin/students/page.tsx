'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    Search, Calendar, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    
    // For demo purposes if the API is empty
    const dummyStudents = [
        { id: 1, first_name: 'Eleanor', last_name: 'Pena', roll: '#01', address: 'TA-107 Newyork', className: '01', dob: '02/05/2001', phone: '+123 6988567' },
        { id: 2, first_name: 'Jessia', last_name: 'Rose', roll: '#10', address: 'TA-107 Newyork', className: '02', dob: '03/04/2000', phone: '+123 8988569' },
        { id: 3, first_name: 'Jenny', last_name: 'Wilson', roll: '#04', address: 'Australia, Sydney', className: '01', dob: '12/05/2001', phone: '+123 7988566' },
        { id: 4, first_name: 'Guy', last_name: 'Hawkins', roll: '#03', address: 'Australia, Sydney', className: '02', dob: '03/05/2001', phone: '+123 5988565' },
        { id: 5, first_name: 'Jacob', last_name: 'Jones', roll: '#15', address: 'Australia, Sydney', className: '04', dob: '12/05/2001', phone: '+123 9988568' },
        { id: 6, first_name: 'Jacob', last_name: 'Jones', roll: '#15', address: 'Australia, Sydney', className: '04', dob: '12/05/2001', phone: '+123 9988568' },
        { id: 7, first_name: 'Jane', last_name: 'Cooper', roll: '#01', address: 'Australia, Sydney', className: '04', dob: '12/03/2001', phone: '+123 6988566' },
        { id: 8, first_name: 'Floyd', last_name: 'Miles', roll: '#11', address: 'TA-107 Newyork', className: '01', dob: '03/05/2002', phone: '+123 5988569' },
        { id: 9, first_name: 'Floyd', last_name: 'Miles', roll: '#11', address: 'TA-107 Newyork', className: '01', dob: '03/05/2002', phone: '+123 5988569' },
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
                // Fallback to dummy data for UI display if API throws error
                setStudents(dummyStudents);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [search]);

    const displayStudents = students.map(s => {
        // Map backend to design fields if needed
        return {
            id: s.id,
            name: `${s.first_name || s.name || ''} ${s.last_name || ''}`.trim(),
            roll: s.roll || s.PRO_ID || '#00',
            address: s.address || 'Unknown',
            className: s.className || s.classes?.[0]?.name || '01',
            dob: s.dob || s.date_of_birth || '01/01/2001',
            phone: s.phone || '+123 0000000',
        };
    });

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '8px 0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Students List</h1>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '4px' }}>
                            Home / <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Students</span>
                        </p>
                    </div>
                    <button 
                        style={{ 
                            background: 'var(--primary)', color: 'white', border: 'none', 
                            borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '14px', 
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
                        }}
                    >
                        <Plus size={18} /> Add Students
                    </button>
                </div>

                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Header inside card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Students Information</h2>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-full)', padding: '10px 20px', width: '280px',
                                border: '1px solid var(--border-primary)'
                            }}>
                                <input 
                                    className="input-field"
                                    placeholder="Search by name or roll"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', padding: 0 }}
                                />
                                <Search size={16} color="var(--primary)" />
                            </div>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                                borderRadius: 'var(--radius-full)', border: '1px solid var(--border-primary)', fontSize: '13px', color: 'var(--text-secondary)'
                            }}>
                                <Calendar size={16} /> Last 30 days
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', width: '50px' }}>
                                        <input type="checkbox" style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border-secondary)' }} />
                                    </th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>STUDENTS NAME</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>ROLL</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>ADDRESS</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>CLASS</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>DATE OF BIRTH</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>PHONE</th>
                                    <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--border-primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStudents.map((s, i) => (
                                    <tr key={s.id || i} style={{ borderBottom: '1px solid var(--border-primary)', background: i === 1 ? 'var(--primary-50)' : 'transparent', borderRadius: 'var(--radius-md)' }}>
                                        <td style={{ padding: '16px', textAlign: 'left' }}>
                                            <input type="checkbox" style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', borderRadius: '4px' }} defaultChecked={i === 1} />
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt={s.name} />
                                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{s.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.roll}</td>
                                        <td style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.address}</td>
                                        <td style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.className}</td>
                                        <td style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.dob}</td>
                                        <td style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.phone}</td>
                                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={16} /></button>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Edit2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '8px' }}><ChevronLeft size={20} /></button>
                            <button style={{ background: 'var(--primary)', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>1</button>
                            <button style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>2</button>
                            <button style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>3</button>
                            <button style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>4</button>
                            <button style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>5</button>
                            <MoreHorizontal size={20} color="var(--text-tertiary)" style={{ margin: '0 8px' }} />
                            <button style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>100</button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px' }}><ChevronRight size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            10 / page
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

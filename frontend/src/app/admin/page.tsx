'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    Users, GraduationCap, DollarSign, Bell, MoreVertical, LayoutDashboard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';

interface DashboardData {
    stats: {
        students: { total: number; active: number };
        teachers: { total: number; active: number };
        parents?: { total: number };
        classes: { total: number; active: number };
        enquiries: { total: number; new: number };
        demos: { total: number; completed: number };
        revenue: { total: number; pending: number };
    };
    recent_activity: Array<{
        type: string;
        message: string;
        time: string;
    }>;
}

const barChartData = [
    { name: 'Jan', Teacher: 65000, Student: 48000 },
    { name: 'Feb', Teacher: 38000, Student: 53000 },
    { name: 'Mar', Teacher: 79000, Student: 58000 },
    { name: 'Apr', Teacher: 118000, Student: 89000 },
    { name: 'May', Teacher: 51000, Student: 62000 },
    { name: 'Jun', Teacher: 81000, Student: 54000 },
    { name: 'Jul', Teacher: 32000, Student: 42000 },
    { name: 'Aug', Teacher: 78000, Student: 30000 },
    { name: 'Sep', Teacher: 110000, Student: 61000 },
    { name: 'Oct', Teacher: 53000, Student: 39000 },
    { name: 'Nov', Teacher: 68000, Student: 48000 },
];

const radialData = [
    { name: 'Female', value: 7000, fill: '#F97316' },
    { name: 'Male', value: 8000, fill: '#9333EA' },
];

const starStudents = [
    { name: 'Evelyn Harper', id: 'PRE43178', marks: 1185, percent: '98%', year: 2024, avatar: 'e' },
    { name: 'Diana Plenty', id: 'PRE43174', marks: 1165, percent: '91%', year: 2024, avatar: 'd' },
    { name: 'John Millar', id: 'PRE43187', marks: 1175, percent: '92%', year: 2024, avatar: 'j' },
    { name: 'Miles Esther', id: 'PRE43371', marks: 1180, percent: '93%', year: 2024, avatar: 'm' },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/admin');
                setData(res.data.data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const formatShort = (amount: number) => {
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };

    const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
        <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>{label}</p>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</h3>
            </div>
            <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
            }}>
                <Icon size={32} />
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '24px 0' }}>Loading...</div>
            </DashboardLayout>
        );
    }

    const stats = data?.stats;

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '8px 0 24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Admin Dashboard</h1>
                
                {/* 4 Top Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <StatCard 
                        label="Students" value={stats?.students.total ? formatShort(stats.students.total) : '15.00K'} 
                        icon={GraduationCap} color="#9333EA" bgColor="#F3E8FF" 
                    />
                    <StatCard 
                        label="Teachers" value={stats?.teachers.total ? formatShort(stats.teachers.total) : '2.00K'} 
                        icon={Users} color="#0EA5E9" bgColor="#E0F2FE" 
                    />
                    <StatCard 
                        label="Parents" value={stats?.parents?.total ? formatShort(stats.parents.total) : '5.6K'} 
                        icon={Users} color="#F97316" bgColor="#FFEDD5" 
                    />
                    <StatCard 
                        label="Earnings" value={stats?.revenue.total ? `$${formatShort(stats.revenue.total)}` : '$19.3K'} 
                        icon={DollarSign} color="#10B981" bgColor="#D1FAE5" 
                    />
                </div>

                {/* Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    {/* Bar Chart */}
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>All Exam Result</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Students & Teacher</p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333EA' }} /> Teacher</span>
                                <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316' }} /> Student</span>
                            </div>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} tickFormatter={(val) => `${val/1000}k`} />
                                    <Tooltip cursor={{fill: 'var(--bg-tertiary)'}} />
                                    <Bar dataKey="Teacher" fill="#9333EA" radius={[4, 4, 4, 4]} barSize={8} />
                                    <Bar dataKey="Student" fill="#F97316" radius={[4, 4, 4, 4]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Radial Chart */}
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Students</h3>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={16} color="var(--text-tertiary)" /></button>
                        </div>
                        <div style={{ height: '240px', width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={16} data={radialData}>
                                    <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            {/* Center Label for Radial */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total</p>
                                <p style={{ fontSize: '24px', fontWeight: 800 }}>15000</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9333EA' }} /> Male</span>
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F97316' }} /> Female</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Star Students Table */}
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Star Students</h3>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={16} color="var(--text-tertiary)" /></button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}></th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}>Name</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}>ID</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}>Marks</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}>Percent</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '14px' }}>Year</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {starStudents.map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', width: '40px' }}>
                                                <input type="checkbox" style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border-secondary)' }} defaultChecked={i===1} />
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={`https://ui-avatars.com/api/?name=${s.name}&background=random&color=fff`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt={s.name} />
                                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.id}</td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.marks}</td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', fontSize: '14px', fontWeight: 600 }}>{s.percent}</td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', fontSize: '14px', color: 'var(--text-secondary)' }}>{s.year}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* All Exam Results Side Panel */}
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>All Exam Results</h3>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={16} color="var(--text-tertiary)" /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', flexShrink: 0 }}>
                                    <Users size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>New Teacher</h4>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Just now</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>It is a long established readable..</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', flexShrink: 0 }}>
                                    <DollarSign size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Fees Structure</h4>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Today</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>It is a long established readable..</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                                    <GraduationCap size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>New Course</h4>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>24 Sep 2023</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>It is a long established readable..</p>
                                </div>
                            </div>
                        </div>
                        <button style={{ 
                            width: '100%', padding: '12px', background: 'var(--primary-50)', color: 'var(--primary)',
                            border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '24px', transition: 'all 0.2s' 
                        }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--primary-100)'} onMouseLeave={(e)=>e.currentTarget.style.background='var(--primary-50)'}>
                            View All
                        </button>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}

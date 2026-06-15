'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, Users, BookOpen, Clock, Filter, Search, ChevronRight, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/ui/CustomSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AdminAttendancePage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [selectedDate, selectedClassId]);

    const fetchInitialData = async () => {
        try {
            const classRes = await api.get('/classes');
            setClasses(classRes.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const params: any = { date: selectedDate };
            if (selectedClassId) params.class_id = selectedClassId;
            
            const res = await api.get('/timetable', { params });
            setSessions(res.data.data.filter((i: any) => i.type === 'class'));
        } catch (err) {
            console.error(err);
            toast.error('Failed to load schedule');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSessions = sessions.filter(s => 
        s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class_ref.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.teacher?.first_name + ' ' + s.teacher?.last_name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B' }}>Attendance Management</h1>
                        <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Monitor and manage attendance across all batches and subjects.</p>
                    </div>
                    <button 
                        onClick={() => router.push('/admin/attendance/register')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
                    >
                        <Users size={16} /> View Attendance Register
                    </button>
                </div>

                {/* Filters Bar */}
                <div style={{ 
                    background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', 
                    display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by subject, batch, or teacher..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="#6366F1" />
                            <DatePicker
                                selected={selectedDate ? new Date(selectedDate) : new Date()}
                                onChange={(date: Date | null) => {
                                    if (date) {
                                        const yyyy = date.getFullYear();
                                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                                        const dd = String(date.getDate()).padStart(2, '0');
                                        setSelectedDate(`${yyyy}-${mm}-${dd}`);
                                    }
                                }}
                                dateFormat="dd-MM-yyyy"
                                customInput={
                                    <input 
                                        style={{ 
                                            padding: '10px', 
                                            borderRadius: '10px', 
                                            border: '1px solid #E2E8F0', 
                                            fontWeight: 600, 
                                            color: '#1E293B',
                                            cursor: 'pointer',
                                            width: '120px',
                                            outline: 'none'
                                        }} 
                                    />
                                }
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} color="#6366F1" />
                            <div style={{ minWidth: '150px' }}>
                                <CustomSelect
                                    value={selectedClassId}
                                    onChange={val => setSelectedClassId(val)}
                                    placeholder="All Batches"
                                    options={[
                                        { value: '', label: 'All Batches' },
                                        ...classes.map(c => ({ value: c.id, label: c.class_name }))
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '220px', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0', animation: 'pulse 2s infinite' }} />)}
                        </div>
                    ) : filteredSessions.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                            {filteredSessions.map((session) => (
                                <div 
                                    key={session.id} 
                                    className="card" 
                                    style={{ 
                                        padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.3s',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                    }}
                                    onClick={() => router.push(`/admin/attendance/${session.id}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                                        e.currentTarget.style.borderColor = '#6366F1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ padding: '8px', background: '#F5F3FF', borderRadius: '12px' }}>
                                                <BookOpen size={24} color="#6366F1" />
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                                {session.class_ref.class_code}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>{session.subject}</h3>
                                        <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>{session.class_ref.class_name}</p>
                                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontSize: '13px', fontWeight: 700 }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                {session.teacher?.first_name?.[0] || 'T'}
                                            </div>
                                            {session.teacher ? `${session.teacher.first_name} ${session.teacher.last_name}` : 'Unassigned'}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                                            <Clock size={16} /> {session.start_time} - {session.end_time || 'N/A'}
                                        </div>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ChevronRight size={18} color="#6366F1" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'white', borderRadius: '32px', border: '1px dashed #CBD5E1' }}>
                            <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <Calendar size={40} color="#94A3B8" />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B' }}>No Sessions Found</h3>
                            <p style={{ color: '#64748B', marginTop: '8px', fontSize: '16px' }}>Try adjusting your filters or date selection.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

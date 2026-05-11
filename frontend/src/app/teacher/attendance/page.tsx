'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { UserCheck, Clock, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useRouter } from 'next/navigation';

export default function TeacherAttendancePage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSessions();
    }, [selectedDate]);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            // Use the timetable API which already handles teacher sessions
            const res = await api.get('/timetable', { params: { date: selectedDate } });
            setSessions(res.data.data.filter((i: any) => i.type === 'class'));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PermissionGuard permissionKey="attendance">
            <DashboardLayout requiredRole="teacher">
                <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="page-header" style={{ marginBottom: '32px' }}>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B' }}>Class Register</h1>
                            <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>
                                Mark and manage attendance for your scheduled classes.
                            </p>
                        </div>
                        <div style={{ background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Calendar size={18} color="#6366F1" />
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontWeight: 700, color: '#1E293B', fontSize: '15px' }}
                            />
                        </div>
                    </div>

                    <div className="page-body">
                        {isLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '200px', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0', animation: 'pulse 2s infinite' }} />
                                ))}
                            </div>
                        ) : sessions.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                {sessions.map((session) => (
                                    <div 
                                        key={session.id} 
                                        className="card" 
                                        style={{ 
                                            padding: '24px', 
                                            borderRadius: '24px', 
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            border: '1px solid #E2E8F0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                        onClick={() => router.push(`/teacher/attendance/${session.id}`)}
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
                                                <div style={{ padding: '8px', background: '#EEF2FF', borderRadius: '12px' }}>
                                                    <BookOpen size={24} color="#6366F1" />
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                                        {session.class_ref.class_code}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{session.subject}</h3>
                                            <p style={{ color: '#64748B', fontSize: '15px', fontWeight: 500 }}>{session.class_ref.class_name}</p>
                                        </div>

                                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                                                    <Clock size={16} /> {session.start_time} - {session.end_time || 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                <ChevronRight size={20} color="#6366F1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Calendar size={40} color="#94A3B8" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>No Classes Scheduled</h3>
                                <p style={{ color: '#64748B', marginTop: '8px' }}>There are no classes scheduled for you on this date.</p>
                            </div>
                        )}
                    </div>
                </div>
                <ToolBottomBar />
            </DashboardLayout>
        </PermissionGuard>
    );
}

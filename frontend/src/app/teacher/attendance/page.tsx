'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import { Clock, BookOpen, Calendar, ChevronRight, Sparkles, BookMarked } from 'lucide-react';
import api from '@/lib/api';
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

    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
            border-radius: 24px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .glass-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 36px rgba(229, 57, 53, 0.06);
            border-color: rgba(229, 57, 53, 0.2);
        }
        .bg-mesh {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(229,57,53,0.03) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(229,57,53,0.02) 0px, transparent 50%);
        }
    `;

    return (
        <PermissionGuard permissionKey="attendance">
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{ __html: customStyles }} />
                
                <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '100px' }}>
                    
                    {/* Header */}
                    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                    <BookMarked size={20} strokeWidth={2.5} />
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                    Attendance Register
                                </h1>
                            </div>
                            <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                                Track, mark and inspect student attendance registers.
                            </p>
                        </div>
                        
                        {/* Date Picker */}
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            padding: '10px 18px', 
                            borderRadius: '16px', 
                            border: '1.5px solid rgba(226, 232, 240, 0.8)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s'
                        }}
                        onFocusCapture={(e) => {
                            e.currentTarget.style.borderColor = '#E53935';
                            e.currentTarget.style.boxShadow = '0 4px 18px rgba(229, 57, 53, 0.05)';
                        }}
                        onBlurCapture={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                            e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.02)';
                        }}
                        >
                            <Calendar size={18} color="#E53935" />
                            <input 
                                type="date" 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontWeight: 700, color: '#1E293B', fontSize: '14px', background: 'transparent' }}
                            />
                        </div>
                    </div>

                    <div className="page-body">
                        {isLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '200px', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0', opacity: 0.6, animation: 'pulse 2s infinite' }} />
                                ))}
                            </div>
                        ) : sessions.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                {sessions.map((session, idx) => (
                                    <div 
                                        key={session.id} 
                                        className="glass-card animate-fade-in" 
                                        style={{ 
                                            padding: '24px',
                                            animationDelay: `${idx * 40}ms`
                                        }}
                                        onClick={() => router.push(`/teacher/attendance/${session.id}`)}
                                        onMouseEnter={(e) => {
                                            const btn = e.currentTarget.querySelector('.arrow-btn') as HTMLElement;
                                            if (btn) {
                                                btn.style.background = 'rgba(229, 57, 53, 0.1)';
                                                btn.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            const btn = e.currentTarget.querySelector('.arrow-btn') as HTMLElement;
                                            if (btn) {
                                                btn.style.background = '#F8FAFC';
                                                btn.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                                                <div style={{ padding: '8px', background: 'rgba(229, 57, 53, 0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <BookOpen size={20} color="#E53935" />
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', background: 'rgba(229, 57, 53, 0.08)', padding: '5px 10px', borderRadius: '50px', letterSpacing: '0.03em' }}>
                                                        {session.class_ref.class_code}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1E293B', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }}>
                                                {session.subject}
                                            </h3>
                                            <p style={{ color: '#5E6278', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                                                {session.class_ref.class_name}
                                            </p>
                                        </div>

                                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(241, 245, 249, 0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                                                <Clock size={14} color="#A1A5B7" /> 
                                                <span>{session.start_time} - {session.end_time || 'N/A'}</span>
                                            </div>
                                            <div className="arrow-btn" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                                                <ChevronRight size={18} color="#E53935" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <div style={{ width: '80px', height: '80px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Sparkles size={36} color="#94A3B8" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B' }}>No Classes Scheduled</h3>
                                <p style={{ color: '#64748B', marginTop: '6px', fontSize: '15px' }}>There are no sessions scheduled for you on this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </PermissionGuard>
    );
}

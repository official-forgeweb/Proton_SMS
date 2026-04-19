'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { BookOpen, Users, Clock, Calendar, ChevronRight, GraduationCap } from 'lucide-react';

export default function TeacherClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/classes');
                const classList = res.data.data || [];
                setClasses(classList.map((cls: any) => ({
                    ...cls,
                    student_count: cls.current_students_count || 0,
                })));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Get schedule time for a class
    const getClassTime = (cls: any) => {
        if (cls.schedule && cls.schedule.length > 0) {
            const sched = cls.schedule[0];
            if (sched.time_start && sched.time_end) {
                return `${sched.time_start} - ${sched.time_end}`;
            }
        }
        if (cls.class_time_start && cls.class_time_end) {
            return `${cls.class_time_start} - ${cls.class_time_end}`;
        }
        return null;
    };

    // Get subjects for a class
    const getClassSubjects = (cls: any): string[] => {
        if (!cls.schedule) return [];
        return [...new Set(cls.schedule.map((s: any) => s.subject).filter(Boolean))] as string[];
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
        <PermissionGuard permissionKey="classes">
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    .class-card {
                        background: #FFFFFF; border-radius: 20px; padding: 0; border: 1px solid #E2E8F0;
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    }
                    .class-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 32px rgba(0,0,0,0.08);
                        border-color: #E53935;
                    }
                    .animate-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                `}} />

                <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #E53935, #B71C1C)', width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                        <BookOpen size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em' }}>My Classes</h1>
                        <p style={{ color: '#5E6278', fontSize: '14px', margin: 0, fontWeight: 500 }}>Manage your assigned batches and student enrollments.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-in" style={{ height: '220px', borderRadius: '20px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s infinite, fadeInUp 0.5s forwards`, animationDelay: `${i * 80}ms`, opacity: 0 }} />
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="animate-in" style={{ textAlign: 'center', padding: '80px', background: '#F8F9FD', borderRadius: '24px' }}>
                        <BookOpen size={56} style={{ marginBottom: '16px', color: '#A1A5B7', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>No Classes Assigned</h3>
                        <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500 }}>You have no classes assigned yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                        {classes.map((cls: any, idx: number) => {
                            const time = getClassTime(cls);
                            const subjects = getClassSubjects(cls);
                            return (
                                <div key={cls.id} className="class-card animate-in" style={{ animationDelay: `${idx * 60}ms` }}>
                                    {/* Top accent bar */}
                                    <div style={{ height: '4px', background: 'linear-gradient(90deg, #E53935 0%, #FF6B6B 100%)' }} />

                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#E53935', background: '#FFF0F1', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                                                    {cls.batch_type?.toUpperCase() || 'REGULAR'} BATCH
                                                </span>
                                                <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '10px', color: '#1A1D3B', letterSpacing: '-0.01em' }}>{cls.class_name}</h3>
                                                {cls.class_code && (
                                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8F92A1', fontWeight: 600 }}>{cls.class_code}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info row */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                            {time && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Clock size={14} color="#3B82F6" />
                                                    </div>
                                                    {time}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5E6278', fontWeight: 600 }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={14} color="#16A34A" />
                                                </div>
                                                <span style={{ fontWeight: 800, color: '#1A1D3B' }}>{cls.student_count || 0}</span> Students enrolled
                                            </div>
                                        </div>

                                        {/* Subject tags */}
                                        {subjects.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                                                {subjects.map(sub => {
                                                    const sc = subjectColors[sub] || { bg: '#F1F2F6', color: '#5E6278' };
                                                    return (
                                                        <span key={sub} style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: sc.bg, color: sc.color }}>
                                                            {sub}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                style={{
                                                    flex: 1, padding: '11px', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
                                                    background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', color: 'white',
                                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(229,57,53,0.2)'
                                                }}
                                                onClick={() => window.location.href = `/teacher/students`}
                                            >
                                                <Users size={15} /> View Students
                                            </button>
                                            <button
                                                style={{
                                                    flex: 1, padding: '11px', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
                                                    background: '#FFFFFF', color: '#1A1D3B',
                                                    border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => window.location.href = `/teacher/attendance`}
                                            >
                                                <Calendar size={15} /> Attendance
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DashboardLayout>
        </PermissionGuard>
    );
}

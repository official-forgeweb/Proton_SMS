'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { PenTool, Plus, Clock, Users, FileText, Calendar, BookOpen, AlertCircle, CheckCircle, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherHomeworkPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [homework, setHomework] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHomework();
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const fetchHomework = () => {
        api.get('/homework')
            .then(res => setHomework(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    // Calculate premium quick-stats
    const totalAssignments = homework.length;
    const totalSubmissions = homework.reduce((acc, hw) => acc + (hw.submitted || 0), 0);
    const totalExpected = homework.reduce((acc, hw) => acc + (hw.total_students || 0), 0);
    const overallSubmissionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;
    const activeAssignments = homework.filter(hw => new Date(hw.due_date) >= new Date()).length;
    const overdueAssignments = homework.filter(hw => new Date(hw.due_date) < new Date()).length;

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
            border-radius: 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 36px rgba(229, 57, 53, 0.06);
            border-color: rgba(229, 57, 53, 0.15);
        }
        .bg-mesh {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(229,57,53,0.03) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(229,57,53,0.02) 0px, transparent 50%);
        }
        .gradient-btn {
            background: linear-gradient(135deg, #E53935 0%, #B71C1C 100%);
            box-shadow: 0 4px 14px rgba(229,57,53,0.25);
            transition: all 0.25s ease;
        }
        .gradient-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(229,57,53,0.35);
            opacity: 0.95;
        }
    `;

    return (
        <PermissionGuard permissionKey="homework">
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{ __html: customStyles }} />
                
                <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '120px' }}>
                    
                    {/* Header */}
                    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                    <PenTool size={20} strokeWidth={2.5} />
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                    Homework Assignments
                                </h1>
                            </div>
                            <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                                Assign, manage, and track student homework submission rates.
                            </p>
                        </div>
                        
                        <button 
                            className="gradient-btn"
                            onClick={() => router.push('/teacher/homework/assign')}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '14px', 
                                padding: '12px 24px', 
                                fontSize: '15px', 
                                fontWeight: 700, 
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={20} strokeWidth={2.5} /> Assign Homework
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="animate-fade-in animate-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        {[
                            { label: 'Total Assigned', value: totalAssignments, icon: PenTool, color: '#E53935', bg: 'rgba(229, 57, 53, 0.08)' },
                            { label: 'Active Tasks', value: activeAssignments, icon: Clock, color: '#F97316', bg: 'rgba(249, 115, 22, 0.08)' },
                            { label: 'Overdue Tasks', value: overdueAssignments, icon: AlertCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
                            { label: 'Submission Rate', value: `${overallSubmissionRate}%`, icon: BarChart3, color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' }
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', color: stat.color, flexShrink: 0, justifyContent: 'center' }}>
                                        <Icon size={24} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>{stat.value}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#8F92A1', marginTop: '4px' }}>{stat.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Content Area */}
                    <div className="animate-fade-in animate-delay-2">
                        {isLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="glass-card" style={{ height: '220px', opacity: 0.6 }} />
                                ))}
                            </div>
                        ) : homework.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px', border: '2px dashed rgba(229, 57, 53, 0.15)' }}>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(229, 57, 53, 0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#E53935' }}>
                                    <PenTool size={36} />
                                </div>
                                <h3 style={{ fontSize: '20px', color: '#1A1D3B', fontWeight: 800, marginBottom: '8px' }}>No Homework Found</h3>
                                <p style={{ color: '#8F92A1', fontSize: '15px', fontWeight: 500, maxWidth: '400px', margin: '0 auto 24px' }}>
                                    You have not assigned any homework yet. Tap the button below to assign one.
                                </p>
                                <button 
                                    className="gradient-btn"
                                    onClick={() => router.push('/teacher/homework/assign')}
                                    style={{ 
                                        color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' 
                                    }}
                                >
                                    Assign First Homework
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {homework.map((hw, idx) => {
                                    const isPastDue = new Date(hw.due_date) < new Date();
                                    const isDueToday = new Date(hw.due_date).toDateString() === new Date().toDateString();
                                    const submittedPct = hw.total_students > 0 ? Math.round((hw.submitted / hw.total_students) * 100) : 0;
                                    
                                    // Set border outline style depending on urgency
                                    let urgencyStyle = { border: '1px solid rgba(226, 232, 240, 0.8)' };
                                    if (isPastDue) {
                                        urgencyStyle = { border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.02)' } as any;
                                    } else if (isDueToday) {
                                        urgencyStyle = { border: '1px solid rgba(245, 158, 11, 0.25)', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.02)' } as any;
                                    }

                                    return (
                                        <div key={hw.id} className="glass-card" style={{ ...urgencyStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            {/* Top Banner Accent */}
                                            <div style={{ height: '4px', background: isPastDue ? '#EF4444' : isDueToday ? '#F59E0B' : 'linear-gradient(90deg, #E53935 0%, #FF8A80 100%)' }} />
                                            
                                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* Header Status Badges */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(229, 57, 53, 0.06)', color: '#E53935', padding: '4px 10px', borderRadius: '50px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                        {hw.class_name || 'Class'}
                                                    </span>
                                                    
                                                    {isPastDue ? (
                                                        <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', padding: '4px 10px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <AlertCircle size={11} /> PAST DUE
                                                        </span>
                                                    ) : isDueToday ? (
                                                        <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(245, 158, 11, 0.08)', color: '#D97706', padding: '4px 10px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={11} /> DUE TODAY
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', padding: '4px 10px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <CheckCircle size={11} /> ACTIVE
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Homework Info */}
                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em', marginBottom: '4px', lineHeight: 1.25 }}>
                                                    {hw.title}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5E6278', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                                                    <BookOpen size={13} color="#A1A5B7" /> {hw.subject || 'General'}
                                                </div>

                                                {/* Dates Grid */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(248, 250, 252, 0.6)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #F1F5F9' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>Assigned</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} color="#A1A5B7" /> {hw.assigned_date}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>Due Date</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: isPastDue ? '#EF4444' : isDueToday ? '#D97706' : '#1A1D3B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={12} color={isPastDue ? '#EF4444' : isDueToday ? '#D97706' : '#A1A5B7'} /> {hw.due_date}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar & Submissions Info */}
                                                <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#5E6278', marginBottom: '8px' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> Submissions</span>
                                                        <span style={{ color: '#1A1D3B' }}>{hw.submitted} / {hw.total_students} ({submittedPct}%)</span>
                                                    </div>
                                                    
                                                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '50px', overflow: 'hidden' }}>
                                                        <div 
                                                            style={{ 
                                                                width: `${submittedPct}%`, 
                                                                height: '100%', 
                                                                background: submittedPct === 100 
                                                                    ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                                                                    : 'linear-gradient(90deg, #E53935 0%, #FF8A80 100%)', 
                                                                borderRadius: '50px',
                                                                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                                                            }} 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Action Trigger */}
                                                <Link href={`/teacher/homework/${hw.id}`} style={{ textDecoration: 'none' }}>
                                                    <button
                                                        style={{ 
                                                            width: '100%', 
                                                            padding: '12px', 
                                                            borderRadius: '12px', 
                                                            background: 'white', 
                                                            color: '#E53935', 
                                                            border: '1.5px solid rgba(229, 57, 53, 0.25)', 
                                                            fontWeight: 800, 
                                                            fontSize: '14px', 
                                                            cursor: 'pointer', 
                                                            transition: 'all 0.2s',
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: '6px'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'rgba(229, 57, 53, 0.05)';
                                                            e.currentTarget.style.borderColor = '#E53935';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.25)';
                                                        }}
                                                    >
                                                        <FileText size={15} /> View Submissions <ChevronRight size={15} />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </PermissionGuard>
    );
}

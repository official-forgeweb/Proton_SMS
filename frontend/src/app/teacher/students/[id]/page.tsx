'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    User, Phone, Mail, GraduationCap, Activity, ArrowLeft,
    TrendingUp, BookOpen, Target, Award, Calendar, BarChart3,
    Clock, Check, X, AlertCircle, MessageSquare, Send, Sparkles, Info
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StudentAttendanceCalendar from '@/components/StudentAttendanceCalendar';
import StudentProfileEnquiries from '@/components/StudentProfileEnquiries';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function TeacherStudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [attendance, setAttendance] = useState<any>(null);
    const [testStats, setTestStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [homeworkHistory, setHomeworkHistory] = useState<any>(null);
    const [queries, setQueries] = useState<any[]>([]);

    // Remarks state
    const [remarks, setRemarks] = useState<any[]>([]);
    const [newRemark, setNewRemark] = useState('');
    const [remarkType, setRemarkType] = useState('general');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/students/${params.id}`);
            setStudent(res.data.data);
        } catch (error) {
            console.error('Error fetching student details', error);
        } finally {
            setIsLoading(false);
        }

        // Fetch reports and remarks in parallel
        const [attRes, testRes, perfRes, hwRes, remarksRes, queriesRes] = await Promise.allSettled([
            api.get(`/students/${params.id}/attendance`),
            api.get(`/students/${params.id}/tests`),
            api.get(`/students/${params.id}/performance`),
            api.get(`/students/${params.id}/homework-history`),
            api.get(`/students/${params.id}/remarks`),
            api.get(`/queries`, { params: { student_id: params.id } })
        ]);
        
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.data.data);
        if (testRes.status === 'fulfilled') setTestStats(testRes.value.data.data);
        if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data.data);
        if (hwRes.status === 'fulfilled') setHomeworkHistory(hwRes.value.data.data);
        if (queriesRes && queriesRes.status === 'fulfilled') setQueries(queriesRes.value.data.data || []);
        if (remarksRes.status === 'fulfilled') setRemarks(remarksRes.value.data.data);
    };

    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRemark.trim()) return;
        setIsSubmittingRemark(true);
        try {
            const res = await api.post(`/students/${params.id}/remarks`, {
                remark: newRemark.trim(),
                remark_type: remarkType
            });
            if (res.data.success) {
                setRemarks([res.data.data, ...remarks]);
                setNewRemark('');
                setRemarkType('general');
            }
        } catch (error) {
            console.error('Error adding remark:', error);
        } finally {
            setIsSubmittingRemark(false);
        }
    };

    const getScoreColor = (pct: number) => {
        if (pct >= 85) return 'var(--success)';
        if (pct >= 70) return 'var(--info)';
        if (pct >= 50) return 'var(--warning)';
        return 'var(--primary)';
    };

    const getScoreBg = (pct: number) => {
        if (pct >= 85) return 'var(--success-light)';
        if (pct >= 70) return 'var(--info-light)';
        if (pct >= 50) return 'var(--warning-light)';
        return 'var(--primary-light)';
    };

    const getGradeLabel = (pct: number) => {
        if (pct >= 90) return 'A+'; 
        if (pct >= 80) return 'A'; 
        if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B'; 
        if (pct >= 50) return 'C'; 
        return 'D';
    };

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                    .skeleton-pulse { background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 4s infinite linear; border-radius: 16px; }
                `}} />
                <div style={{ padding: '32px' }}>
                    <div className="skeleton-pulse" style={{ height: '140px', marginBottom: '24px', borderRadius: '24px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '100px' }} />)}
                    </div>
                    <div className="skeleton-pulse" style={{ height: '400px', borderRadius: '24px' }} />
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout requiredRole="teacher">
                <div className="bg-mesh min-h-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div className="glass-panel" style={{ padding: '48px', borderRadius: '24px', textAlign: 'center', maxWidth: '480px', border: '1px solid rgba(229,57,53,0.1)' }}>
                        <GraduationCap size={64} color="var(--primary)" style={{ margin: '0 auto 20px auto', opacity: 0.8 }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Student Profile Not Found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px', lineHeight: 1.6 }}>
                            The student profile you are trying to view could not be retrieved. It may have been relocated or the ID is incorrect.
                        </p>
                        <button 
                            onClick={() => router.push('/teacher/students')} 
                            className="btn btn-primary"
                            style={{ marginTop: '24px', width: '100%', padding: '12px 24px' }}
                        >
                            <ArrowLeft size={16} /> Back to Student List
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const attPct = parseFloat(attendance?.summary?.percentage || 0);
    const avgScore = parseFloat(testStats?.summary?.average_percentage || 0);
    const totalTests = testStats?.summary?.total_tests || 0;
    const passedTests = testStats?.summary?.passed || 0;
    const failedTests = testStats?.summary?.failed || 0;
    const hwCount = Array.isArray(homeworkHistory) ? homeworkHistory.length : 0;
    const subjectAnalytics = performance?.subjectAnalytics || [];
    const trend = performance?.trend || [];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'academics', label: 'Academics', icon: <BookOpen size={16} /> },
        { id: 'attendance', label: 'Attendance Grid', icon: <Calendar size={16} /> },
        { id: 'remarks', label: 'Remarks Console', icon: <Sparkles size={16} /> },
        { id: 'enquiries', label: 'Enquiries', icon: <MessageSquare size={16} /> },
    ];

    // Helper to group attendance records by month
    const getGroupedAttendanceByMonth = () => {
        if (!attendance?.records || attendance.records.length === 0) return [];
        
        const monthsMap: Record<string, any[]> = {};
        attendance.records.forEach((r: any) => {
            const date = new Date(r.attendance_date);
            const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!monthsMap[key]) {
                monthsMap[key] = [];
            }
            monthsMap[key].push(r);
        });

        return Object.entries(monthsMap).map(([monthYear, records]) => ({
            monthYear,
            records: records.sort((a, b) => new Date(a.attendance_date).getTime() - new Date(b.attendance_date).getTime())
        }));
    };

    const groupedAttendance = getGroupedAttendanceByMonth();

    return (
        <DashboardLayout requiredRole="teacher">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .animate-in { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                .student-stat-card {
                    background: white; border-radius: 20px; padding: 20px; border: 1px solid rgba(229, 57, 53, 0.06);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative; overflow: hidden; box-shadow: var(--shadow-sm);
                }
                .student-stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: rgba(229, 57, 53, 0.15); }
                .student-stat-card-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
                .student-stat-card:hover .student-stat-card-icon { transform: scale(1.1) rotate(4deg); }
                
                .progress-bar-container { height: 6px; border-radius: 6px; background: #F1F2F6; overflow: hidden; position: relative; }
                .progress-bar-fill { height: 100%; border-radius: 6px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
                
                .tab-btn { 
                    padding: 12px 24px; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; 
                    cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.25s; 
                    background: transparent; color: var(--text-secondary); 
                }
                .tab-btn:hover { background: rgba(255, 255, 255, 0.5); color: var(--text-primary); }
                .tab-btn.active { 
                    background: var(--gradient-primary); color: white; 
                    box-shadow: 0 4px 14px rgba(229,57,53,0.3); 
                }
                
                .student-grid-day {
                    width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; font-size: 11px; font-weight: 700; transition: all 0.2s;
                    position: relative;
                }
                .student-grid-day:hover { transform: scale(1.15); z-index: 2; box-shadow: var(--shadow-sm); }
                
                .remark-timeline-card {
                    position: relative; padding-left: 28px; border-left: 2px solid var(--border-secondary);
                    margin-bottom: 24px;
                }
                .remark-timeline-card::before {
                    content: ''; position: absolute; left: -7px; top: 4px; width: 12px; height: 12px;
                    border-radius: 50%; background: var(--primary); border: 2px solid white;
                    box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.15);
                }
                .remark-timeline-card.performance::before { background: var(--info); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
                .remark-timeline-card.improvement::before { background: var(--warning); box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
            `}} />

            <div className="bg-mesh min-h-screen" style={{ padding: '0 8px 32px 8px' }}>
                {/* Hero profile header */}
                <div className="animate-in" style={{
                    background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 70%, #200C0C 100%)',
                    borderRadius: '24px', padding: '32px', marginBottom: '28px', color: 'white',
                    boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.08)', filter: 'blur(20px)' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', right: '180px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(15px)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '24px',
                                background: 'linear-gradient(135deg, rgba(229,57,53,0.25), rgba(249,115,22,0.25))',
                                border: '1px solid rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 800, fontSize: '30px', fontFamily: 'Poppins, sans-serif',
                                backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                            }}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', fontFamily: 'Poppins, sans-serif' }}>
                                        {student.first_name} {student.last_name}
                                    </h1>
                                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '30px', letterSpacing: '0.5px' }}>
                                        {student.PRO_ID}
                                    </span>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700,
                                        background: student.academic_status === 'active' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                                        color: student.academic_status === 'active' ? 'var(--success)' : 'var(--error)',
                                        border: `1px solid ${student.academic_status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                        padding: '4px 12px', borderRadius: '30px', textTransform: 'uppercase'
                                    }}>
                                        {student.academic_status || 'active'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <Mail size={14} color="var(--primary)" /> {student.email || 'No Email'}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <Phone size={14} color="var(--primary)" /> {student.phone || 'No Phone'}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <GraduationCap size={14} color="var(--primary)" /> {student.classes?.map((c: any) => c.class_name).join(', ') || 'No Batch Assigned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <button
                                onClick={() => router.push('/teacher/students')}
                                className="hover-lift"
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '12px 20px', borderRadius: '14px', fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                                    transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                                }}
                            >
                                <ArrowLeft size={16} /> View Student List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium Metrics Grid */}
                <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px', animationDelay: '100ms' }}>
                    <div className="student-stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-teriority)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Performance</span>
                            <span style={{ 
                                fontSize: '10px', fontWeight: 800, 
                                color: attPct >= 80 ? 'var(--success)' : attPct >= 65 ? 'var(--warning)' : 'var(--primary)', 
                                background: attPct >= 80 ? 'var(--success-light)' : attPct >= 65 ? 'var(--warning-light)' : 'var(--primary-light)', 
                                padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' 
                            }}>
                                {attPct >= 80 ? 'Excellent' : attPct >= 65 ? 'Good' : 'Critical'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{attPct}%</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingBottom: '4px', fontWeight: 600 }}>Compliance Rate</span>
                        </div>
                        <div className="progress-bar-container" style={{ marginTop: '12px' }}>
                            <div className="progress-bar-fill" style={{ width: `${attPct}%`, background: attPct >= 80 ? 'var(--success)' : attPct >= 65 ? 'var(--warning)' : 'var(--primary)' }} />
                        </div>
                    </div>

                    <div className="student-stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-teriority)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Benchmark</span>
                            <div className="student-stat-card-icon" style={{ width: '20px', height: '20px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '5px' }}>
                                <TrendingUp size={12} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{avgScore}%</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingBottom: '4px', fontWeight: 600 }}>Average Score</span>
                        </div>
                        <div className="progress-bar-container" style={{ marginTop: '12px' }}>
                            <div className="progress-bar-fill" style={{ width: `${avgScore}%`, background: 'var(--primary)' }} />
                        </div>
                    </div>

                    <div className="student-stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-teriority)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluation Logs</span>
                            <div className="student-stat-card-icon" style={{ width: '20px', height: '20px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '5px' }}>
                                <Award size={12} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{totalTests}</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingBottom: '4px', fontWeight: 600 }}>Total Tests</span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, margin: '8px 0 0 0' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{passedTests}</span> Passed • <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{failedTests}</span> Failed
                        </p>
                    </div>

                    <div className="student-stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-teriority)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Homework Ratio</span>
                            <div className="student-stat-card-icon" style={{ width: '20px', height: '20px', background: 'var(--info-light)', color: 'var(--info)', borderRadius: '5px' }}>
                                <BookOpen size={12} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{hwCount}</h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingBottom: '4px', fontWeight: 600 }}>Submissions</span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600, margin: '8px 0 0 0' }}>Syllabus & Material Tasks</p>
                    </div>
                </div>

                {/* Styled Interactive Tab Bar */}
                <div className="animate-in" style={{ display: 'flex', gap: '8px', marginBottom: '28px', background: 'rgba(255, 255, 255, 0.6)', padding: '6px', borderRadius: '18px', border: '1px solid rgba(229,57,53,0.05)', width: 'fit-content', animationDelay: '180ms' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content containers */}
                {activeTab === 'overview' && (
                    <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', animationDelay: '220ms' }}>
                        {/* Personal info panel */}
                        <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif' }}>
                                <User size={20} color="var(--primary)" /> Profile Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                {[
                                    { label: 'Full Name', value: `${student.first_name} ${student.last_name}` },
                                    { label: 'Academic Status', value: (student.academic_status || 'Active').toUpperCase() },
                                    { label: 'Gender Type', value: student.gender || 'Not Specified' },
                                    { label: 'PRO ID Number', value: student.PRO_ID },
                                    { label: 'Date of Birth', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Provided' },
                                    { label: 'Contact Phone', value: student.phone || 'N/A' },
                                    { label: 'Email Address', value: student.email || 'N/A' },
                                    { label: 'Previous Institution', value: student.school_name || 'N/A' },
                                ].map(item => (
                                    <div key={item.label} style={{ borderBottom: '1px dashed var(--border-primary)', paddingBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: '4px 0 0', wordBreak: 'break-all' }}>{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Subject performance bars */}
                        <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif' }}>
                                <BarChart3 size={20} color="var(--primary)" /> Subject Average Performance
                            </h3>
                            
                            {subjectAnalytics.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart3 size={40} style={{ opacity: 0.25, marginBottom: '14px' }} />
                                    <p style={{ fontWeight: 750, fontSize: '14px' }}>No Evaluation Metrics Found</p>
                                    <p style={{ fontSize: '12px', marginTop: '4px' }}>No academic averages recorded for this student.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                                    {subjectAnalytics.map((sub: any) => (
                                        <div key={sub.subject}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1D3B' }}>{sub.subject}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: getScoreColor(sub.average), background: getScoreBg(sub.average), padding: '2px 8px', borderRadius: '6px' }}>
                                                    {Math.round(sub.average)}%
                                                </span>
                                            </div>
                                            <div className="progress-bar-container" style={{ height: '8px' }}>
                                                <div className="progress-bar-fill" style={{ width: `${sub.average}%`, background: getScoreColor(sub.average) }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {trend && trend.length > 0 && (
                                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                                    <h4 style={{ fontWeight: 750, fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress Trend</h4>
                                    <div style={{ height: '90px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F5" />
                                                <XAxis dataKey="name" hide />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                                                <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#trendGrad)" strokeWidth={2.5} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'academics' && (
                    <div className="animate-in glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)', animationDelay: '220ms' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif' }}>
                            <BookOpen size={20} color="var(--primary)" /> Evaluation Record & Test Marks
                        </h3>
                        {!testStats?.tests || testStats.tests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                                <Award size={48} style={{ opacity: 0.25, marginBottom: '16px', color: 'var(--primary)' }} />
                                <h4 style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B' }}>No Test Records Submitted</h4>
                                <p style={{ fontSize: '13px', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0' }}>This student has not yet participated in or completed any evaluations.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {testStats.tests.map((t: any) => {
                                    const pct = t.percentage || 0;
                                    return (
                                        <div 
                                            key={t.id} 
                                            className="table-row-hover"
                                            style={{ 
                                                display: 'flex', alignItems: 'center', padding: '16px 20px', 
                                                borderRadius: '16px', border: '1px solid var(--border-primary)', 
                                                background: '#FFFFFF', gap: '20px', flexWrap: 'wrap'
                                            }}
                                        >
                                            <div style={{ 
                                                width: '46px', height: '46px', borderRadius: '12px', 
                                                background: getScoreBg(pct), display: 'flex', alignItems: 'center', 
                                                justifyContent: 'center', fontWeight: 800, fontSize: '14px', 
                                                color: getScoreColor(pct), flexShrink: 0 
                                            }}>
                                                {getGradeLabel(pct)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B', display: 'block' }}>{t.test?.test_name || 'Evaluation Test'}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                                    <Clock size={12} /> {t.test?.subject} • {t.test?.date ? new Date(t.test.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontWeight: 850, fontSize: '17px', color: '#1A1D3B' }}>{t.marks_obtained}</span>
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}> / {t.total_marks} Marks</span>
                                                </div>
                                                <span style={{ 
                                                    fontSize: '13px', fontWeight: 800, color: getScoreColor(pct),
                                                    background: getScoreBg(pct), padding: '6px 12px', borderRadius: '10px'
                                                }}>
                                                    {Math.round(pct)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animationDelay: '220ms' }}>
                        <StudentAttendanceCalendar studentId={params.id as string} />
                    </div>
                )}
                {activeTab === 'remarks' && (
                    <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', animationDelay: '220ms' }}>
                        {/* Chronological Timeline */}
                        <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif' }}>
                                <MessageSquare size={20} color="var(--primary)" /> Academic & Behavioral Timeline
                            </h3>
                            
                            {remarks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                                    <Sparkles size={40} style={{ opacity: 0.25, marginBottom: '14px', color: 'var(--primary)' }} />
                                    <h4 style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B' }}>Clean Behavioral Timeline</h4>
                                    <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '300px', margin: '4px auto 0' }}>No teacher remarks or notices have been filed for this student.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {remarks.map((r: any) => (
                                        <div key={r.id} className={`remark-timeline-card ${r.remark_type || 'general'}`}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px',
                                                    background: r.remark_type === 'performance' ? 'var(--info-light)' : r.remark_type === 'improvement' ? 'var(--warning-light)' : 'var(--primary-light)',
                                                    color: r.remark_type === 'performance' ? 'var(--info)' : r.remark_type === 'improvement' ? 'var(--warning)' : 'var(--primary)'
                                                }}>
                                                    {r.remark_type || 'General'}
                                                </span>
                                                <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, background: '#FAFBFD', padding: '12px 16px', borderRadius: '12px', margin: '6px 0', border: '1px solid rgba(229,57,53,0.02)' }}>
                                                {r.remark}
                                            </p>
                                            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700, display: 'block', textAlign: 'right' }}>
                                                — By {r.teacher ? `${r.teacher.first_name} ${r.teacher.last_name}` : 'Supervising Instructor'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Remark console addition form */}
                        <div className="glass-panel" style={{ padding: '28px', borderRadius: '24px', border: '1px solid rgba(229,57,53,0.06)', height: 'fit-content' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1A1D3B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Poppins, sans-serif' }}>
                                <Sparkles size={20} color="var(--primary)" /> Remarks Console
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', fontWeight: 500 }}>
                                File an official behavioral or performance remark. Remarks are filed securely in audit logs and visible to administrators.
                            </p>

                            <form onSubmit={handleAddRemark} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="input-group">
                                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Remark Classification</label>
                                    <select
                                        value={remarkType}
                                        onChange={(e) => setRemarkType(e.target.value)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: '1px solid var(--border-secondary)',
                                            background: '#FAFAFC', color: '#1A1D3B', fontSize: '13.5px', fontWeight: 600, outline: 'none'
                                        }}
                                    >
                                        <option value="general">General Notice</option>
                                        <option value="performance">Academic Performance</option>
                                        <option value="improvement">Improvement Required</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Log Details</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Type observations about class participation, exam results, or behavioral records..."
                                        value={newRemark}
                                        onChange={(e) => setNewRemark(e.target.value)}
                                        style={{
                                            padding: '14px', borderRadius: '12px', border: '1px solid var(--border-secondary)',
                                            background: '#FAFAFC', color: '#1A1D3B', fontSize: '13.5px', fontWeight: 500, outline: 'none',
                                            resize: 'none', lineHeight: 1.5
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmittingRemark || !newRemark.trim()}
                                    style={{
                                        width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '8px', cursor: 'pointer'
                                    }}
                                >
                                    <Send size={15} /> 
                                    {isSubmittingRemark ? 'Filing Remark Log...' : 'File Remark Entry'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ENQUIRIES TAB */}
                {activeTab === 'enquiries' && (
                    <StudentProfileEnquiries studentId={params.id as string} role="teacher" />
                )}
            </div>
        </DashboardLayout>
    );
}

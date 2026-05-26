'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    User, Phone, Mail, GraduationCap, DollarSign, Activity,
    FileText, Plus, CheckCircle, ArrowLeft, ClipboardList, Edit2, MapPin,
    TrendingUp, TrendingDown, BookOpen, Target, Award, AlertCircle,
    Calendar, Clock, BarChart3, PieChart, Zap, ArrowUpRight, Minus, Check, X,
    Search, Filter, AlertTriangle, ArrowUpDown, CreditCard, Landmark, Coins, ShieldCheck, Trophy, MessageSquare
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import StudentAttendanceCalendar from '@/components/StudentAttendanceCalendar';
import StudentProfileEnquiries from '@/components/StudentProfileEnquiries';

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [attendance, setAttendance] = useState<any>(null);
    const [testStats, setTestStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [feeInfo, setFeeInfo] = useState<any>(null);
    const [queries, setQueries] = useState<any[]>([]);
    const [homeworkHistory, setHomeworkHistory] = useState<any>(null);

    // Attendance filter states
    const [attSubjFilter, setAttSubjFilter] = useState('all');
    const [attStatusFilter, setAttStatusFilter] = useState('all');
    const [attSearch, setAttSearch] = useState('');

    // Test filter and sort states
    const [testSearch, setTestSearch] = useState('');
    const [testSubjectFilter, setTestSubjectFilter] = useState('all');
    const [testStatusFilter, setTestStatusFilter] = useState('all');
    const [testSortOrder, setTestSortOrder] = useState('latest');

    useEffect(() => {
        if (params.id) {
            fetchStudentDetails();
            fetchExtraReports();
        }
    }, [params.id]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/students/${params.id}`);
            setStudent(res.data.data);
        } catch (error) {
            console.error('Error fetching student details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExtraReports = async () => {
        try {
            const [attRes, testRes, feeRes, perfRes, hwRes, queriesRes] = await Promise.allSettled([
                api.get(`/students/${params.id}/attendance`),
                api.get(`/students/${params.id}/tests`),
                api.get(`/students/${params.id}/fees`),
                api.get(`/students/${params.id}/performance`),
                api.get(`/students/${params.id}/homework-history`),
                api.get(`/queries`, { params: { student_id: params.id } })
            ]);

            if (attRes.status === 'fulfilled') setAttendance(attRes.value.data.data);
            if (testRes.status === 'fulfilled') setTestStats(testRes.value.data.data);
            if (feeRes.status === 'fulfilled') setFeeInfo(feeRes.value.data.data);
            if (perfRes.status === 'fulfilled') setPerformance(perfRes.value.data.data);
            if (hwRes.status === 'fulfilled') setHomeworkHistory(hwRes.value.data.data);
            if (queriesRes && queriesRes.status === 'fulfilled') setQueries(queriesRes.value.data.data || []);
        } catch (error) {
            console.error('Error fetching student reports', error);
        }
    };

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return '#059669';
        if (pct >= 60) return '#D97706';
        if (pct >= 40) return '#EA580C';
        return '#DC2626';
    };

    const getScoreBg = (pct: number) => {
        if (pct >= 80) return '#ECFDF5';
        if (pct >= 60) return '#FEF3C7';
        if (pct >= 40) return '#FFF7ED';
        return '#FEF2F2';
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
            <DashboardLayout requiredRole={['admin', 'coordinator']}>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
                `}} />
                <div style={{ padding: '32px' }}>
                    <div className="skeleton" style={{ height: '120px', marginBottom: '24px', borderRadius: '24px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
                    </div>
                    <div className="skeleton" style={{ height: '400px' }} />
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout requiredRole={['admin', 'coordinator']}>
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <GraduationCap size={64} color="#D1D5DB" />
                    <h3 style={{ marginTop: '20px', fontSize: '18px', fontWeight: 700, color: '#1A1D3B' }}>Student not found</h3>
                    <p style={{ color: '#8F92A1', marginTop: '8px' }}>The student with ID {params.id} could not be located.</p>
                    <button onClick={() => router.push('/admin/students')} style={{
                        marginTop: '20px', background: '#E53935', color: 'white', border: 'none',
                        padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer'
                    }}>
                        Back to Students
                    </button>
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

    const getSubjectStats = (subj: string) => {
        const results = (testStats?.results || []).filter((r: any) => (r.test?.subject || '').toLowerCase() === subj.toLowerCase());
        const total = results.length;
        const highest = total > 0 ? Math.max(...results.map((r: any) => parseFloat(r.percentage || 0))) : 0;
        const lowest = total > 0 ? Math.min(...results.map((r: any) => parseFloat(r.percentage || 0))) : 0;
        return { total, highest, lowest };
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
        { id: 'academics', label: 'Academics', icon: <BookOpen size={16} /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar size={16} /> },
        { id: 'fees', label: 'Fees', icon: <DollarSign size={16} /> },
        { id: 'enquiries', label: 'Enquiries', icon: <MessageSquare size={16} /> },
    ];

    return (
        <DashboardLayout requiredRole={['admin', 'coordinator']}>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.2); } 50% { box-shadow: 0 0 0 8px rgba(229, 57, 53, 0); } }
                .animate-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-scale { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .stat-card {
                    background: white; border-radius: 20px; padding: 18px; border: 1px solid #F1F4F9;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative; overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .stat-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
                .stat-card-icon {
                    width: 44px; height: 44px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s;
                }
                .stat-card:hover .stat-card-icon { transform: scale(1.1) rotate(5deg); }
                .progress-bar-glow {
                    height: 8px; border-radius: 8px; background: #F1F2F6; overflow: hidden; position: relative;
                }
                .progress-bar-fill {
                    height: 100%; border-radius: 8px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                }
                .progress-bar-fill::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmer 2s infinite linear;
                }
                .tab-btn {
                    padding: 10px 20px; border: none; border-radius: 12px; font-size: 14px;
                    font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: all 0.25s; background: transparent; color: #8F92A1;
                }
                .tab-btn:hover { background: #F8F9FD; color: #1A1D3B; }
                .tab-btn.active { background: linear-gradient(135deg, #E53935 0%, #B71C1C 100%); color: white; box-shadow: 0 4px 12px rgba(229,57,53,0.3); }
                .progress-bar { height: 8px; border-radius: 4px; background: #F1F2F6; overflow: hidden; position: relative; }
                .progress-fill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1); }
                .data-card {
                    background: white; border-radius: 20px; padding: 24px; border: 1px solid #F1F2F6;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .test-row {
                    display: flex; align-items: center; padding: 14px 16px; border-radius: 12px;
                    transition: all 0.2s; gap: 16px;
                }
                .test-row:hover { background: #F8F9FD; }
                .score-ring {
                    width: 100px; height: 100px; border-radius: 50%; position: relative;
                    display: flex; align-items: center; justify-content: center;
                }
                .pulse-danger {
                    animation: pulseDanger 2s infinite;
                }
                @keyframes pulseDanger {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .pulse-warning {
                    animation: pulseWarning 2s infinite;
                }
                @keyframes pulseWarning {
                    0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }
                .att-table {
                    width: 100%; border-collapse: separate; border-spacing: 0;
                }
                .att-table th {
                    background: #F8F9FD; color: #5E6278; font-weight: 700; font-size: 11px;
                    text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; text-align: left;
                    border-bottom: 1px solid #E2E8F0;
                }
                .att-table td {
                    padding: 14px 16px; border-bottom: 1px solid #F1F4F9; font-size: 13px; color: #1A1D3B;
                    vertical-align: middle; transition: all 0.2s;
                }
                .att-table tr:hover td {
                    background: #FAFBFF;
                }
                .att-table tr:last-child td {
                    border-bottom: none;
                }
                .filter-input {
                    border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px;
                    font-size: 13px; font-weight: 600; color: #1A1D3B; outline: none; transition: all 0.2s;
                    background: #FAFBFF;
                }
                .filter-input:focus {
                    border-color: #E53935; background: white; box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
                }
                .filter-select {
                    border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px;
                    font-size: 13px; font-weight: 600; color: #1A1D3B; outline: none; transition: all 0.2s;
                    background: #FAFBFF; cursor: pointer;
                }
                .filter-select:focus {
                    border-color: #E53935; background: white; box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
                }
            `}} />

            {/* Hero Header */}
            <div className="animate-in" style={{
                background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 60%, #1a0a2e 100%)',
                borderRadius: '24px', padding: '28px 36px', marginBottom: '24px', color: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden',
                animationDelay: '0ms'
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(229,57,53,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-50px', right: '150px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(124,58,237,0.06)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(229,57,53,0.2), rgba(124,58,237,0.2))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: '26px',
                            backdropFilter: 'blur(10px)',
                        }}>
                            {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                                    {student.first_name} {student.last_name}
                                </h1>
                                <span style={{
                                    fontSize: '11px', fontWeight: 800, background: '#E53935', color: 'white',
                                    padding: '4px 10px', borderRadius: '50px', letterSpacing: '0.5px'
                                }}>
                                    {student.PRO_ID}
                                </span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    background: student.academic_status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: student.academic_status === 'active' ? '#10B981' : '#EF4444',
                                    padding: '4px 10px', borderRadius: '50px'
                                }}>
                                    {(student.academic_status || 'active').toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mail size={13} /> {student.email || 'No email'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={13} /> {student.phone || 'No phone'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <GraduationCap size={13} /> {student.classes?.[0]?.class_name || 'No Batch'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => router.push(`/admin/students/${params.id}/edit`)}
                            style={{
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                border: 'none', color: 'white', padding: '10px 18px', borderRadius: '12px',
                                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                                gap: '6px', fontSize: '13px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: '0 4px 15px rgba(229, 57, 53, 0.3)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(229, 57, 53, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(229, 57, 53, 0.3)';
                            }}
                        >
                            <Edit2 size={15} /> Edit Student
                        </button>
                        <button
                            onClick={() => router.push('/admin/students')}
                            style={{
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: '10px 18px', borderRadius: '12px', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
                                transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                            <ArrowLeft size={16} /> All Students
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats  */}
            <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px', animationDelay: '100ms' }}>
                {/* Attendance Card */}
                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#FFF0F1', color: '#E53935', width: '44px', height: '44px', flexShrink: 0 }}>
                        <Activity size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance</span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: attPct >= 75 ? '#10B981' : '#F43F5E', background: attPct >= 75 ? '#ECFDF5' : '#FFF1F2', padding: '2px 6px', borderRadius: '4px' }}>
                                {attPct >= 75 ? 'GOOD' : 'LOW'}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{attPct}%</h3>
                        <div className="progress-bar-glow" style={{ height: '4px', margin: '8px 0' }}>
                            <div className="progress-bar-fill" style={{ width: `${attPct}%`, background: '#E53935' }} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#5E6278', fontWeight: 600, margin: 0 }}>
                            <span style={{ color: '#E53935', fontWeight: 800 }}>{attendance?.summary?.present || 0}</span> / {attendance?.summary?.total || 0} Sessions
                        </p>
                    </div>
                </div>

                {/* Avg Score Card */}
                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#F5F3FF', color: '#7C3AED', width: '44px', height: '44px', flexShrink: 0 }}>
                        <Target size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Score</span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F5F3FF', padding: '2px 6px', borderRadius: '4px' }}>STABLE</span>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0 }}>{avgScore}%</h3>
                        <div className="progress-bar-glow" style={{ height: '4px', margin: '8px 0' }}>
                            <div className="progress-bar-fill" style={{ width: `${avgScore}%`, background: '#7C3AED' }} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#5E6278', fontWeight: 600, margin: 0 }}>
                            {passedTests} Pass • {failedTests} Fail
                        </p>
                    </div>
                </div>

                {/* Fee Status Card */}
                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ 
                        background: feeInfo?.assignment?.payment_status === 'paid' ? '#ECFDF5' : feeInfo?.assignment?.payment_status === 'partial' ? '#FFFBEB' : '#FFF1F2', 
                        color: feeInfo?.assignment?.payment_status === 'paid' ? '#10B981' : feeInfo?.assignment?.payment_status === 'partial' ? '#F59E0B' : '#EF4444',
                        width: '50px', height: '50px', flexShrink: 0 
                    }}>
                        <DollarSign size={26} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fee Status</span>
                            <span style={{ 
                                fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                                background: feeInfo?.assignment?.payment_status === 'paid' ? '#ECFDF5' : feeInfo?.assignment?.payment_status === 'partial' ? '#FFFBEB' : '#FFF1F2', 
                                color: feeInfo?.assignment?.payment_status === 'paid' ? '#10B981' : feeInfo?.assignment?.payment_status === 'partial' ? '#F59E0B' : '#EF4444'
                            }}>{(feeInfo?.assignment?.payment_status || 'N/A').toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '4px' }}>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: '#A1A5B7', margin: 0 }}>PAID</p>
                                <p style={{ fontSize: '18px', fontWeight: 850, color: '#10B981', margin: 0 }}>₹{feeInfo?.assignment?.total_paid?.toLocaleString() || '0'}</p>
                            </div>
                            <div style={{ borderLeft: '1.5px solid #F1F4F9', paddingLeft: '10px', height: '22px' }} />
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: '#A1A5B7', margin: 0 }}>DUE</p>
                                <p style={{ fontSize: '18px', fontWeight: 850, color: '#EF4444', margin: 0 }}>₹{feeInfo?.assignment?.total_pending || '0'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enrolled Card */}
                <div className="stat-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="stat-card-icon" style={{ background: '#F0F9FF', color: '#0EA5E9', width: '44px', height: '44px', flexShrink: 0 }}>
                        <BookOpen size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enrolled</span>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#0EA5E9', background: '#F0F9FF', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: 0, lineHeight: 1 }}>
                            {student.classes?.length || 0} <span style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 600 }}>Batches</span>
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {(student.subject_enrollments || []).slice(0, 2).map((se: any, i: number) => (
                                <span key={i} style={{
                                    padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                    background: '#F1F5F9', color: '#475569'
                                }}>{se.subject}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="animate-in" style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #F1F2F6', animationDelay: '150ms' }}>
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

            {/* Tab Content */}
            <div className="animate-in" style={{ animationDelay: '200ms' }}>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Subject Performance */}
                            <div className="data-card">
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart3 size={18} color="#7C3AED" /> Subject-wise Performance
                                </h3>
                                {subjectAnalytics.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                                        {subjectAnalytics.map((sa: any, i: number) => {
                                            const subjectColors: Record<string, string> = {
                                                'Mathematics': '#7C3AED', 'Maths': '#7C3AED',
                                                'Physics': '#0EA5E9', 'Chemistry': '#EA580C',
                                                'Biology': '#059669', 'English': '#EC4899',
                                            };
                                            const color = subjectColors[sa.subject] || '#6366F1';
                                            const stats = getSubjectStats(sa.subject);
                                            const rating = sa.average >= 80 ? { text: 'Excellent', color: '#10B981', bg: '#ECFDF5' }
                                                         : sa.average >= 60 ? { text: 'Good', color: '#F59E0B', bg: '#FFFBEB' }
                                                         : sa.average >= 40 ? { text: 'Average', color: '#EA580C', bg: '#FFF7ED' }
                                                         : { text: 'Needs Work', color: '#EF4444', bg: '#FFF1F2' };

                                            return (
                                                <div 
                                                    key={i} 
                                                    style={{ 
                                                        background: '#FAFBFF', 
                                                        border: '1px solid #E2E8F0', 
                                                        borderRadius: '18px', 
                                                        padding: '16px',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.05)';
                                                        e.currentTarget.style.borderColor = color;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'none';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)';
                                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{
                                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                                    background: `${color}15`, color: color,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontWeight: 800, fontSize: '13px'
                                                                }}>
                                                                    {sa.subject.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B', display: 'block' }}>{sa.subject}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: rating.color, background: rating.bg, padding: '2px 6px', borderRadius: '6px', marginTop: '2px', display: 'inline-block' }}>{rating.text}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '16px', fontWeight: 900, color: '#1A1D3B', display: 'block' }}>{sa.average}%</span>
                                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase' }}>Grade {getGradeLabel(sa.average)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="progress-bar" style={{ height: '6px', borderRadius: '3px', background: '#E2E8F0', marginBottom: '14px', overflow: 'hidden' }}>
                                                            <div className="progress-fill" style={{ width: `${sa.average}%`, height: '100%', borderRadius: '3px', background: `linear-gradient(90deg, ${color}, ${color}dd)`, boxShadow: `0 0 8px ${color}50` }} />
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '12px', borderTop: '1px solid #EEF2F6', marginTop: '4px' }}>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tests</span>
                                                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px', display: 'block' }}>{stats.total}</span>
                                                        </div>
                                                        <div style={{ textAlign: 'center', borderLeft: '1px solid #EEF2F6', borderRight: '1px solid #EEF2F6' }}>
                                                            <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Highest</span>
                                                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#10B981', marginTop: '2px', display: 'block' }}>{stats.highest}%</span>
                                                        </div>
                                                        <div style={{ textAlign: 'center' }}>
                                                            <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Lowest</span>
                                                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#EF4444', marginTop: '2px', display: 'block' }}>{stats.lowest}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '12px' }}>
                                        <BarChart3 size={36} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                                        <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 500 }}>No subject performance data available yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Score Trend (Timeline) */}
                            <div className="data-card">
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={18} color="#059669" /> Score Trend
                                </h3>
                                {trend.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                        {trend.map((t: any, i: number) => {
                                            const prevScore = i > 0 ? trend[i - 1].score : t.score;
                                            const diff = t.score - prevScore;
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>
                                                    {/* Timeline line */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
                                                        <div style={{
                                                            width: '12px', height: '12px', borderRadius: '50%',
                                                            background: getScoreColor(t.score), flexShrink: 0,
                                                            border: '3px solid white', boxShadow: `0 0 0 2px ${getScoreColor(t.score)}30`
                                                        }} />
                                                        {i < trend.length - 1 && <div style={{ width: '2px', flex: 1, background: '#E2E8F0' }} />}
                                                    </div>
                                                    {/* Content */}
                                                    <div style={{ flex: 1, paddingBottom: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{t.name}</p>
                                                                <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px' }}>
                                                                    {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{
                                                                    fontSize: '16px', fontWeight: 800, color: getScoreColor(t.score)
                                                                }}>
                                                                    {t.score}%
                                                                </span>
                                                                {i > 0 && (
                                                                    <span style={{
                                                                        display: 'flex', alignItems: 'center', gap: '2px',
                                                                        fontSize: '11px', fontWeight: 700,
                                                                        color: diff >= 0 ? '#059669' : '#DC2626',
                                                                        background: diff >= 0 ? '#ECFDF5' : '#FEF2F2',
                                                                        padding: '2px 6px', borderRadius: '6px'
                                                                    }}>
                                                                        {diff >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '12px' }}>
                                        <TrendingUp size={36} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                                        <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 500 }}>No score trend data yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Profile Details */}
                            <div className="data-card">
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px' }}>Profile Details</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { icon: <Mail size={15} />, label: 'Email', value: student.email || 'Not provided' },
                                        { icon: <Phone size={15} />, label: 'Phone', value: student.phone || 'Not provided' },
                                        { icon: <MapPin size={15} />, label: 'School', value: student.school_name || 'Not provided' },
                                        { icon: <Calendar size={15} />, label: 'DOB', value: student.date_of_birth || 'Not provided' },
                                        { icon: <User size={15} />, label: 'Gender', value: (student.gender || 'N/A').charAt(0).toUpperCase() + (student.gender || 'N/A').slice(1) },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{ color: '#A1A5B7', marginTop: '2px' }}>{item.icon}</div>
                                            <div>
                                                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#A1A5B7', fontWeight: 700, letterSpacing: '0.05em' }}>{item.label}</p>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1D3B', marginTop: '2px' }}>{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {student.parent && (
                                    <>
                                        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #F1F2F6' }} />
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '12px' }}>Parent / Guardian</h4>
                                        <div style={{ background: '#F8F9FD', padding: '14px', borderRadius: '12px' }}>
                                            <p style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{student.parent.first_name} {student.parent.last_name}</p>
                                            <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '4px' }}>{student.parent.phone}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Enrolled Subjects */}
                            <div className="data-card">
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={16} color="#0EA5E9" /> Enrolled Subjects
                                </h3>
                                {student.classes?.length > 0 ? student.classes.map((cls: any, idx: number) => {
                                    const classSubjects = (student.subject_enrollments || []).filter((se: any) => se.class_id === cls.id);
                                    const allSubjects = cls.schedule?.map((s: any) => s.subject).filter((s: string) => s) || [];
                                    return (
                                        <div key={cls.id || idx} style={{ marginBottom: idx < student.classes.length - 1 ? '16px' : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <span style={{
                                                    fontWeight: 800, fontSize: '13px', color: '#E53935',
                                                    background: '#FFF0F1', padding: '4px 10px', borderRadius: '8px'
                                                }}>
                                                    {cls.class_name}
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#8F92A1', fontFamily: 'monospace' }}>
                                                    {cls.class_code}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {allSubjects.length > 0 ? allSubjects.map((subj: string) => {
                                                    const isEnrolled = classSubjects.some((se: any) => se.subject === subj);
                                                    return (
                                                        <div key={subj} style={{
                                                            display: 'flex', alignItems: 'center', gap: '5px',
                                                            padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                                            background: isEnrolled ? '#ECFDF5' : '#F8F9FD',
                                                            color: isEnrolled ? '#059669' : '#A1A5B7',
                                                            border: `1px solid ${isEnrolled ? '#A7F3D0' : '#E2E8F0'}`
                                                        }}>
                                                            {isEnrolled ? <Check size={12} /> : <Minus size={12} />}
                                                            {subj}
                                                        </div>
                                                    );
                                                }) : (
                                                    <p style={{ fontSize: '12px', color: '#A1A5B7', fontStyle: 'italic' }}>No subjects defined for this batch</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p style={{ fontSize: '13px', color: '#A1A5B7', fontStyle: 'italic' }}>Not enrolled in any batch</p>
                                )}
                            </div>

                            {/* Attendance Donut */}
                            <div className="data-card">
                                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>Attendance Breakdown</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div className="score-ring" style={{
                                        background: `conic-gradient(
                                            #059669 0% ${attPct}%,
                                            #DC2626 ${attPct}% ${attPct + (100 - attPct - (attendance?.summary?.late || 0) / Math.max(1, attendance?.summary?.total || 1) * 100)}%,
                                            #D97706 ${100 - (attendance?.summary?.late || 0) / Math.max(1, attendance?.summary?.total || 1) * 100}% 100%
                                        )`, flexShrink: 0
                                    }}>
                                        <div style={{
                                            width: '72px', height: '72px', borderRadius: '50%', background: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}>
                                            <span style={{ fontSize: '18px', fontWeight: 800, color: getScoreColor(attPct), lineHeight: 1 }}>{attPct}%</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#059669' }} />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>Present: {attendance?.summary?.present || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#DC2626' }} />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>Absent: {attendance?.summary?.absent || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#D97706' }} />
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5E6278' }}>Late: {attendance?.summary?.late || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACADEMICS TAB */}
                {activeTab === 'academics' && (() => {
                    const uniqueTestSubjects = Array.from(new Set(
                        (testStats?.results || [])
                            .map((r: any) => r.test?.subject)
                            .filter(Boolean)
                    )) as string[];

                    const filteredTestResults = (testStats?.results || []).filter((r: any) => {
                        if (testSubjectFilter !== 'all' && (r.test?.subject || '').toLowerCase() !== testSubjectFilter.toLowerCase()) return false;
                        if (testStatusFilter !== 'all' && (r.pass_fail || '').toLowerCase() !== testStatusFilter.toLowerCase()) return false;
                        if (testSearch) {
                            const query = testSearch.toLowerCase();
                            const testName = (r.test?.test_name || '').toLowerCase();
                            const testType = (r.test?.test_type || '').toLowerCase();
                            const subject = (r.test?.subject || '').toLowerCase();
                            const grade = (r.grade || '').toLowerCase();
                            return testName.includes(query) || testType.includes(query) || subject.includes(query) || grade.includes(query);
                        }
                        return true;
                    });

                    const sortedTestResults = [...filteredTestResults].sort((a: any, b: any) => {
                        if (testSortOrder === 'latest') {
                            return new Date(b.test?.test_date || 0).getTime() - new Date(a.test?.test_date || 0).getTime();
                        }
                        if (testSortOrder === 'oldest') {
                            return new Date(a.test?.test_date || 0).getTime() - new Date(b.test?.test_date || 0).getTime();
                        }
                        if (testSortOrder === 'highest_score') {
                            return parseFloat(b.percentage || 0) - parseFloat(a.percentage || 0);
                        }
                        if (testSortOrder === 'lowest_score') {
                            return parseFloat(a.percentage || 0) - parseFloat(b.percentage || 0);
                        }
                        if (testSortOrder === 'rank') {
                            const rA = parseInt(a.rank_in_class) || 9999;
                            const rB = parseInt(b.rank_in_class) || 9999;
                            return rA - rB;
                        }
                        return 0;
                    });

                    const totalFiltered = sortedTestResults.length;
                    const passedFiltered = sortedTestResults.filter((r: any) => (r.pass_fail || '').toLowerCase() === 'pass').length;
                    const passRateFiltered = totalFiltered > 0 ? ((passedFiltered / totalFiltered) * 100).toFixed(0) : '0';
                    const avgScoreFiltered = totalFiltered > 0 ? (sortedTestResults.reduce((acc: number, cur: any) => acc + parseFloat(cur.percentage || 0), 0) / totalFiltered).toFixed(1) : '0';
                    const maxScoreFiltered = totalFiltered > 0 ? Math.max(...sortedTestResults.map((r: any) => parseFloat(r.percentage || 0))) : 0;

                    const getRankBadge = (rankVal: any) => {
                        const rank = parseInt(rankVal);
                        if (isNaN(rank)) return <span style={{ fontSize: '13px', fontWeight: 600, color: '#A1A5B7' }}>N/A</span>;
                        if (rank === 1) {
                            return (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A',
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 800
                                }}>
                                    <Trophy size={12} fill="#D97706" /> 1st
                                </span>
                            );
                        }
                        if (rank === 2) {
                            return (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0',
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 800
                                }}>
                                    <Trophy size={12} fill="#64748B" /> 2nd
                                </span>
                            );
                        }
                        if (rank === 3) {
                            return (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5',
                                    padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 800
                                }}>
                                    <Trophy size={12} fill="#C2410C" /> 3rd
                                </span>
                            );
                        }
                        return (
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1D3B' }}>
                                #{rank}
                            </span>
                        );
                    };

                    const hasFilters = testSearch !== '' || testSubjectFilter !== 'all' || testStatusFilter !== 'all' || testSortOrder !== 'latest';

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Academic Performance Insights */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div className="stat-card" style={{ padding: '14px 18px', background: '#FAFBFF' }}>
                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Found</span>
                                    <h4 style={{ fontSize: '20px', fontWeight: 850, color: '#1A1D3B', margin: '4px 0 0 0' }}>{totalFiltered} <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Assessments</span></h4>
                                </div>
                                <div className="stat-card" style={{ padding: '14px 18px', background: '#FAFBFF' }}>
                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pass Rate</span>
                                    <h4 style={{ fontSize: '20px', fontWeight: 850, color: '#10B981', margin: '4px 0 0 0' }}>{passRateFiltered}% <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>({passedFiltered}/{totalFiltered})</span></h4>
                                </div>
                                <div className="stat-card" style={{ padding: '14px 18px', background: '#FAFBFF' }}>
                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Average Score</span>
                                    <h4 style={{ fontSize: '20px', fontWeight: 850, color: '#7C3AED', margin: '4px 0 0 0' }}>{avgScoreFiltered}% <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Average</span></h4>
                                </div>
                                <div className="stat-card" style={{ padding: '14px 18px', background: '#FAFBFF' }}>
                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8F92A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Highest Score</span>
                                    <h4 style={{ fontSize: '20px', fontWeight: 850, color: '#0EA5E9', margin: '4px 0 0 0' }}>{maxScoreFiltered}% <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Peak</span></h4>
                                </div>
                            </div>

                            {/* All Test Results */}
                            <div className="data-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                        <FileText size={18} color="#7C3AED" /> All Test Results
                                    </h3>

                                    {/* Filters Controls Row */}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Search */}
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <Search size={14} color="#8F92A1" style={{ position: 'absolute', left: '12px' }} />
                                            <input 
                                                type="text" 
                                                placeholder="Search tests..." 
                                                value={testSearch}
                                                onChange={e => setTestSearch(e.target.value)}
                                                className="filter-input"
                                                style={{ paddingLeft: '34px', width: '160px' }}
                                            />
                                        </div>

                                        {/* Subject Filter */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Filter size={12} color="#8F92A1" />
                                            <select 
                                                value={testSubjectFilter}
                                                onChange={e => setTestSubjectFilter(e.target.value)}
                                                className="filter-select"
                                            >
                                                <option value="all">All Subjects</option>
                                                {uniqueTestSubjects.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Status Filter */}
                                        <select 
                                            value={testStatusFilter}
                                            onChange={e => setTestStatusFilter(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="pass">Passed</option>
                                            <option value="fail">Failed</option>
                                        </select>

                                        {/* Sorting order */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ArrowUpDown size={12} color="#8F92A1" />
                                            <select 
                                                value={testSortOrder}
                                                onChange={e => setTestSortOrder(e.target.value)}
                                                className="filter-select"
                                            >
                                                <option value="latest">Latest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="highest_score">Highest Score</option>
                                                <option value="lowest_score">Lowest Score</option>
                                                <option value="rank">Class Rank</option>
                                            </select>
                                        </div>

                                        {/* Clear */}
                                        {hasFilters && (
                                            <button 
                                                onClick={() => {
                                                    setTestSearch('');
                                                    setTestSubjectFilter('all');
                                                    setTestStatusFilter('all');
                                                    setTestSortOrder('latest');
                                                }}
                                                style={{
                                                    background: '#F1F2F6', border: 'none', color: '#1A1D3B',
                                                    padding: '10px 14px', borderRadius: '12px', fontSize: '13px',
                                                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#E4E6EF'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#F1F2F6'}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {sortedTestResults.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', padding: '8px 16px', gap: '16px', borderBottom: '1px solid #F1F4F9', marginBottom: '8px' }}>
                                            <span style={{ flex: 2, fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Name</span>
                                            <span style={{ flex: 1, fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</span>
                                            <span style={{ flex: 1, fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</span>
                                            <span style={{ width: '60px', fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Grade</span>
                                            <span style={{ width: '80px', fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Standing</span>
                                            <span style={{ width: '80px', fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</span>
                                        </div>
                                        {sortedTestResults.map((tr: any, idx: number) => {
                                            const subj = tr.test?.subject || 'Other';
                                            const subjColors: Record<string, { bg: string; text: string; border: string }> = {
                                                'Mathematics': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
                                                'Maths': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
                                                'Physics': { bg: '#F0F9FF', text: '#0EA5E9', border: '#BAE6FD' },
                                                'Chemistry': { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
                                                'Biology': { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
                                                'English': { bg: '#FDF2F8', text: '#EC4899', border: '#FBCFE8' },
                                            };
                                            const sc = subjColors[subj] || { bg: '#F8F9FD', text: '#6366F1', border: '#E2E8F0' };

                                            return (
                                                <div key={tr.id || idx} className="test-row" style={{ borderBottom: '1px solid #FAFBFD' }}>
                                                    <div style={{ flex: 2 }}>
                                                        <p style={{ fontWeight: 800, fontSize: '14.5px', color: '#1A1D3B', margin: 0 }}>{tr.test?.test_name}</p>
                                                        <p style={{ fontSize: '11px', color: '#8F92A1', marginTop: '3px', margin: 0, fontWeight: 600 }}>
                                                            {tr.test?.test_date ? new Date(tr.test.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                            {' • '}{tr.test?.test_type || 'Regular'}
                                                        </p>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                        <span style={{
                                                            fontSize: '11px', fontWeight: 800,
                                                            padding: '3px 8px', borderRadius: '6px',
                                                            background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                                                        }}>
                                                            {subj}
                                                        </span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                        <div>
                                                            <span style={{ fontSize: '15px', fontWeight: 850, color: getScoreColor(tr.percentage) }}>
                                                                {tr.marks_obtained}/{tr.total_marks}
                                                            </span>
                                                            <span style={{ fontSize: '11.5px', color: '#8F92A1', marginLeft: '4px', fontWeight: 600 }}>({tr.percentage}%)</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <span style={{
                                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '13px', fontWeight: 900, borderRadius: '8px',
                                                            background: getScoreBg(tr.percentage), color: getScoreColor(tr.percentage),
                                                            border: `1px solid ${getScoreColor(tr.percentage)}20`
                                                        }}>
                                                            {tr.grade || 'F'}
                                                        </span>
                                                    </div>
                                                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        {getRankBadge(tr.rank_in_class)}
                                                    </div>
                                                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <span style={{
                                                            width: '100%', textAlign: 'center',
                                                            padding: '5px 0', borderRadius: '50px', fontSize: '10px', fontWeight: 900,
                                                            letterSpacing: '0.5px', border: tr.pass_fail === 'pass' ? '1.5px solid #A7F3D0' : '1.5px solid #FCA5A5',
                                                            background: tr.pass_fail === 'pass' ? '#ECFDF5' : '#FEF2F2',
                                                            color: tr.pass_fail === 'pass' ? '#059669' : '#DC2626',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {tr.pass_fail || 'FAIL'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                        <FileText size={48} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                                        <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 6px 0' }}>No matching results</h5>
                                        <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 600, margin: 0 }}>Try clearing your filters or altering the search query.</p>
                                    </div>
                                )}
                            </div>

                        {/* Homework History */}
                        <div className="data-card">
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={18} color="#D97706" /> Homework History ({hwCount})
                            </h3>
                            {hwCount > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {homeworkHistory.slice(0, 10).map((hw: any, idx: number) => (
                                        <div key={hw.id || idx} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', borderRadius: '12px', border: '1px solid #F1F2F6',
                                            transition: 'all 0.2s'
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{hw.homework?.title}</p>
                                                <p style={{ fontSize: '12px', color: '#8F92A1', marginTop: '2px' }}>
                                                    Submitted: {hw.submission_date ? new Date(hw.submission_date).toLocaleDateString('en-IN') : 'N/A'}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {hw.marks_obtained !== null && hw.marks_obtained !== undefined && (
                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B' }}>
                                                        {hw.marks_obtained}/{hw.homework?.total_marks || '?'}
                                                    </span>
                                                )}
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                                                    background: hw.status === 'evaluated' ? '#ECFDF5' : hw.status === 'late' ? '#FEF3C7' : '#E0F2FE',
                                                    color: hw.status === 'evaluated' ? '#059669' : hw.status === 'late' ? '#D97706' : '#0369A1',
                                                }}>
                                                    {hw.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', background: '#F8F9FD', borderRadius: '12px' }}>
                                    <p style={{ color: '#8F92A1', fontWeight: 500 }}>No homework submissions found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })()}

                {/* ATTENDANCE TAB */}
                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                    <div className="animate-in" style={{ animationDelay: '220ms' }}>
                        <StudentAttendanceCalendar studentId={params.id as string} />
                    </div>
                )}
                {activeTab === 'fees' && (() => {
                    const total = feeInfo?.assignment ? (feeInfo.assignment.final_fee || feeInfo.assignment.total_fee || 0) : 0;
                    const paid = feeInfo?.assignment ? (feeInfo.assignment.total_paid || 0) : 0;
                    const pending = feeInfo?.assignment ? (feeInfo.assignment.total_pending || 0) : 0;
                    const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                    const discount = feeInfo?.assignment?.discount_percentage || 0;
                    const status = feeInfo?.assignment?.payment_status || 'Unpaid';

                    const getStatusStyle = (statusStr: string) => {
                        const s = statusStr.toLowerCase();
                        if (s === 'paid') return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
                        if (s === 'partially paid' || s === 'partial') return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
                        return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
                    };

                    return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                            {/* Fee Assignment */}
                            <div className="data-card" style={{ 
                                padding: '28px', 
                                background: '#FFFFFF', 
                                borderRadius: '20px', 
                                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)', 
                                border: '1px solid #E2E8F0',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.08)' }}>
                                            <DollarSign size={20} color="#059669" />
                                        </div>
                                        Fee Assignment
                                    </h3>
                                    {feeInfo?.assignment && (() => {
                                        const statStyle = getStatusStyle(status);
                                        return (
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                padding: '6px 14px', borderRadius: '12px',
                                                background: statStyle.bg, color: statStyle.text, border: `1.5px solid ${statStyle.border}`,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}>
                                                {status}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {feeInfo?.assignment ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Dual-Color Clearance Progress Bar */}
                                        <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Fee Clearance Progress</span>
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>{percent}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                                                <div style={{ 
                                                    width: `${percent}%`, 
                                                    height: '100%', 
                                                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', 
                                                    borderRadius: '10px',
                                                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                                <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Cleared: ₹{paid.toLocaleString()}</span>
                                                <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>Remaining: ₹{pending.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* 3-Column Mini Stat Cards Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                            {/* Assigned */}
                                            <div style={{ 
                                                padding: '16px 12px', 
                                                background: '#FFFBEB', 
                                                border: '1px solid #FEF3C7', 
                                                borderRadius: '14px', 
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Landmark size={18} color="#D97706" style={{ marginBottom: '8px' }} />
                                                <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Assigned</span>
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#78350F', marginTop: '4px', whiteSpace: 'nowrap' }}>₹{total.toLocaleString()}</span>
                                            </div>

                                            {/* Paid */}
                                            <div style={{ 
                                                padding: '16px 12px', 
                                                background: '#ECFDF5', 
                                                border: '1px solid #A7F3D0', 
                                                borderRadius: '14px', 
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <CheckCircle size={18} color="#059669" style={{ marginBottom: '8px' }} />
                                                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Paid</span>
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#064E3B', marginTop: '4px', whiteSpace: 'nowrap' }}>₹{paid.toLocaleString()}</span>
                                            </div>

                                            {/* Pending */}
                                            <div style={{ 
                                                padding: '16px 12px', 
                                                background: pending > 0 ? '#FEF2F2' : '#F0FDFA', 
                                                border: pending > 0 ? '1px solid #FCA5A5' : '1px solid #CCFBF1', 
                                                borderRadius: '14px', 
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative'
                                            }}>
                                                {pending > 0 && (
                                                    <span style={{
                                                        position: 'absolute', top: '6px', right: '6px',
                                                        width: '6px', height: '6px', borderRadius: '50%',
                                                        background: '#EF4444', display: 'block',
                                                        boxShadow: '0 0 0 2px #FFF, 0 0 0 4px rgba(239, 68, 68, 0.3)'
                                                    }} />
                                                )}
                                                <AlertCircle size={18} color={pending > 0 ? '#DC2626' : '#0D9488'} style={{ marginBottom: '8px' }} />
                                                <span style={{ fontSize: '11px', color: pending > 0 ? '#DC2626' : '#0D9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Pending</span>
                                                <span style={{ fontSize: '15px', fontWeight: 900, color: pending > 0 ? '#7F1D1D' : '#115E59', marginTop: '4px', whiteSpace: 'nowrap' }}>₹{pending.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Discount & Terms Row */}
                                        {discount > 0 && (
                                            <div style={{ 
                                                display: 'flex', alignItems: 'center', gap: '10px', 
                                                padding: '12px 16px', borderRadius: '12px', 
                                                background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.01) 100%)', 
                                                border: '1px solid rgba(234, 179, 8, 0.15)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: '#FEF08A' }}>
                                                    <Award size={14} color="#854D0E" />
                                                </div>
                                                <span style={{ fontSize: '12.5px', color: '#71717A', fontWeight: 600 }}>
                                                    A custom scholarship discount of <strong style={{ color: '#854D0E', fontWeight: 800 }}>{discount}%</strong> has been applied to this student's account.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', marginBottom: '16px' }}>
                                            <DollarSign size={28} color="#94A3B8" />
                                        </div>
                                        <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 6px 0' }}>No Fee Assigned</h5>
                                        <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 600, margin: 0 }}>This student does not have an active fee structure assigned yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment History */}
                            <div className="data-card" style={{ 
                                padding: '28px', 
                                background: '#FFFFFF', 
                                borderRadius: '20px', 
                                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)', 
                                border: '1px solid #E2E8F0',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.08)' }}>
                                        <ClipboardList size={20} color="#0EA5E9" />
                                    </div>
                                    Payment History
                                </h3>
                                {feeInfo?.payments?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {feeInfo.payments.map((p: any, i: number) => {
                                            // Pick method icon
                                            const method = (p.payment_method || 'cash').toLowerCase();
                                            let methodIcon = <Coins size={14} color="#64748B" />;
                                            if (method.includes('card') || method.includes('online')) {
                                                methodIcon = <CreditCard size={14} color="#0EA5E9" />;
                                            } else if (method.includes('bank') || method.includes('neft') || method.includes('upi')) {
                                                methodIcon = <Landmark size={14} color="#8B5CF6" />;
                                            }

                                            return (
                                                <div key={i} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '16px 20px', borderRadius: '16px', border: '1px solid #E2E8F0',
                                                    background: '#FCFDFE',
                                                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                                                    cursor: 'default'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                                }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                                            <ShieldCheck size={20} color="#059669" />
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontWeight: 800, fontSize: '16px', color: '#1E293B' }}>₹{(p.amount_paid || 0).toLocaleString()}</span>
                                                                <span style={{ 
                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                    fontSize: '11px', color: '#64748B', background: '#F1F5F9', 
                                                                    padding: '3px 8px', borderRadius: '6px', fontWeight: 700,
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {methodIcon}
                                                                    {p.payment_method || 'Cash'}
                                                                </span>
                                                            </div>
                                                            <span style={{ fontSize: '11.5px', color: '#8F92A1', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                                                                {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', {
                                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit', hour12: true
                                                                }) : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '10px',
                                                        background: 'rgba(5, 150, 105, 0.06)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.15)',
                                                        fontFamily: 'monospace', letterSpacing: '0.02em'
                                                    }}>
                                                        {p.receipt_number || `#REC-PAY-${i + 1}`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', marginBottom: '16px' }}>
                                            <ClipboardList size={28} color="#94A3B8" />
                                        </div>
                                        <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 6px 0' }}>No Payments Found</h5>
                                        <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 600, margin: 0 }}>There are no transaction records logged for this student.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ENQUIRIES TAB */}
                {activeTab === 'enquiries' && (
                    <StudentProfileEnquiries studentId={params.id as string} role="admin" />
                )}
            </div>
        </DashboardLayout>
    );
}

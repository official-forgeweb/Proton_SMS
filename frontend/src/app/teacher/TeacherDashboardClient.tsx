'use client';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Users, ClipboardList, UserCheck, Calendar, Clock,
    ChevronRight, Phone, Target, CheckCircle, AlertCircle, Zap, TrendingUp, Activity, ArrowUpRight,
    Sparkles, Bell, BarChart3, GraduationCap, ArrowRight, Layers, MapPin, Video, ExternalLink
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

import type { TeacherDashboardData } from '@/services/dataAccess';

interface Props { data: TeacherDashboardData; }

export default function TeacherDashboardClient({ data }: Props) {
    const router = useRouter();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const performanceData = data?.charts?.performance || [];
    const attendanceData = data?.charts?.attendance || [];
    const totalClasses = data?.stats?.total_classes || 0;
    const totalStudents = data?.stats?.total_students || 0;
    const pendingEvals = data?.stats?.pending_evaluations || 0;
    const assignedEnqs = data?.stats?.assigned_enquiries || 0;

    const avgAttendance = attendanceData.length > 0 
        ? (attendanceData.reduce((a: number, b: any) => a + b.percentage, 0) / attendanceData.length).toFixed(1) 
        : '0';

    const timeGreeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    // Teacher initials for the profile badge
    const teacherInitials = data?.teacher_name
        ? data.teacher_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'TR';

    return (
        <div className="bg-mesh" style={{ padding: '0 0 50px 0', minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes floatUp { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
                
                .dash-float { animation: floatUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                .dash-stat-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 20px; padding: 24px; position: relative; overflow: hidden;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.01);
                }
                .dash-stat-card::before {
                    content: ''; position: absolute; inset: 0; border-radius: 20px;
                    padding: 1px; 
                    background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .dash-stat-card:hover { 
                    transform: translateY(-4px); 
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
                }
                
                .card-red:hover { border-color: rgba(229, 57, 53, 0.3) !important; }
                .card-green:hover { border-color: rgba(16, 185, 129, 0.3) !important; }
                .card-warning:hover { border-color: rgba(245, 158, 11, 0.3) !important; }
                .card-orange:hover { border-color: rgba(249, 115, 22, 0.3) !important; }
                
                .dash-stat-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; }
                .dash-stat-card:hover .dash-stat-icon { transform: scale(1.05); }
                .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); animation: pulse-dot 2s ease-in-out infinite; }
                
                .chart-panel {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(10px);
                    border-radius: 20px; border: 1px solid rgba(0, 0, 0, 0.05);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.01);
                }
                .chart-panel::before {
                    content: ''; position: absolute; inset: 0; border-radius: 20px;
                    padding: 1px; 
                    background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                .chart-panel:hover { box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04); border-color: rgba(0, 0, 0, 0.08); }
                
                .session-card {
                    display: flex; align-items: center; gap: 18px; padding: 18px 22px; border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.04); background: #FFFFFF;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.01);
                }
                .session-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--gradient-primary); border-radius: 4px 0 0 4px; opacity: 0; transition: opacity 0.25s; }
                .session-card:hover { transform: translateX(4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03); border-color: rgba(229, 57, 53, 0.1); }
                .session-card:hover::before { opacity: 1; }
                
                .quick-link {
                    display: flex; align-items: center; gap: 16px; padding: 16px 20px;
                    border-radius: 16px; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.04);
                    cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); text-decoration: none; color: inherit;
                    position: relative; overflow: hidden;
                }
                .quick-link:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03); border-color: rgba(229, 57, 53, 0.08); }
                .quick-link::after {
                    content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent, rgba(229, 57, 53, 0.01), transparent);
                    transform: translateX(-100%); transition: transform 0.5s;
                }
                .quick-link:hover::after { transform: translateX(100%); }
                .quick-link:hover .ql-arrow { transform: translateX(4px); color: var(--primary) !important; }
                .ql-arrow { transition: transform 0.25s; }
                .quick-link:hover .quick-access-icon { transform: scale(1.08); }
                .quick-access-icon { transition: transform 0.25s ease; }
            `}} />

            {/* ── Premium Hero Banner ── */}
            <div className="dash-float" style={{
                background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                margin: '0 8px', borderRadius: '0 0 24px 24px', padding: '36px 40px 40px',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(26, 29, 59, 0.15)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                {/* Soft top-right radial gradient glow */}
                <div style={{ position: 'absolute', top: '-60px', right: '60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Elite profile avatar initials badge */}
                        <div style={{
                            width: '76px', height: '76px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            fontSize: '24px', fontWeight: 800, fontFamily: 'Poppins, sans-serif',
                            boxShadow: '0 6px 20px rgba(229, 57, 53, 0.2)',
                            border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        }}>
                            {teacherInitials}
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <span style={{
                                    background: 'rgba(229, 57, 53, 0.16)', color: '#FF8A80', fontSize: '11px', fontWeight: 800,
                                    padding: '5px 16px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1.2px',
                                    border: '1px solid rgba(229, 57, 53, 0.25)', backdropFilter: 'blur(8px)'
                                }}>
                                    Teacher Portal
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="live-dot" />
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Live Tracker</span>
                                </div>
                            </div>
                            <h1 style={{
                                fontSize: '32px', fontWeight: 800, margin: 0, fontFamily: 'Poppins, sans-serif',
                                letterSpacing: '-0.8px', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}>
                                {timeGreeting}, <span style={{ color: '#FFFFFF' }}>{data?.teacher_name || 'Teacher'}</span>! 👋
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14.5px', marginTop: '8px', fontWeight: 500, maxWidth: '580px', lineHeight: 1.5 }}>
                                {dayName}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} — 
                                You have <span style={{ color: '#FF8A80', fontWeight: 800 }}>{data?.today?.classes?.length || 0} classes</span> scheduled for today.
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => router.push('/teacher/timetable')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.12)',
                                padding: '14px 24px', borderRadius: '16px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '14px', transition: 'all 0.25s', backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <Calendar size={16} /> My Schedule
                        </button>
                        <button
                            onClick={() => router.push('/teacher/students')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'var(--gradient-primary)', color: 'white', border: 'none',
                                padding: '14px 24px', borderRadius: '16px', cursor: 'pointer',
                                fontWeight: 700, fontSize: '14px', transition: 'all 0.25s',
                                boxShadow: '0 6px 20px rgba(229, 57, 53, 0.4)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(229, 57, 53, 0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.4)'; }}
                        >
                            <Users size={16} /> View Students
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 16px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* ── Premium Stats Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '36px', marginBottom: '36px' }}>
                    {[
                        { icon: BookOpen, label: 'My Classes', value: totalClasses, color: 'var(--primary)', bg: 'var(--primary-light)', desc: 'Active assigned classes', accent: '#E53935', typeClass: 'card-red' },
                        { icon: Users, label: 'Total Students', value: totalStudents, color: 'var(--success)', bg: 'var(--success-light)', desc: 'Enrolled under supervision', accent: '#10B981', typeClass: 'card-green' },
                        { icon: ClipboardList, label: 'Pending Reviews', value: pendingEvals, color: 'var(--warning)', bg: 'var(--warning-light)', desc: 'Pending evaluation reviews', accent: '#F59E0B', typeClass: 'card-warning' },
                        { icon: Target, label: 'Assigned Leads', value: assignedEnqs, color: 'var(--accent-orange)', bg: '#FFF3E0', desc: 'Active course enquiries', accent: '#F97316', typeClass: 'card-orange' },
                    ].map((s, idx) => (
                        <div key={s.label} className={`dash-stat-card dash-float ${s.typeClass}`} style={{ animationDelay: `${120 + idx * 80}ms` }}>
                            {/* Decorative glowing sphere inside card */}
                            <div style={{
                                position: 'absolute', right: '-16px', top: '-16px', width: '90px', height: '90px',
                                borderRadius: '50%', background: s.bg, opacity: 0.5, filter: 'blur(16px)', zIndex: 0
                            }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', position: 'relative', zIndex: 1 }}>
                                <div className="dash-stat-icon" style={{ background: s.bg, color: s.color }}>
                                    <s.icon size={26} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.02)', padding: '4px 10px', borderRadius: '12px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.accent }} />
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>Live</span>
                                </div>
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: '#1A1D3B', marginBottom: '4px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.8px' }}>{s.value}</div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.label}</div>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)', marginTop: '8px', fontWeight: 500 }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Analytics Charts ── */}
                <div className="dash-float" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '28px', marginBottom: '36px', animationDelay: '400ms' }}>
                    {/* Performance Chart */}
                    <div className="chart-panel" style={{ padding: '32px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <BarChart3 size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Class Performance</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>Average student marks across recent examinations</p>
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                background: 'var(--primary-light)', color: 'var(--primary)',
                                fontSize: '11px', fontWeight: 800, padding: '6px 16px', borderRadius: '12px', letterSpacing: '0.5px',
                                textTransform: 'uppercase', border: '1px solid rgba(229,57,53,0.1)'
                            }}>
                                Active Batches
                            </span>
                        </div>
                        
                        <div style={{ height: '300px', width: '100%' }}>
                            {performanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="barGradientPremium" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#E53935" />
                                                <stop offset="100%" stopColor="#880E4F" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.04)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888C9F', fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888C9F', fontWeight: 600 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(229, 57, 53, 0.02)' }}
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(229, 57, 53, 0.1)',
                                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.05)',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                color: '#1A1D3B'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="url(#barGradientPremium)" radius={[12, 12, 4, 4]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                    <BarChart3 size={42} style={{ marginBottom: '14px', opacity: 0.3, color: 'var(--primary)' }} />
                                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>No performance data available</p>
                                    <p style={{ fontSize: '12.5px', marginTop: '6px' }}>Performance trends will unlock once test evaluations are published.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance Trend */}
                    <div className="chart-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                                        <TrendingUp size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Attendance Trend</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>Roll call metrics and percentage trends</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ height: '180px', width: '100%', flex: 1 }}>
                            {attendanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceData} margin={{ left: -30, right: 5, top: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="attendGradPremium" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.24} />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.04)" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#888C9F', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(16, 185, 129, 0.1)',
                                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.05)',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            color: '#1A1D3B'
                                        }} />
                                        <Area type="monotone" dataKey="percentage" stroke="#10B981" fill="url(#attendGradPremium)" strokeWidth={3} dot={{ stroke: '#10B981', strokeWidth: 2, r: 4, fill: '#white' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                    <TrendingUp size={42} style={{ marginBottom: '14px', opacity: 0.3, color: 'var(--success)' }} />
                                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>No attendance history</p>
                                </div>
                            )}
                        </div>

                        {/* Attendance summary card */}
                        <div style={{
                            marginTop: '24px', padding: '16px 20px', borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
                            border: '1px solid rgba(16,185,129,0.15)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle size={18} color="var(--success)" />
                                <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>Avg Attendance Compliance</span>
                            </div>
                            <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '20px', fontFamily: 'Poppins, sans-serif' }}>
                                {avgAttendance}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Grid: Today's Sessions + Pipeline + Quick Links ── */}
                <div className="dash-float" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px', animationDelay: '500ms' }}>
                    {/* Today's Schedule */}
                    <div className="chart-panel" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '26px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '14px', background: 'var(--gradient-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                                    boxShadow: '0 6px 16px rgba(229, 57, 53, 0.25)'
                                }}>
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Today&apos;s Sessions</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>Classes and scheduled sessions for {dayName}</p>
                                </div>
                            </div>
                            {data?.today?.classes?.length > 0 && (
                                <span style={{
                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                    padding: '6px 16px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 800,
                                    border: '1px solid rgba(229,57,53,0.08)'
                                }}>
                                    {data.today.classes.length} Session{data.today.classes.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {data?.today?.classes?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {data.today.classes.map((cls: any) => {
                                    const isOnlineClass = !!cls.online_link;
                                    return (
                                        <div key={cls.id} className="session-card">
                                            {/* Time Column */}
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '18px',
                                                background: isOnlineClass ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--gradient-primary)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
                                                fontWeight: 800, flexShrink: 0, boxShadow: isOnlineClass ? '0 6px 16px rgba(16, 185, 129, 0.25)' : '0 6px 16px rgba(229, 57, 53, 0.25)'
                                            }}>
                                                <span style={{ fontSize: '8px', opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start</span>
                                                <span style={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif', fontWeight: 800 }}>{cls.class_time_start || '4PM'}</span>
                                            </div>
                                            
                                            {/* Subject / Class details */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <p style={{ fontWeight: 800, fontSize: '16px', color: '#1A1D3B', margin: 0 }}>{cls.class_name}</p>
                                                    {isOnlineClass && (
                                                        <span style={{ fontSize: '10px', fontWeight: 800, background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '6px' }}>
                                                            Online
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '18px', marginTop: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                        <Users size={14} color="var(--primary)" /> {cls.student_count || 0} Students
                                                    </span>
                                                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                        <MapPin size={14} color="var(--primary)" /> {isOnlineClass ? 'Virtual Room' : `Room ${cls.room_number || 'B1'}`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Action Column */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {isOnlineClass && (
                                                    <a
                                                        href={cls.online_link.startsWith('http') ? cls.online_link : `https://${cls.online_link}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{
                                                            background: '#FFFFFF', color: 'var(--success)', border: '1.5px solid var(--success)',
                                                            padding: '8px 16px', borderRadius: '12px', fontSize: '12px',
                                                            fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px',
                                                            transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(16,185,129,0.05)'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--success)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = 'var(--success)'; }}
                                                    >
                                                        <Video size={13} /> Join Live
                                                    </a>
                                                )}
                                                
                                                {cls.attendance_marked ? (
                                                    <span style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        color: 'var(--success)', background: 'var(--success-light)',
                                                        fontWeight: 800, fontSize: '12px', padding: '8px 16px', borderRadius: '12px',
                                                        border: '1px solid rgba(16,185,129,0.1)'
                                                    }}>
                                                        <CheckCircle size={15} /> Attendance Marked
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/teacher/attendance`)}
                                                        style={{
                                                            background: 'var(--gradient-primary)', color: 'white', border: 'none',
                                                            padding: '9px 18px', borderRadius: '12px', fontSize: '12.5px',
                                                            fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.2)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 57, 53, 0.3)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.2)'; }}
                                                    >
                                                        Mark Attendance
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border-secondary)' }}>
                                <Calendar size={44} color="var(--text-tertiary)" style={{ display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
                                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 700 }}>No classes scheduled for today</p>
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>Enjoy your free day or utilize this time for evaluation reviews & lesson planning!</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Pipeline + Quick Links + Smart Tips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Enquiry Pipeline */}
                        <div className="chart-panel" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-orange)' }}>
                                        <Target size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Enquiry Pipeline</h3>
                                        <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>Assigned student inquiries</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {data?.enquiries && data.enquiries.length > 0 ? (
                                    data.enquiries.slice(0, 3).map((enq: any) => (
                                        <div
                                            key={enq.id}
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '16px', borderRadius: '16px', background: '#FAFBFD',
                                                border: '1px solid rgba(0,0,0,0.03)', transition: 'all 0.25s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F9'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FAFBFD'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Users size={16} color="var(--accent-orange)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14.5px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>{enq.student_name}</p>
                                                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>{enq.interested_course}</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '10px', fontSize: '10.5px',
                                                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px',
                                                background: enq.status === 'new' ? 'var(--primary-light)' : '#FFF3E0',
                                                color: enq.status === 'new' ? 'var(--primary)' : 'var(--accent-orange)',
                                                border: `1.5px solid ${enq.status === 'new' ? 'rgba(229,57,53,0.1)' : 'rgba(249,115,22,0.1)'}`
                                            }}>
                                                {enq.status || 'New'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                                        <p style={{ fontSize: '13.5px', fontWeight: 600 }}>No active inquiries assigned.</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push('/teacher/enquiries')}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '16px',
                                        border: '1.5px solid var(--border-secondary)', background: '#FFFFFF',
                                        color: 'var(--text-secondary)', fontSize: '13.5px', fontWeight: 800,
                                        cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '6px', transition: 'all 0.25s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#1A1D3B'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#1A1D3B'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-secondary)'; }}
                                >
                                    View Full Pipeline <ArrowUpRight size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Navigation Links */}
                        <div className="chart-panel" style={{ padding: '28px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Poppins, sans-serif' }}>
                                <Sparkles size={16} color="var(--primary)" /> Quick Access Console
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Homework Manager', desc: 'Assign work & track student submissions', icon: BookOpen, path: '/teacher/homework' },
                                    { label: 'Test Results Portal', desc: 'Grade evaluations and upload marks', icon: GraduationCap, path: '/teacher/tests' },
                                    { label: 'Study Materials', desc: 'Upload handouts and digital resources', icon: Layers, path: '/teacher/study-materials' },
                                ].map(link => (
                                    <div key={link.label} className="quick-link" onClick={() => router.push(link.path)}>
                                        <div className="quick-access-icon" style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                            <link.icon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '14.5px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{link.label}</p>
                                            <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', margin: '3px 0 0 0', fontWeight: 500 }}>{link.desc}</p>
                                        </div>
                                        <ArrowRight size={18} color="var(--text-tertiary)" className="ql-arrow" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pro Tip Card */}
                        <div style={{
                            padding: '28px 32px', borderRadius: '26px',
                            background: 'linear-gradient(135deg, #121426 0%, #20234a 60%, #301431 100%)',
                            color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 16px 36px rgba(15, 17, 35, 0.25)',
                            border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.12, filter: 'blur(30px)' }} />
                            <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '110px', height: '110px', borderRadius: '50%', background: 'var(--accent-teal)', opacity: 0.1, filter: 'blur(20px)' }} />
                            
                            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Poppins, sans-serif', position: 'relative', zIndex: 1 }}>
                                <Zap size={18} color="#FF8A80" /> Pro Performance Tip
                            </h4>
                            <p style={{ fontSize: '13.5px', lineHeight: 1.7, opacity: 0.85, fontWeight: 500, position: 'relative', zIndex: 1 }}>
                                Marking daily attendance within 15 minutes of class commencement keeps your compliance rating above 98% and automates parent notifications instantly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

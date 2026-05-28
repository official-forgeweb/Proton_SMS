'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Award, Target, Activity, Calendar, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

export default function StudentPerformancePage() {
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            const res = await api.get('/students/me/performance');
            setPerformanceData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch performance data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (!performanceData) return null;
        const trend = performanceData.trend || [];
        const subjects = performanceData.subjectAnalytics || [];
        
        const totalTests = trend.length;
        
        let totalScore = 0;
        trend.forEach((t: any) => totalScore += t.score);
        const avgScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
        
        let strongestSubject = 'N/A';
        let highestAvg = -1;
        let weakestSubject = 'N/A';
        let lowestAvg = 101;
        
        subjects.forEach((s: any) => {
            if (s.average > highestAvg) {
                highestAvg = s.average;
                strongestSubject = s.subject;
            }
            if (s.average < lowestAvg) {
                lowestAvg = s.average;
                weakestSubject = s.subject;
            }
        });
        
        return {
            totalTests,
            avgScore,
            strongestSubject: strongestSubject === 'N/A' ? 'N/A' : `${strongestSubject} (${Math.round(highestAvg)}%)`,
            weakestSubject: weakestSubject === 'N/A' ? 'N/A' : `${weakestSubject} (${Math.round(lowestAvg)}%)`
        };
    }, [performanceData]);

    const COLORS = ['#E53935', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0 }}>
                            Performance Analytics
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Detailed, real-time breakdown of your academic progress and insights.
                        </p>
                    </div>
                </div>

                <div className="page-body">
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-fade-in" style={{ 
                                    height: '110px', 
                                    borderRadius: '20px', 
                                    animationDelay: `${i * 80}ms`, 
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(8px)'
                                }} />
                            ))}
                        </div>
                    ) : !performanceData || (!performanceData.trend?.length && !performanceData.subjectAnalytics?.length) ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '80px 40px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{ width: '64px', height: '64px', background: '#FFF5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <ShieldAlert size={32} color="#E53935" />
                            </div>
                            <h3 style={{ fontSize: '20px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Analytics Data Yet</h3>
                            <p style={{ fontSize: '15px', color: '#64748B', fontWeight: 500, maxWidth: '400px', margin: '0 auto' }}>
                                We need at least one completed assessment to generate your academic performance analytics profile.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Performance Stats Cards */}
                            {stats && (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                                    gap: '20px', 
                                    marginBottom: '32px' 
                                }}>
                                    {/* Average Score Card */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        boxShadow: '0 8px 32px rgba(26, 29, 59, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                                            <Award size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Score</div>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                                                {stats.avgScore}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Tests Taken Card */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                        backdropFilter: 'blur(16px)',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(229, 57, 53, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                            <CheckCircle size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tests Evaluated</div>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>{stats.totalTests}</div>
                                        </div>
                                    </div>

                                    {/* Strongest Subject */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                        backdropFilter: 'blur(16px)',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                            <TrendingUp size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strongest Area</div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={stats.strongestSubject}>
                                                {stats.strongestSubject}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Needs Improvement */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                        backdropFilter: 'blur(16px)',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                                            <AlertCircle size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Attention</div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={stats.weakestSubject}>
                                                {stats.weakestSubject}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Charts Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                                {/* Performance Trend Chart */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    backdropFilter: 'blur(16px)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(229, 57, 53, 0.04)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.03)';
                                }}
                                >
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                            <TrendingUp size={20} color="#E53935" /> Academic Trend
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                                            Progressive score tracking across recent assessments.
                                        </p>
                                    </div>
                                    <div style={{ width: '100%', height: '320px', marginTop: 'auto' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={performanceData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#E53935" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#E53935" stopOpacity={0.01}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }}
                                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    axisLine={{ stroke: '#E2E8F0' }}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)'
                                                    }}
                                                    formatter={(value) => [`${value}%`, 'Score']}
                                                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#E53935"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorScore)"
                                                    dot={{ r: 5, fill: '#E53935', strokeWidth: 2.5, stroke: '#fff' }}
                                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Subject wise performance */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    backdropFilter: 'blur(16px)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.04)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.03)';
                                }}
                                >
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                            <Target size={20} color="#3B82F6" /> Subject Breakdown
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                                            Average test score analytics categorized by course subject.
                                        </p>
                                    </div>
                                    <div style={{ width: '100%', height: '320px', marginTop: 'auto' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData.subjectAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis
                                                    dataKey="subject"
                                                    tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }}
                                                    axisLine={{ stroke: '#E2E8F0' }}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 11, fill: '#8F92A1', fontWeight: 600 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(226, 232, 240, 0.3)', radius: 6 }}
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)'
                                                    }}
                                                    formatter={(value) => [`${value}%`, 'Average']}
                                                />
                                                <Bar dataKey="average" radius={[8, 8, 0, 0]} barSize={32}>
                                                    {performanceData.subjectAnalytics.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

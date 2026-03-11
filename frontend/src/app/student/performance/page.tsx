'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Award, Target, Activity, Calendar } from 'lucide-react';
import api from '@/lib/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Performance Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Detailed breakdown of your academic progress.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <div className="spinner" />
                    </div>
                ) : !performanceData || (performanceData.trend?.length === 0 && performanceData.subjectAnalytics?.length === 0) ? (
                    <div className="card empty-state" style={{ padding: '60px' }}>
                        <div style={{ background: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Activity size={40} color="var(--text-tertiary)" />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700 }}>No Analytics Data Yet</h3>
                        <p style={{ maxWidth: '400px', margin: '8px auto 24px', color: 'var(--text-secondary)' }}>
                            We need at least one completed assessment to generate your performance profile.
                            Check your upcoming tests to get started!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>

                        {/* Performance Trend */}
                        <div className="card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={20} color="var(--primary)" /> Academic Trend
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    Your score progression over recent assessments.
                                </p>
                            </div>
                            <div style={{ width: '100%', height: '320px', marginTop: 'auto' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceData.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            axisLine={{ stroke: 'var(--border-primary)' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-primary)',
                                                boxShadow: 'var(--shadow-lg)',
                                                fontSize: '13px'
                                            }}
                                            formatter={(value) => [`${value}%`, 'Score']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="var(--primary)"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject Wise Progress */}
                        <div className="card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', animationDelay: '100ms' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Target size={20} color="var(--success)" /> Subject Performance
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    Average scores categorized by subject areas.
                                </p>
                            </div>
                            <div style={{ width: '100%', height: '320px', marginTop: 'auto' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData.subjectAnalytics}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" />
                                        <XAxis
                                            dataKey="subject"
                                            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                                            axisLine={{ stroke: 'var(--border-primary)' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-primary)',
                                                boxShadow: 'var(--shadow-lg)',
                                                fontSize: '13px'
                                            }}
                                            formatter={(value) => [`${value}%`, 'Average']}
                                        />
                                        <Bar dataKey="average" radius={[6, 6, 0, 0]} barSize={40}>
                                            {performanceData.subjectAnalytics.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

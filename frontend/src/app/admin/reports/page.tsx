'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Download, PieChart, Activity } from 'lucide-react';

export default function ReportsPage() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Analytics & Reports</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Comprehensive data insights and performance analytics.
                    </p>
                </div>
                <button className="btn btn-primary"><Download size={16} /> Export Master Report</button>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {[
                        { title: 'Enrollment Trends', icon: TrendingUp, desc: 'Month-over-month admission and dropout metrics' },
                        { title: 'Revenue Analytics', icon: BarChart3, desc: 'Fee collection vs pending projections' },
                        { title: 'Batch Performance', icon: Activity, desc: 'Comparative test scores across different batches' },
                        { title: 'Demographics', icon: PieChart, desc: 'Student distribution by area, age, and boards' },
                    ].map((r, i) => {
                        const Icon = r.icon;
                        return (
                            <div key={i} className="card hover-lift" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ marginBottom: '16px', background: 'var(--bg-tertiary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={24} color="var(--primary)" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{r.title}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.5 }}>
                                    {r.desc}
                                </p>
                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Generate Report <TrendingUp size={14} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}

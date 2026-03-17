'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Download, PieChart, Activity, ArrowRight } from 'lucide-react';

export default function ReportsPage() {
    const reports = [
        { title: 'Enrollment Trends', icon: TrendingUp, desc: 'Month-over-month admission and dropout metrics', color: '#4F60FF', bg: '#EEF0FF' },
        { title: 'Revenue Analytics', icon: BarChart3, desc: 'Fee collection vs pending projections', color: '#10B981', bg: '#D1FAE5' },
        { title: 'Batch Performance', icon: Activity, desc: 'Comparative test scores across different batches', color: '#F97316', bg: '#FFF3E0' },
        { title: 'Demographics', icon: PieChart, desc: 'Student distribution by area, age, and boards', color: '#7B5EA7', bg: '#F3EEFF' },
    ];

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                            Analytics & Reports
                        </h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Comprehensive data insights and performance analytics.
                        </p>
                    </div>
                    <button style={{
                        background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                        color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px',
                        fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center',
                        gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)',
                    }}>
                        <Download size={16} /> Export Master Report
                    </button>
                </div>

                {/* Report Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {reports.map((r, i) => {
                        const Icon = r.icon;
                        return (
                            <div
                                key={i}
                                style={{
                                    background: '#FFFFFF', borderRadius: '18px', padding: '28px',
                                    border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                                }}
                            >
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    background: r.bg, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', marginBottom: '20px',
                                }}>
                                    <Icon size={26} color={r.color} strokeWidth={2} />
                                </div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>
                                    {r.title}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#8F92A1', flex: 1, lineHeight: 1.6 }}>
                                    {r.desc}
                                </p>
                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F0F0F5' }}>
                                    <span style={{
                                        fontSize: '13px', fontWeight: 700, color: r.color,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}>
                                        Generate Report <ArrowRight size={14} />
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

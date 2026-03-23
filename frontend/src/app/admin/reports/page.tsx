'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Download, PieChart, Activity, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { jsonToCsv, downloadCsv } from '@/lib/csv';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [visualData, setVisualData] = useState<any>(null);
    const [loadingVisuals, setLoadingVisuals] = useState(true);

    const COLORS = ['#E53935', '#10B981', '#F97316', '#C62828', '#E84142'];

    const reports = [
        { id: 'enrollment', title: 'Enrollment Trends', icon: TrendingUp, desc: 'Month-over-month admission and dropout metrics', color: '#E53935', bg: '#FFEBEE' },
        { id: 'revenue', title: 'Revenue Analytics', icon: BarChart3, desc: 'Fee collection vs pending projections', color: '#10B981', bg: '#D1FAE5' },
        { id: 'batch-performance', title: 'Batch Performance', icon: Activity, desc: 'Comparative test scores across different batches', color: '#F97316', bg: '#FFF3E0' },
        { id: 'demographics', title: 'Demographics', icon: PieChart, desc: 'Student distribution by area, age, and boards', color: '#C62828', bg: '#F3EEFF' },
    ];

    useEffect(() => {
        const fetchVisuals = async () => {
            try {
                const { data } = await api.get('/reports/visual');
                if (data.success) {
                    setVisualData(data.data);
                }
            } catch (error) {
                console.error('Failed to load visual data', error);
            } finally {
                setLoadingVisuals(false);
            }
        };
        fetchVisuals();
    }, []);

    const generateReport = async (reportId: string, title: string) => {
        try {
            setDownloading(reportId);
            const { data } = await api.get(`/reports/${reportId}`);
            
            if (!data.success || !data.data || data.data.length === 0) {
                toast.error('No data available for this report');
                return;
            }

            const csvString = jsonToCsv(data.data);
            const filename = `${reportId}_report_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCsv(csvString, filename);
            toast.success(`${title} downloaded successfully`);
        } catch (error) {
            console.error('Report error:', error);
            toast.error('Failed to generate report');
        } finally {
            setDownloading(null);
        }
    };

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
                    <button 
                        onClick={() => generateReport('master', 'Master Report')}
                        disabled={downloading === 'master'}
                        style={{
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px',
                            fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center',
                            gap: '8px', cursor: downloading === 'master' ? 'not-allowed' : 'pointer', 
                            boxShadow: '0 4px 14px rgba(229,57,53,0.3)',
                            opacity: downloading === 'master' ? 0.7 : 1,
                        }}
                    >
                        {downloading === 'master' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                        {downloading === 'master' ? 'Preparing...' : 'Export Master Report'}
                    </button>
                </div>

                {/* Visual Dashboards */}
                {!loadingVisuals && visualData && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        {/* Demographics Pie Chart */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>Student Demographics</h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.demographics}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            label
                                        >
                                            {visualData.demographics.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Bar Chart */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>Revenue by Status</h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.fees}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} name="Total Amount (₹)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Test Grades Bar Chart */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>Test Grades Distribution</h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.testGrades}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#C62828" radius={[4, 4, 0, 0]} name="Number of Students" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Enquiries Pie Chart */}
                        <div style={{ background: 'white', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>Enquiries by Status</h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.enquiries}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={50}
                                            label
                                        >
                                            {visualData.enquiries.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Table Export Cards */}
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1D3B', marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>Detailed Data Exports</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {reports.map((r) => {
                        const Icon = r.icon;
                        const isDownloading = downloading === r.id;
                        return (
                            <div
                                key={r.id}
                                onClick={() => !isDownloading && generateReport(r.id, r.title)}
                                style={{
                                    background: '#FFFFFF', borderRadius: '18px', padding: '28px',
                                    border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    cursor: isDownloading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    opacity: isDownloading ? 0.7 : 1,
                                }}
                                onMouseEnter={e => {
                                    if(isDownloading) return;
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={e => {
                                    if(isDownloading) return;
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
                                        {isDownloading ? (
                                            <>Generating... <Loader2 size={14} className="animate-spin" /></>
                                        ) : (
                                            <>Generate Report <ArrowRight size={14} /></>
                                        )}
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

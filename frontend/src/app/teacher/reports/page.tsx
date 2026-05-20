'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Download, PieChart, Activity, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
        { id: 'enrollment', title: 'Enrollment Trends', icon: TrendingUp, desc: 'Month-over-month admission and dropout metrics', color: '#E53935', bg: 'rgba(229, 57, 53, 0.08)' },
        { id: 'revenue', title: 'Revenue Analytics', icon: BarChart3, desc: 'Fee collection vs pending projections', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
        { id: 'batch-performance', title: 'Batch Performance', icon: Activity, desc: 'Comparative test scores across different batches', color: '#F97316', bg: 'rgba(249, 115, 22, 0.08)' },
        { id: 'demographics', title: 'Demographics', icon: PieChart, desc: 'Student distribution by area, age, and boards', color: '#C62828', bg: 'rgba(198, 40, 40, 0.08)' },
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
            box-shadow: 0 16px 36px rgba(229, 57, 53, 0.05);
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
        .report-grid-card {
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `;

    return (
        <DashboardLayout requiredRole="teacher">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '120px' }}>
                
                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                <BarChart3 size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Analytics & Reports
                            </h1>
                        </div>
                        <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                            Track institutional analytics, fee status, grades, and demographics in real-time.
                        </p>
                    </div>

                    <button 
                        className="gradient-btn"
                        onClick={() => generateReport('master', 'Master Report')}
                        disabled={downloading === 'master'}
                        style={{
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '14px', 
                            padding: '12px 24px',
                            fontSize: '15px', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px', 
                            cursor: downloading === 'master' ? 'not-allowed' : 'pointer', 
                            opacity: downloading === 'master' ? 0.7 : 1,
                        }}
                    >
                        {downloading === 'master' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                        {downloading === 'master' ? 'Compiling CSV...' : 'Export Master Report'}
                    </button>
                </div>

                {/* Visual Analytics Panels */}
                {loadingVisuals ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card" style={{ height: '320px', opacity: 0.6 }} />
                        ))}
                    </div>
                ) : visualData ? (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                        
                        {/* Demographics Pie Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                Student Demographics
                            </h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.demographics}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={75}
                                            innerRadius={45}
                                            label
                                        >
                                            {visualData.demographics.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Bar Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                Revenue Collection
                            </h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.fees}>
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#8F92A1' }} />
                                        <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#8F92A1' }} />
                                        <Tooltip />
                                        <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} name="Total Amount (₹)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Test Grades Bar Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                Test Grades Distribution
                            </h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.testGrades}>
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#8F92A1' }} />
                                        <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#8F92A1' }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#E53935" radius={[6, 6, 0, 0]} name="Students Count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Enquiries Pie Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                Enquiries Status
                            </h3>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.enquiries}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={75}
                                            innerRadius={45}
                                            label
                                        >
                                            {visualData.enquiries.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Report Table Export Cards */}
                <div className="animate-fade-in">
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', marginBottom: '20px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.015em' }}>
                        Detailed CSV Datasets
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {reports.map((r) => {
                            const Icon = r.icon;
                            const isDownloading = downloading === r.id;
                            
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => !isDownloading && generateReport(r.id, r.title)}
                                    className="glass-card report-grid-card"
                                    style={{
                                        padding: '28px',
                                        cursor: isDownloading ? 'not-allowed' : 'pointer', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        opacity: isDownloading ? 0.7 : 1,
                                    }}
                                >
                                    <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '16px',
                                        background: r.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '20px',
                                        color: r.color
                                    }}>
                                        <Icon size={24} strokeWidth={2.2} />
                                    </div>
                                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                        {r.title}
                                    </h3>
                                    <p style={{ fontSize: '13.5px', color: '#5E6278', flex: 1, lineHeight: 1.5, fontWeight: 500 }}>
                                        {r.desc}
                                    </p>
                                    
                                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1.5px solid rgba(226, 232, 240, 0.6)' }}>
                                        <span style={{
                                            fontSize: '13px', 
                                            fontWeight: 800, 
                                            color: r.color,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                        }}>
                                            {isDownloading ? (
                                                <>Compiling... <Loader2 size={14} className="animate-spin" /></>
                                            ) : (
                                                <>Generate Report <ArrowRight size={14} strokeWidth={2.5} /></>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <ToolBottomBar />
        </DashboardLayout>
    );
}

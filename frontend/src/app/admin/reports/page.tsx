'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Download, PieChart, Activity, ArrowRight, Loader2, Calendar, FileText, ChevronRight, Share2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { jsonToCsv, downloadCsv } from '@/lib/csv';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend, CartesianGrid } from 'recharts';

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [visualData, setVisualData] = useState<any>(null);
    const [loadingVisuals, setLoadingVisuals] = useState(true);

    const COLORS = ['#E53935', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

    const reports = [
        { id: 'enrollment', title: 'Enrollment Trends', icon: TrendingUp, desc: 'Month-over-month admission and dropout metrics', color: '#E53935', bg: 'rgba(229, 57, 53, 0.08)' },
        { id: 'revenue', title: 'Revenue Analytics', icon: BarChart3, desc: 'Detailed fee collection vs pending projections', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
        { id: 'batch-performance', title: 'Batch Performance', icon: Activity, desc: 'Comparative test scores across different batches', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)' },
        { id: 'demographics', title: 'Demographics', icon: PieChart, desc: 'Student distribution by area, age, and boards', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)' },
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
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
            border-radius: 24px;
            transition: all 0.3s ease;
        }
        .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.06);
            border-color: rgba(255, 255, 255, 0.9);
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.1) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%);
        }
        .chart-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        .chart-title {
            font-size: 17px;
            fontWeight: 800;
            color: #1A1D3B;
            font-family: 'Poppins', sans-serif;
            margin: 0;
        }
        .report-btn {
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .report-btn:active {
            transform: scale(0.95);
        }
    `;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: customStyles}} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px' }}>
                
                {/* Page Header */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(26,29,59,0.3)' }}>
                                <BarChart3 size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Analytics & Reports
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Real-time <span style={{ color: '#E53935', fontWeight: 700 }}>Data Intelligence</span> & decision support
                        </p>
                    </div>
                    <button 
                        onClick={() => generateReport('master', 'Master Report')}
                        disabled={downloading === 'master'}
                        className="report-btn"
                        style={{
                            background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                            color: 'white', border: 'none', borderRadius: '14px', padding: '12px 24px',
                            fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center',
                            gap: '10px', cursor: downloading === 'master' ? 'not-allowed' : 'pointer', 
                            boxShadow: '0 8px 20px -6px rgba(229,57,53,0.4)',
                            opacity: downloading === 'master' ? 0.7 : 1,
                        }}
                    >
                        {downloading === 'master' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
                        {downloading === 'master' ? 'Compiling Master Data...' : 'Export Master Report'}
                    </button>
                </div>

                {/* Visual Dashboards */}
                {loadingVisuals ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                         <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 24px' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                        </div>
                        <p style={{ color: '#1A1D3B', fontSize: '16px', fontWeight: 600 }}>Analyzing institutional parameters...</p>
                    </div>
                ) : visualData ? (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '40px', animationDelay: '100ms' }}>
                        
                        {/* Demographics Pie Chart */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <div className="chart-header">
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PieChart size={18} strokeWidth={2.5} />
                                </div>
                                <h3 className="chart-title">Student Demographics</h3>
                            </div>
                            <div style={{ height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.demographics}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%" cy="50%"
                                            outerRadius={90}
                                            innerRadius={65}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {visualData.demographics.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Bar Chart */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <div className="chart-header">
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={18} strokeWidth={2.5} />
                                </div>
                                <h3 className="chart-title">Revenue Distribution (₹)</h3>
                            </div>
                            <div style={{ height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.fees} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                                        <Tooltip 
                                            cursor={{fill: '#F8FAFC'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '13px' }} 
                                        />
                                        <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Test Grades Bar Chart */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <div className="chart-header">
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={18} strokeWidth={2.5} />
                                </div>
                                <h3 className="chart-title">Academics Performance</h3>
                            </div>
                            <div style={{ height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visualData.testGrades}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                                        <Tooltip 
                                            cursor={{fill: '#F8FAFC'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '13px' }} 
                                        />
                                        <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Enquiries Pie Chart */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <div className="chart-header">
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Share2 size={18} strokeWidth={2.5} />
                                </div>
                                <h3 className="chart-title">Lead Pipeline Analysis</h3>
                            </div>
                            <div style={{ height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={visualData.enquiries}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%" cy="50%"
                                            outerRadius={90}
                                            innerRadius={65}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {visualData.enquiries.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Report Table Export Cards */}
                <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                         <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <FileText size={18} color="#1A1D3B" strokeWidth={2.5} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Detailed Data Exports</h2>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {reports.map((r) => {
                            const Icon = r.icon;
                            const isDownloading = downloading === r.id;
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => !isDownloading && generateReport(r.id, r.title)}
                                    className="glass-card"
                                    style={{
                                        padding: '28px', border: '1px solid rgba(255,255,255,0.8)',
                                        cursor: isDownloading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column',
                                        opacity: isDownloading ? 0.7 : 1,
                                    }}
                                >
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        background: r.bg, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', marginBottom: '24px',
                                        boxShadow: `0 4px 12px ${r.bg}`
                                    }}>
                                        <Icon size={28} color={r.color} strokeWidth={2.5} />
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', marginBottom: '10px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                                        {r.title}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#5E6278', fontWeight: 500, flex: 1, lineHeight: 1.6 }}>
                                        {r.desc}
                                    </p>
                                    <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid rgba(226,232,240,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '13px', fontWeight: 800, color: r.color,
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                        }}>
                                            {isDownloading ? (
                                                <>Processing <Loader2 size={16} className="animate-spin" /></>
                                            ) : (
                                                <>Generate Report <ArrowRight size={16} strokeWidth={2.5} /></>
                                            )}
                                        </span>
                                        <ChevronRight size={18} color="#CBD5E1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';
import api from '@/lib/api';
import { Target, CheckCircle, Calendar, Clock, BookOpen, Sparkles } from 'lucide-react';

export default function TeacherDemosPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchDashboard = () => {
        api.get('/dashboard/teacher')
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const markCompleted = async (demoId: string) => {
        if (!confirm('Are you sure you want to mark this demo as completed?')) return;
        setUpdatingId(demoId);
        try {
            await api.put(`/enquiries/demos/${demoId}`, { status: 'completed' });
            fetchDashboard();
        } catch (error) {
            console.error(error);
            alert('Failed to update demo status.');
        } finally {
            setUpdatingId(null);
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
            border-radius: 24px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .glass-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 36px rgba(229, 57, 53, 0.06);
            border-color: rgba(229, 57, 53, 0.2);
        }
        .bg-mesh {
            background-color: #f8fafc;
            background-image: radial-gradient(at 0% 0%, rgba(229,57,53,0.03) 0px, transparent 50%),
                              radial-gradient(at 100% 100%, rgba(229,57,53,0.02) 0px, transparent 50%);
        }
    `;

    return (
        <PermissionGuard permissionKey="demos">
            <DashboardLayout requiredRole="teacher">
                <style dangerouslySetInnerHTML={{ __html: customStyles }} />
                
                <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '100px' }}>
                    
                    {/* Header */}
                    <div className="animate-fade-in" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                    <Target size={20} strokeWidth={2.5} />
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                    Demo Classes
                                </h1>
                            </div>
                            <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                                Connect with prospective students and deliver impactful trial classes.
                            </p>
                        </div>
                    </div>

                    {/* Page Body */}
                    <div className="page-body">
                        {isLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '240px', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0', opacity: 0.6, animation: 'pulse 2s infinite' }} />
                                ))}
                            </div>
                        ) : data?.upcoming_demos?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                                {data.upcoming_demos.map((demo: any, idx: number) => {
                                    const isScheduled = demo.status === 'scheduled';
                                    return (
                                        <div key={demo.id} className="glass-card animate-fade-in" style={{ animationDelay: `${idx * 50}ms`, padding: '24px' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        fontWeight: 800, 
                                                        color: isScheduled ? '#D97706' : '#059669',
                                                        background: isScheduled ? 'rgba(217, 119, 6, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                                                        border: isScheduled ? '1px solid rgba(217, 119, 6, 0.15)' : '1px solid rgba(5, 150, 105, 0.15)',
                                                        padding: '4px 10px',
                                                        borderRadius: '50px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        {demo.status || 'scheduled'}
                                                    </span>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#A1A5B7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Demo Count #{demo.demo_count || 1}
                                                    </span>
                                                </div>

                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>
                                                    {demo.student_name}
                                                </h3>
                                                
                                                <div style={{ display: 'grid', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #F1F5F9', marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                                                        <Calendar size={14} color="#E53935" />
                                                        <span style={{ color: '#94A3B8', fontWeight: 500, marginRight: '4px' }}>Date:</span> {demo.demo_date}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                                                        <Clock size={14} color="#E53935" />
                                                        <span style={{ color: '#94A3B8', fontWeight: 500, marginRight: '4px' }}>Time:</span> {demo.demo_time}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                                                        <BookOpen size={14} color="#E53935" />
                                                        <span style={{ color: '#94A3B8', fontWeight: 500, marginRight: '4px' }}>Topic:</span> {demo.topic || 'General Introduction'}
                                                    </div>
                                                </div>
                                            </div>

                                            {isScheduled && (
                                                <button
                                                    onClick={() => markCompleted(demo.id)}
                                                    disabled={updatingId === demo.id}
                                                    style={{
                                                        width: '100%',
                                                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        cursor: updatingId === demo.id ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.18)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.12)';
                                                    }}
                                                >
                                                    {updatingId === demo.id ? 'Updating Status...' : <><CheckCircle size={14} /> Mark Completed</>}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <div style={{ width: '80px', height: '80px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Sparkles size={36} color="#94A3B8" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B' }}>No Demos Scheduled</h3>
                                <p style={{ color: '#64748B', marginTop: '6px', fontSize: '15px' }}>You have no upcoming trial classes scheduled at this time.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout >
        </PermissionGuard>
    );
}

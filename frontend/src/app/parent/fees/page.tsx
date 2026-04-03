'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { CreditCard, History, Building } from 'lucide-react';

export default function ParentFeesPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/parent').then(res => setData(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const formatCurrency = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;

    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Fee Overview & Payments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Check balances, pay online, and view transaction history.
                    </p>
                </div>
            </div>

            <div className="page-body">
                {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        {/* Due Payments */}
                        {data?.children?.map((child: any) => (
                            <div key={child.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{child.first_name}'s Fee Account</h3>
                                    <span className={`badge ${child.fee?.status === 'paid' ? 'badge-success' : child.fee?.status === 'partial' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: '12px' }}>
                                        {child.fee?.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    {/* Breakdown */}
                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Annual Fee</span>
                                            <span style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(child.fee?.total)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#D1FAE5', color: '#065F46', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Amount Paid</span>
                                            <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatCurrency(child.fee?.paid)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: (child.fee?.pending || 0) > 0 ? '#FEE2E2' : '#D1FAE5', color: (child.fee?.pending || 0) > 0 ? '#991B1B' : '#065F46', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Remaining Balance</span>
                                            <span style={{ fontSize: '18px', fontWeight: 800 }}>{formatCurrency(child.fee?.pending)}</span>
                                        </div>
                                    </div>

                                    {/* Pay Action */}
                                    {(child.fee?.pending || 0) > 0 && (
                                        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', borderRadius: '12px', border: '1px dashed var(--error)', background: 'rgba(239, 68, 68, 0.05)', textAlign: 'center' }}>
                                            <p style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '8px', fontWeight: 600 }}>Pending Amount Due</p>
                                            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--error)' }}>{formatCurrency(child.fee?.pending)}</h2>
                                            <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%', justifyContent: 'center', background: 'var(--error)' }}>
                                                Pay Securely Online
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* History */}
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <History size={20} color="var(--primary)" /> Payment History
                            </h3>
                            <div className="empty-state" style={{ minHeight: '150px' }}>
                                <Building size={32} />
                                <p>Your payment receipts will be digitized and available for download here.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

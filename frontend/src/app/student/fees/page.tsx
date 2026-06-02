'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import ResponsivePageContainer from '@/components/ui/ResponsivePageContainer';
import ResponsiveGrid from '@/components/ui/ResponsiveGrid';
import ResponsiveCard from '@/components/ui/ResponsiveCard';
import { IndianRupee, Clock, CheckCircle2, AlertCircle, FileText, Calendar, ShieldCheck, History, CornerDownRight } from 'lucide-react';

export default function StudentFeesPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/fees/student/me')
            .then(res => {
                setData(res.data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const formatCurrency = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const assignment = data?.assignment;
    const payments = data?.payments || [];
    const installments = assignment?.installments || [];

    const customStyles = `
        .timeline-item {
            position: relative;
            padding-left: 32px;
            padding-bottom: 24px;
        }
        .timeline-item:not(:last-child)::before {
            content: '';
            position: absolute;
            left: 11px;
            top: 24px;
            bottom: 0;
            width: 2px;
            background: #E2E8F0;
        }
        .timeline-bullet {
            position: absolute;
            left: 0;
            top: 2px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }
    `;

    return (
        <DashboardLayout requiredRole="student">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <ResponsivePageContainer style={{ paddingBottom: '120px' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '32px' }} className="animate-page-entry">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                            <IndianRupee size={20} strokeWidth={2.5} />
                        </div>
                        <h1 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                            My Fees & Ledger
                        </h1>
                    </div>
                    <p style={{ color: '#5E6278', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                        Track your upcoming installments, view paid receipts, and review your financial timeline.
                    </p>
                </div>

                {isLoading ? (
                    <ResponsiveGrid desktopCols={3} tabletCols={2} mobileCols={1} gap="20px">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-panel skeleton" style={{ height: '140px' }} />
                        ))}
                    </ResponsiveGrid>
                ) : !assignment ? (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0' }} className="animate-page-entry">
                        <ShieldCheck size={48} style={{ color: '#10B981', marginBottom: '16px', opacity: 0.8 }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 8px 0' }}>No Fees Assigned Yet</h3>
                        <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                            Your fee ledger has not been initialized. If you believe this is an error, please contact administration.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-page-entry">
                        
                        {/* Summary Cards */}
                        <ResponsiveGrid desktopCols={3} tabletCols={3} mobileCols={1} gap="20px">
                            <ResponsiveCard style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none' }}>
                                <p style={{ fontSize: '12px', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Net Payable Fee</p>
                                <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '8px', margin: '8px 0 0 0' }}>{formatCurrency(assignment.final_fee)}</h2>
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '11px', opacity: 0.8 }}>
                                    <span>Base: {formatCurrency(assignment.total_fee)}</span>
                                    <span>•</span>
                                    <span>Scholarship: {formatCurrency(assignment.scholarship_amount || assignment.discount_amount)}</span>
                                </div>
                            </ResponsiveCard>

                            <ResponsiveCard>
                                <p style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Total Paid to Date</p>
                                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#10B981', marginTop: '8px', margin: '8px 0 0 0' }}>{formatCurrency(assignment.total_paid)}</h2>
                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                                    <CheckCircle2 size={14} /> Receipts Authenticated
                                </div>
                            </ResponsiveCard>

                            <ResponsiveCard>
                                <p style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Outstanding Pending</p>
                                <h2 style={{ fontSize: '26px', fontWeight: 900, color: assignment.total_pending > 0 ? '#EF4444' : '#10B981', marginTop: '8px', margin: '8px 0 0 0' }}>{formatCurrency(assignment.total_pending)}</h2>
                                <div style={{
                                    marginTop: '12px', display: 'inline-flex', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                    background: assignment.payment_status === 'paid' ? '#ECFDF5' : assignment.payment_status === 'overdue' ? '#FEF2F2' : '#FFFBEB',
                                    color: assignment.payment_status === 'paid' ? '#059669' : assignment.payment_status === 'overdue' ? '#DC2626' : '#D97706'
                                }}>
                                    {assignment.payment_status}
                                </div>
                            </ResponsiveCard>
                        </ResponsiveGrid>

                        {/* Timeline & Payments Split */}
                        <ResponsiveGrid desktopCols={2} tabletCols={1} mobileCols={1} gap="30px" style={{ alignItems: 'flex-start' }}>
                            
                            {/* Timeline of Installments */}
                            <ResponsiveCard style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={20} style={{ color: '#3B82F6' }} /> Installment Schedule
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {installments.map((inst: any) => {
                                        const isPaid = inst.status === 'paid';
                                        const isOverdue = inst.status === 'overdue';
                                        const isDue = inst.status === 'due';
                                        const isPartial = inst.status === 'partially_paid';

                                        let bulletBg = '#E2E8F0';
                                        let bulletColor = '#64748B';
                                        let bulletIcon = <Clock size={12} />;

                                        if (isPaid) {
                                            bulletBg = '#D1FAE5';
                                            bulletColor = '#10B981';
                                            bulletIcon = <CheckCircle2 size={12} />;
                                        } else if (isOverdue) {
                                            bulletBg = '#FEE2E2';
                                            bulletColor = '#EF4444';
                                            bulletIcon = <AlertCircle size={12} />;
                                        } else if (isDue || isPartial) {
                                            bulletBg = '#FEF3C7';
                                            bulletColor = '#F59E0B';
                                            bulletIcon = <Clock size={12} />;
                                        }

                                        return (
                                            <div key={inst.id} className="timeline-item">
                                                <div className="timeline-bullet" style={{ background: bulletBg, color: bulletColor }}>
                                                    {bulletIcon}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                                            Installment #{inst.installment_number}
                                                        </h4>
                                                        <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500, margin: '4px 0 0 0' }}>
                                                            Due on: <span style={{ color: '#5E6278', fontWeight: 600 }}>{formatDate(inst.due_date)}</span>
                                                        </p>
                                                        {isPartial && (
                                                            <div style={{ fontSize: '12px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                                                                <CornerDownRight size={12} /> Partially Paid: {formatCurrency(inst.paid_amount)}
                                                            </div>
                                                        )}
                                                        {isPaid && inst.paid_date && (
                                                            <div style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontWeight: 600 }}>
                                                                <CornerDownRight size={12} /> Settle Date: {formatDate(inst.paid_date)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B' }}>
                                                            {formatCurrency(inst.amount)}
                                                        </div>
                                                        <span style={{
                                                            display: 'inline-block', padding: '3px 8px', borderRadius: '50px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '6px',
                                                            background: bulletBg, color: bulletColor
                                                        }}>
                                                            {inst.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ResponsiveCard>

                            {/* Paid Receipts */}
                            <ResponsiveCard style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <History size={20} style={{ color: '#10B981' }} /> Paid Receipts
                                </h3>

                                {payments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8F9FD', borderRadius: '16px' }}>
                                        <FileText size={32} color="#A1A5B7" style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 500, margin: 0 }}>No payments recorded yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {payments.map((p: any) => (
                                            <div key={p.id} style={{ padding: '16px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B' }}>{p.receipt_number}</div>
                                                    <div style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500, marginTop: '4px' }}>
                                                        {formatDate(p.payment_date)} • {p.payment_method?.toUpperCase()}
                                                    </div>
                                                    {p.remarks && (
                                                        <div style={{ fontSize: '11px', color: '#5E6278', marginTop: '6px', fontStyle: 'italic' }}>
                                                            "{p.remarks}"
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 900, color: '#10B981', fontSize: '15px' }}>
                                                    +{formatCurrency(p.amount_paid)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ResponsiveCard>

                        </ResponsiveGrid>

                    </div>
                )}

            </ResponsivePageContainer>
        </DashboardLayout>
    );
}

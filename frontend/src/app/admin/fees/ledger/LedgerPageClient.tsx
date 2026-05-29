'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    IndianRupee, Calendar, CreditCard, History, Trash2, 
    Edit3, Check, X, AlertCircle, Info, ArrowLeft, Printer,
    DollarSign, User, TrendingUp, Sparkles, ReceiptText
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface LedgerPageClientProps {
    assignmentId: string;
    role: 'admin' | 'coordinator';
}

export default function LedgerPageClient({ assignmentId, role }: LedgerPageClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [ledgerData, setLedgerData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'payments' | 'audit'>('timeline');

    // Editing timeline state
    const [isEditingTimeline, setIsEditingTimeline] = useState(false);
    const [isSavingTimeline, setIsSavingTimeline] = useState(false);
    const [editableInstallments, setEditableInstallments] = useState<any[]>([]);
    const [drawerNotes, setDrawerNotes] = useState('');
    const [changeReason, setChangeReason] = useState('');

    // Reversing payments state
    const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
    const [deleteRemark, setDeleteRemark] = useState('');

    // Deleting assignment state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    // Fetch student ledger details
    const fetchLedgerDetails = async () => {
        setIsLoading(true);
        try {
            const [detailsRes, paymentsRes] = await Promise.all([
                api.get(`/fees/assignments/${assignmentId}`),
                api.get('/fees/payments')
            ]);
            
            const assignment = detailsRes.data.data;
            const studentPayments = paymentsRes.data.data.filter((p: any) => p.student_id === assignment.student_id);
            
            setLedgerData({ assignment, payments: studentPayments });
            setEditableInstallments(JSON.parse(JSON.stringify(assignment.installments || [])));
            setDrawerNotes(assignment.notes || '');
        } catch (err) {
            console.error('Error fetching ledger details:', err);
            toast.error('Failed to load student ledger information');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (assignmentId) {
            fetchLedgerDetails();
        }
    }, [assignmentId]);

    const formatCurrency = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Form validation for installments sum
    const targetSum = ledgerData?.assignment?.final_fee || 0;
    const installmentsSum = editableInstallments.reduce((acc, curr) => acc + curr.amount, 0);
    const isTimelineSumValid = Math.abs(installmentsSum - targetSum) <= 0.02;

    const handleInstallmentEdit = (index: number, field: string, value: any) => {
        const copy = [...editableInstallments];
        if (field === 'amount') {
            copy[index].amount = Number(value);
        } else if (field === 'due_date') {
            copy[index].due_date = value;
        }
        setEditableInstallments(copy);
    };

    const handleAddInstallment = () => {
        const nextNum = editableInstallments.length + 1;
        let lastDate = new Date();
        if (editableInstallments.length > 0) {
            const parsed = Date.parse(editableInstallments[editableInstallments.length - 1].due_date);
            if (!isNaN(parsed)) {
                lastDate = new Date(parsed);
                lastDate.setMonth(lastDate.getMonth() + 1);
            }
        }
        const yyyy = lastDate.getFullYear();
        const mm = String(lastDate.getMonth() + 1).padStart(2, '0');
        const dd = String(lastDate.getDate()).padStart(2, '0');
        const defaultDate = `${yyyy}-${mm}-${dd}`;

        setEditableInstallments([
            ...editableInstallments,
            {
                installment_number: nextNum,
                amount: 0,
                due_date: defaultDate,
                status: 'upcoming',
                date_change_count: 0,
                date_histories: []
            }
        ]);
    };

    // Save edited installments
    const saveInstallmentAdjustments = async () => {
        if (!isTimelineSumValid) {
            toast.error(`The sum of edited installments (${formatCurrency(installmentsSum)}) must match the Net Payable fee (${formatCurrency(targetSum)}) exactly.`);
            return;
        }
        setIsSavingTimeline(true);
        try {
            await api.put(`/fees/assignments/${assignmentId}`, {
                installments: editableInstallments,
                notes: drawerNotes,
                change_reason: changeReason
            });
            toast.success('Ledger and installments updated successfully!');
            setIsEditingTimeline(false);
            setChangeReason('');
            fetchLedgerDetails();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save timeline changes');
        } finally {
            setIsSavingTimeline(false);
        }
    };

    // Hard delete assignment
    const handleHardDeleteAssignment = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm.');
            return;
        }
        setIsDeleteSubmitting(true);
        try {
            await api.delete(`/fees/assignments/${assignmentId}`, {
                data: { force: true }
            });
            toast.success('Fee assignment and payment history deleted permanently.');
            setIsDeleteDialogOpen(false);
            setDeleteConfirmText('');
            router.push(`/${role}/fees`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete fee assignment');
        } finally {
            setIsDeleteSubmitting(false);
        }
    };

    // Reverse payment receipt
    const handleRevertPayment = async (paymentId: string) => {
        if (!deleteRemark.trim()) {
            toast.error('Please enter a deletion remark to reverse this payment receipt.');
            return;
        }
        try {
            await api.delete(`/fees/payments/${paymentId}`, {
                data: { remarks: deleteRemark }
            });
            toast.success('Payment receipt reverted successfully. Dues restored.');
            setDeletingPaymentId(null);
            setDeleteRemark('');
            fetchLedgerDetails();
        } catch (err) {
            console.error(err);
            toast.error('Failed to reverse payment');
        }
    };

    // Quick trigger to print ledger
    const handlePrintLedger = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F1F5F9' }} />
                    <div className="skeleton" style={{ width: '250px', height: '24px', borderRadius: '8px', background: '#F1F5F9' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px', background: '#F8F9FD' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '350px', borderRadius: '24px', background: '#F8F9FD' }} />
            </div>
        );
    }

    if (!ledgerData?.assignment) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', margin: '20px' }}>
                <AlertCircle size={48} style={{ color: '#EF4444', display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', marginBottom: '8px' }}>Ledger Account Not Found</h3>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>The student fee structure assignment you requested does not exist or has been deleted.</p>
                <button onClick={() => router.push(`/${role}/fees`)} style={{ background: '#3B82F6', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={16} /> Return to Fee Directory
                </button>
            </div>
        );
    }

    const { assignment, payments } = ledgerData;
    const isOverdue = assignment.payment_status?.toLowerCase() === 'overdue';
    
    // Risk badges styling
    const riskLabel = assignment.risk_level === 'high_risk_defaulter' ? 'High Risk Defaulter' : assignment.risk_level === 'watchlist' ? 'Watchlist' : 'Normal';
    const riskBg = assignment.risk_level === 'high_risk_defaulter' ? '#FEF2F2' : assignment.risk_level === 'watchlist' ? '#FFF7ED' : '#ECFDF5';
    const riskColor = assignment.risk_level === 'high_risk_defaulter' ? '#EF4444' : assignment.risk_level === 'watchlist' ? '#F97316' : '#10B981';
    const riskBorder = assignment.risk_level === 'high_risk_defaulter' ? 'rgba(239, 68, 68, 0.2)' : assignment.risk_level === 'watchlist' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)';

    const customStyles = `
        .ledger-wrapper {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .info-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
        }
        .info-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(13, 15, 33, 0.05);
        }
        .tab-btn {
            position: relative;
            transition: all 0.2s;
        }
        .tab-btn::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 3px;
            background: #3B82F6;
            border-radius: 3px;
            transition: width 0.2s;
        }
        .tab-btn.active::after {
            width: 80%;
        }
        .ledger-table tr {
            transition: background 0.15s;
        }
        .ledger-table tr:hover {
            background: #FAFBFC;
        }
        @media print {
            .no-print, header, nav, button, aside, footer, .tabs-container, .action-buttons, .back-btn {
                display: none !important;
            }
            body, .bg-mesh, .ledger-wrapper {
                background: #FFFFFF !important;
                color: #000000 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .ledger-container {
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
            }
            .print-header {
                display: flex !important;
                flex-direction: column !important;
                margin-bottom: 30px !important;
                border-bottom: 2px solid #E2E8F0 !important;
                padding-bottom: 15px !important;
            }
            .info-cards-grid {
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 15px !important;
                margin-bottom: 30px !important;
            }
            .info-card {
                border: 1px solid #CBD5E1 !important;
                box-shadow: none !important;
                transform: none !important;
            }
            .print-table {
                width: 100% !important;
                border-collapse: collapse !important;
            }
            .print-table th, .print-table td {
                border: 1px solid #CBD5E1 !important;
                padding: 10px !important;
            }
            .print-section-title {
                display: block !important;
                font-size: 16px !important;
                font-weight: 800 !important;
                margin: 25px 0 10px 0 !important;
                border-bottom: 1px solid #E2E8F0 !important;
                padding-bottom: 5px !important;
            }
        }
    `;

    return (
        <div className="ledger-wrapper" style={{ padding: '32px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            {/* Print Only Header */}
            <div className="print-header" style={{ display: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: 0 }}>PROTON SCHOOL SYSTEM</h1>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>Official Financial Ledger Account Report</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Report Generated: {new Date().toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '40px', marginTop: '20px', background: '#F8F9FA', padding: '12px 18px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Student Name</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0', color: '#1E293B' }}>{assignment.student_name}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>PRO Account ID</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0', color: '#1E293B' }}>{assignment.pro_id?.toUpperCase()}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Enrollment Class</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0', color: '#1E293B' }}>{assignment.class_name}</p>
                    </div>
                    <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Account Status</span>
                        <p style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0', color: riskColor }}>{riskLabel}</p>
                    </div>
                </div>
            </div>

            {/* Premium Navigation Header - Compact */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={() => router.push(`/${role}/fees`)}
                        style={{ 
                            background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px', 
                            borderRadius: '12px', color: '#475569', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#F8F9FA';
                            e.currentTarget.style.transform = 'translateX(-3px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.transform = 'none';
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', letterSpacing: '0.04em' }}>FINANCIAL CRM</span>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94A3B8' }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{assignment.pro_id?.toUpperCase()}</span>
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 850, color: '#1A1D3B', margin: '4px 0 0 0', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
                            {assignment.student_name}
                        </h1>
                    </div>
                </div>

                <div className="action-buttons" style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handlePrintLedger}
                        style={{ 
                            background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '10px 18px', fontSize: '13px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8F9FA'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                        <Printer size={15} /> Print Ledger
                    </button>

                    <button 
                        onClick={() => router.push(`/${role}/fees/pay?student_id=${assignment.student_id}`)}
                        style={{ 
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none',
                            borderRadius: '14px', padding: '10px 20px', fontSize: '13px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                        <CreditCard size={15} /> Collect Dues
                    </button>

                    <button 
                        onClick={() => setIsDeleteDialogOpen(true)}
                        style={{ 
                            background: '#FEF2F2', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.1)',
                            borderRadius: '14px', padding: '10px 18px', fontSize: '13px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                    >
                        <Trash2 size={15} /> Delete Account
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards Grid */}
            <div className="info-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                
                {/* Gross Allocated Card */}
                <div className="info-card" style={{ padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8F92A1', fontWeight: 800, letterSpacing: '0.04em' }}>
                            Gross Allocated Fee
                        </span>
                        <div style={{ background: '#EFF6FF', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                            <User size={16} />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        {formatCurrency(assignment.final_fee)}
                        {assignment.discount_percentage > 0 && (
                            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                                ({assignment.discount_percentage}% Off)
                            </span>
                        )}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 600 }}>
                        Structure: {assignment.fee_structure?.name || 'Custom'}
                    </p>
                </div>

                {/* Collected Card */}
                <div className="info-card" style={{ padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8F92A1', fontWeight: 800, letterSpacing: '0.04em' }}>
                            Settled Revenue
                        </span>
                        <div style={{ background: '#ECFDF5', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <Check size={16} />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', margin: 0 }}>
                        {formatCurrency(assignment.total_paid)}
                    </h3>
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${assignment.final_fee > 0 ? (assignment.total_paid / assignment.final_fee) * 100 : 0}%`, height: '100%', background: '#10B981' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B' }}>
                            {assignment.final_fee > 0 ? Math.round((assignment.total_paid / assignment.final_fee) * 100) : 0}%
                        </span>
                    </div>
                </div>

                {/* Balance Dues Card */}
                <div className="info-card" style={{ padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8F92A1', fontWeight: 800, letterSpacing: '0.04em' }}>
                            Net Outstanding Dues
                        </span>
                        <div style={{ background: assignment.total_pending > 0 ? '#FEF2F2' : '#ECFDF5', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: assignment.total_pending > 0 ? '#EF4444' : '#10B981' }}>
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 900, color: assignment.total_pending > 0 ? '#EF4444' : '#10B981', margin: 0 }}>
                        {formatCurrency(assignment.total_pending)}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 600 }}>
                        Class Level: <span style={{ color: '#1E293B', fontWeight: 700 }}>{assignment.class_name}</span>
                    </p>
                </div>

                {/* Risk and Status Card */}
                <div className="info-card" style={{ padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8F92A1', fontWeight: 800, letterSpacing: '0.04em' }}>
                            Audit Risk Standing
                        </span>
                        <div style={{ background: riskBg, width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: riskColor }}>
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontSize: '11px', fontWeight: 850, padding: '4px 10px', borderRadius: '8px',
                            background: riskBg, color: riskColor, border: `1.5px solid ${riskBorder}`, textTransform: 'uppercase'
                        }}>
                            {riskLabel}
                        </span>
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '6px 0 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} /> Status: <strong style={{ color: isOverdue ? '#EF4444' : '#1E293B' }}>{assignment.payment_status?.toUpperCase() || 'NORMAL'}</strong>
                    </p>
                </div>

            </div>

            {/* Spaced Elegant Tab Panel Section */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                
                {/* Tabs Picker - Spacious */}
                <div className="tabs-container no-print" style={{ display: 'flex', borderBottom: '2px solid #F1F5F9', background: '#FAFBFC' }}>
                    {[
                        { id: 'timeline', label: 'Installment Allocation Matrix', icon: Calendar },
                        { id: 'payments', label: 'Receipts Ledger log', icon: CreditCard },
                        { id: 'audit', label: 'System Action Audit Trail', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                setIsEditingTimeline(false);
                            }}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            style={{
                                flex: 1, padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                color: activeTab === tab.id ? '#3B82F6' : '#64748B',
                                borderBottom: '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Contents */}
                <div>
                    
                    {/* Tab 1: Timeline (Allocation matrix) */}
                    {activeTab === 'timeline' && (
                        <div style={{ padding: '24px 30px' }}>
                            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Installment Structure Plan</h3>
                                    <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Create, revise, and audit individual due-dates and splits.</p>
                                </div>

                                {!isEditingTimeline ? (
                                    <button 
                                        onClick={() => setIsEditingTimeline(true)}
                                        style={{ 
                                            background: '#FFFFFF', color: '#3B82F6', border: '1px solid #DBEAFE', 
                                            padding: '8px 16px', borderRadius: '10px', fontSize: '12px', 
                                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                                    >
                                        <Edit3 size={14} /> Adjust Schedule
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => {
                                                setIsEditingTimeline(false);
                                                setEditableInstallments(JSON.parse(JSON.stringify(assignment.installments || [])));
                                            }}
                                            style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={saveInstallmentAdjustments}
                                            disabled={isSavingTimeline || !isTimelineSumValid}
                                            style={{ 
                                                background: '#10B981', color: 'white', border: 'none', 
                                                padding: '8px 16px', borderRadius: '10px', fontSize: '12px', 
                                                fontWeight: 700, cursor: 'pointer', opacity: (isSavingTimeline || !isTimelineSumValid) ? 0.5 : 1, 
                                                display: 'flex', alignItems: 'center', gap: '6px' 
                                            }}
                                        >
                                            <Check size={14} /> {isSavingTimeline ? 'Saving...' : 'Save Revisions'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Printable Schedule Title */}
                            <h3 className="print-only" style={{ display: 'none', fontSize: '15px', fontWeight: 800, marginBottom: '15px' }}>Allocated Installment Matrix</h3>

                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
                                <table className="ledger-table print-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', width: '60px' }}>Inst.</th>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase' }}>Due Date Schedule</th>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase' }}>Installment Amount</th>
                                            <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 800, color: '#8F92A1', textTransform: 'uppercase', width: '120px' }}>Audit Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editableInstallments.map((inst: any, idx: number) => (
                                            <React.Fragment key={inst.id}>
                                                <tr style={{ borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none' }}>
                                                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#475569', fontSize: '13px' }}>
                                                        #{inst.installment_number}
                                                    </td>
                                                    <td style={{ padding: '10px 18px' }}>
                                                        <input 
                                                            type="date" 
                                                            className="no-print"
                                                            style={{ 
                                                                padding: '6px 10px', borderRadius: '8px', 
                                                                border: isEditingTimeline ? '1px solid #CBD5E1' : '1px solid transparent', 
                                                                fontSize: '13px', background: isEditingTimeline ? '#FFF' : 'transparent',
                                                                color: '#1E293B', outline: 'none', width: '160px',
                                                                cursor: isEditingTimeline ? 'text' : 'default',
                                                                fontWeight: 600
                                                            }}
                                                            value={inst.due_date}
                                                            disabled={!isEditingTimeline}
                                                            onChange={e => handleInstallmentEdit(idx, 'due_date', e.target.value)}
                                                        />
                                                        <span className="print-only" style={{ display: 'none', fontSize: '13px', fontWeight: 600 }}>
                                                            {formatDate(inst.due_date)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 18px' }}>
                                                        <div className="no-print" style={{ display: 'flex', alignItems: 'center' }}>
                                                            {isEditingTimeline && <span style={{ marginRight: '4px', fontSize: '13px', fontWeight: 700, color: '#64748B' }}>₹</span>}
                                                            <input 
                                                                type="number" 
                                                                style={{ 
                                                                    padding: '6px 10px', borderRadius: '8px',
                                                                    border: isEditingTimeline ? '1px solid #CBD5E1' : '1px solid transparent', 
                                                                    fontSize: '13px', fontWeight: 800,
                                                                    background: isEditingTimeline ? '#FFF' : 'transparent',
                                                                    color: '#1E293B', outline: 'none', width: '130px',
                                                                    cursor: isEditingTimeline ? 'text' : 'default'
                                                                }}
                                                                value={inst.amount}
                                                                disabled={!isEditingTimeline}
                                                                onChange={e => handleInstallmentEdit(idx, 'amount', e.target.value)}
                                                            />
                                                        </div>
                                                        <span className="print-only" style={{ display: 'none', fontSize: '13px', fontWeight: 800 }}>
                                                            {formatCurrency(inst.amount)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 18px' }}>
                                                        <span style={{
                                                            fontSize: '10px', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                            background: inst.status === 'paid' ? '#D1FAE5' : inst.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                                                            color: inst.status === 'paid' ? '#059669' : inst.status === 'overdue' ? '#DC2626' : '#D97706',
                                                            border: `1px solid ${inst.status === 'paid' ? 'rgba(5, 150, 105, 0.15)' : inst.status === 'overdue' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)'}`
                                                        }}>
                                                            {inst.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                                
                                                {/* Chronological Date Change Audit Trail Nested Row */}
                                                {inst.date_histories && inst.date_histories.length > 0 && (
                                                    <tr>
                                                        <td colSpan={4} style={{ padding: '6px 18px 12px 60px', background: '#FAFBFC', borderTop: 'none' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid #93C5FD', paddingLeft: '12px' }}>
                                                                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Due Date Revision Audit Trail:</span>
                                                                {inst.date_histories.map((hist: any) => (
                                                                    <div key={hist.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '11px', color: '#475569', lineHeight: '18px' }}>
                                                                        <span style={{ textDecoration: 'line-through', color: '#EF4444' }}>{formatDate(hist.previous_due_date)}</span>
                                                                        <span style={{ color: '#CBD5E1' }}>→</span>
                                                                        <span style={{ color: '#10B981', fontWeight: 700 }}>{formatDate(hist.new_due_date)}</span>
                                                                        <span style={{ color: '#94A3B8', fontWeight: 500 }}>•</span>
                                                                        <span style={{ color: '#64748B', fontWeight: 600 }}>by {hist.user?.email || 'System'}</span>
                                                                        {hist.change_reason && (
                                                                            <>
                                                                                <span style={{ color: '#94A3B8', fontWeight: 500 }}>•</span>
                                                                                <span style={{ color: '#475569', fontStyle: 'italic', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>"{hist.change_reason}"</span>
                                                                            </>
                                                                        )}
                                                                        <span style={{ color: '#94A3B8', fontSize: '9.5px' }}>({new Date(hist.created_at).toLocaleString('en-IN')})</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isEditingTimeline && (
                                <button 
                                    onClick={handleAddInstallment}
                                    style={{
                                        marginTop: '12px', background: '#FFFFFF', color: '#3B82F6', 
                                        border: '1px dashed #3B82F6', padding: '12px 20px', borderRadius: '12px', 
                                        fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', 
                                        alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center',
                                        transition: 'all 0.15s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.05)'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                                >
                                    + Add New Installment Split Row
                                </button>
                            )}

                            {/* Revision Explanatory Fields - only visible when editing */}
                            {isEditingTimeline && (
                                <div className="no-print" style={{ marginTop: '20px', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '16px', background: '#FAFBFC', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '12px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>
                                            Revised Allocation Total: <strong style={{ color: '#1E293B' }}>{formatCurrency(installmentsSum)}</strong>
                                        </span>
                                        <span style={{ 
                                            fontSize: '13px', fontWeight: 700, 
                                            color: isTimelineSumValid ? '#10B981' : '#EF4444',
                                            display: 'flex', alignItems: 'center', gap: '4px' 
                                        }}>
                                            Target Allocation: {formatCurrency(targetSum)} 
                                            {isTimelineSumValid ? ' (Matches Exactly ✓)' : ' (Sum Discrepancy ✗)'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Internal Allocation Notes</label>
                                            <textarea 
                                                style={{ width: '100%', minHeight: '80px', resize: 'vertical', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} 
                                                value={drawerNotes} 
                                                onChange={e => setDrawerNotes(e.target.value)} 
                                                placeholder="Add audit ledger details regarding this fee schedule modification..." 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Change Reason (Required for Audit Trail)</label>
                                            <textarea 
                                                style={{ width: '100%', minHeight: '80px', resize: 'vertical', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} 
                                                value={changeReason} 
                                                onChange={e => setChangeReason(e.target.value)} 
                                                placeholder="State the official justification (e.g. Parental Request, Scholarship adjustment, Coordinator override)..." 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Receipts Log */}
                    {activeTab === 'payments' && (
                        <div style={{ padding: '24px 30px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Receipt Ledger Log</h3>
                                <p className="no-print" style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>History of processed collections, transactions, and reversals.</p>
                            </div>

                            {payments?.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', background: '#FAFBFC', borderRadius: '14px', border: '1px dashed #E2E8F0' }}>
                                    <CreditCard size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#94A3B8' }} />
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', margin: '0 0 4px 0' }}>No Financial Payments Recorded</h4>
                                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>This account does not have any active transaction receipts.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {payments.map((payment: any) => (
                                        <div key={payment.id} style={{
                                            padding: '16px 20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#1E293B' }}>{payment.receipt_number}</span>
                                                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#FAFBFC', border: '1px solid #E2E8F0', color: '#64748B' }}>
                                                            {payment.payment_method?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                                                        Cleared Date: {formatDate(payment.payment_date)} • Author ID: {payment.collected_by || 'Cashier'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{ fontWeight: 900, color: '#10B981', fontSize: '16px' }}>{formatCurrency(payment.amount_paid)}</span>
                                                    
                                                    {deletingPaymentId !== payment.id ? (
                                                        <button 
                                                            className="no-print"
                                                            onClick={() => setDeletingPaymentId(payment.id)}
                                                            style={{ 
                                                                background: '#FEF2F2', border: 'none', color: '#EF4444', 
                                                                cursor: 'pointer', padding: '8px', borderRadius: '8px',
                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                fontSize: '11px', fontWeight: 700, transition: 'all 0.15s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                                                        >
                                                            <Trash2 size={12} /> Reverse
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="no-print"
                                                            onClick={() => setDeletingPaymentId(null)}
                                                            style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Reversal Confirmation Box nested inside receipt item */}
                                            {deletingPaymentId === payment.id && (
                                                <div className="no-print" style={{ marginTop: '12px', background: '#FEF2F2', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <p style={{ fontSize: '12px', color: '#991B1B', fontWeight: 700, margin: 0 }}>⚠️ Confirm Receipt Reversal</p>
                                                    <p style={{ fontSize: '11.5px', color: '#B91C1C', margin: 0, fontWeight: 500 }}>Reversing this payment will subtract the amount from the student's settled balance and restore their outstanding dues. An audit log will be permanently recorded.</p>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input 
                                                            type="text" 
                                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', fontSize: '12px', outline: 'none' }}
                                                            placeholder="State official reversal justification remarks (Required)..."
                                                            value={deleteRemark}
                                                            onChange={e => setDeleteRemark(e.target.value)}
                                                        />
                                                        <button 
                                                            onClick={() => handleRevertPayment(payment.id)}
                                                            style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                        >
                                                            Confirm Revert
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {payment.remarks && (
                                                <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', background: '#F8F9FB', padding: '8px 12px', borderRadius: '8px', fontStyle: 'italic', borderLeft: '3px solid #CBD5E1' }}>
                                                    Remarks: "{payment.remarks}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Action Audit logs */}
                    {activeTab === 'audit' && (
                        <div style={{ padding: '24px 30px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>System Action Audit Trail</h3>
                                <p className="no-print" style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0', fontWeight: 500 }}>Immutable ledger records of every financial operation on this student account.</p>
                            </div>

                            {assignment.audit_logs?.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', background: '#FAFBFC', borderRadius: '14px', border: '1px dashed #E2E8F0' }}>
                                    <History size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#94A3B8' }} />
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', margin: '0 0 4px 0' }}>No Actions Recorded</h4>
                                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>There are no financial logs on this ledger account.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {assignment.audit_logs?.map((log: any) => (
                                        <div key={log.id} style={{
                                            padding: '14px 18px', background: '#FAFBFC', borderRadius: '12px', border: '1px solid #E2E8F0',
                                            fontSize: '12.5px', color: '#334155'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 850, color: '#1E293B', fontSize: '13px', letterSpacing: '0.02em' }}>{log.action?.toUpperCase().replace(/_/g, ' ')}</span>
                                                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>{formatDate(log.created_at)} ({new Date(log.created_at).toLocaleTimeString('en-IN')})</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', lineHeight: 1.4 }}>{log.details}</div>
                                            
                                            {log.field_changed && (
                                                <div style={{ display: 'inline-flex', gap: '6px', fontSize: '10.5px', background: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', fontWeight: 700, marginBottom: '6px' }}>
                                                    <span style={{ color: '#94A3B8' }}>{log.field_changed?.toUpperCase()}:</span>
                                                    <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{log.old_value || 'N/A'}</span>
                                                    <span>→</span>
                                                    <span style={{ color: '#10B981' }}>{log.new_value || 'N/A'}</span>
                                                </div>
                                            )}
                                            
                                            <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                                <User size={12} /> Registered Author: <span style={{ color: '#1E293B', fontWeight: 700 }}>{log.user?.email || 'System'}</span> (Role: {log.user?.role?.toUpperCase() || 'SYSTEM'})
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </div>

            {/* Print Signature Footer Block */}
            <div className="print-only" style={{ display: 'none', marginTop: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                        <div style={{ borderBottom: '1.5px solid #CBD5E1', height: '40px', marginBottom: '6px' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ledger Cashier</span>
                    </div>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                        <div style={{ borderBottom: '1.5px solid #CBD5E1', height: '40px', marginBottom: '6px' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Authorized Signatory</span>
                    </div>
                </div>
            </div>

            {/* Permanent Delete Confirmation Modal */}
            {isDeleteDialogOpen && (
                <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,15,33,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFFFFF', width: '480px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(13,15,33,0.15)', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FEF2F2', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                <AlertCircle size={22} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Confirm Permanent Deletion</h3>
                        </div>

                        {assignment.total_paid > 0 || (payments && payments.length > 0) ? (
                            <div style={{ background: '#FEF2F2', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '16px' }}>
                                <p style={{ fontSize: '14px', color: '#991B1B', fontWeight: 700, margin: '0 0 8px' }}>⚠️ Warning: Payment History Exists</p>
                                <p style={{ fontSize: '13px', color: '#B91C1C', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                                    This student already has payment history. Deleting this fee assignment will permanently remove:
                                    <br />• installments
                                    <br />• payment mappings
                                    <br />• financial history
                                </p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '14px', color: '#475569', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                                Are you sure you want to permanently delete the fee assignment for <strong>{assignment.student_name}</strong>? This will remove all generated installments. This action is irreversible.
                            </p>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Type <span style={{ color: '#EF4444', fontFamily: 'monospace' }}>DELETE</span> to confirm</label>
                            <input 
                                type="text" 
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', fontWeight: 600 }}
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button 
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setDeleteConfirmText('');
                                }}
                                style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleHardDeleteAssignment}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleteSubmitting}
                                style={{ 
                                    background: deleteConfirmText === 'DELETE' ? '#EF4444' : '#FCA5A5', 
                                    color: 'white', border: 'none', borderRadius: '12px', 
                                    padding: '12px 24px', fontSize: '14px', fontWeight: 700, 
                                    cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Trash2 size={14} /> {isDeleteSubmitting ? 'Deleting...' : 'Delete Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
    CreditCard, Search, Plus, DollarSign, Download, Clock, 
    CheckCircle, Wallet, AlertCircle, TrendingUp, Filter, 
    IndianRupee, User, Calendar, ReceiptText, X, Edit3, Trash2, 
    History, Landmark, ClipboardList, Info, Undo2, Check 
} from 'lucide-react';
import type { FeesPageData } from '@/services/dataAccess';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function AdminFeesClient({ initialData }: { initialData: FeesPageData }) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [assignments, setAssignments] = useState<any[]>(initialData.assignments || []);
    const [stats, setStats] = useState<any>(initialData.stats || null);
    
    // Side drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerData, setDrawerData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'payments' | 'audit'>('timeline');
    
    // Editing state in drawer
    const [editableInstallments, setEditableInstallments] = useState<any[]>([]);
    const [drawerNotes, setDrawerNotes] = useState('');
    const [isEditingTimeline, setIsEditingTimeline] = useState(false);
    const [isSavingTimeline, setIsSavingTimeline] = useState(false);
    
    // Deleting state
    const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
    const [deleteRemark, setDeleteRemark] = useState('');

    const formatCurrency = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Filter main table
    const filteredAssignments = assignments.filter(a => 
        (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.pro_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Refresh main view state
    const refreshData = async () => {
        try {
            const [assignmentsRes, statsRes] = await Promise.all([
                api.get('/fees/assignments'),
                api.get('/fees/stats')
            ]);
            setAssignments(assignmentsRes.data.data || []);
            setStats(statsRes.data.data || null);
        } catch (err) {
            console.error('Error refreshing fees:', err);
        }
    };

    // Load drawer details
    const openDrawer = async (id: string) => {
        setSelectedId(id);
        setIsDrawerOpen(true);
        setDrawerLoading(true);
        setActiveTab('timeline');
        setIsEditingTimeline(false);
        setDeletingPaymentId(null);
        setDeleteRemark('');
        try {
            const [detailsRes, paymentsRes] = await Promise.all([
                api.get(`/fees/assignments/${id}`),
                api.get('/fees/payments')
            ]);
            
            const assignment = detailsRes.data.data;
            const studentPayments = paymentsRes.data.data.filter((p: any) => p.student_id === assignment.student_id);
            
            setDrawerData({ assignment, payments: studentPayments });
            setEditableInstallments(JSON.parse(JSON.stringify(assignment.installments || [])));
            setDrawerNotes(assignment.notes || '');
        } catch (err) {
            console.error('Error loading details:', err);
            toast.error('Failed to load ledger details');
            setIsDrawerOpen(false);
        } finally {
            setDrawerLoading(false);
        }
    };

    // Update individual installment inside editable list
    const handleInstallmentEdit = (index: number, field: string, value: any) => {
        const copy = [...editableInstallments];
        if (field === 'amount') {
            copy[index].amount = Number(value);
        } else if (field === 'due_date') {
            copy[index].due_date = value;
        }
        setEditableInstallments(copy);
    };

    const targetSum = drawerData?.assignment?.final_fee || 0;
    const installmentsSum = editableInstallments.reduce((acc, curr) => acc + curr.amount, 0);
    const isTimelineSumValid = Math.abs(installmentsSum - targetSum) <= 0.02;

    // Save edited installments
    const saveInstallmentAdjustments = async () => {
        if (!isTimelineSumValid) {
            toast.error(`The sum of edited installments (₹${installmentsSum.toLocaleString()}) must match the Net Payable fee (₹${targetSum.toLocaleString()}) exactly.`);
            return;
        }
        setIsSavingTimeline(true);
        try {
            await api.put(`/fees/assignments/${selectedId}`, {
                installments: editableInstallments,
                notes: drawerNotes
            });
            toast.success('Ledger and installments updated successfully!');
            setIsEditingTimeline(false);
            // Refresh drawer
            if (selectedId) openDrawer(selectedId);
            // Refresh dashboard
            refreshData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save timeline changes');
        } finally {
            setIsSavingTimeline(false);
        }
    };

    // Trigger soft delete of payment
    const handleRevertPayment = async (paymentId: string) => {
        if (!deleteRemark.trim()) {
            toast.error('Please enter a deletion remark to reverse this payment receipt.');
            return;
        }
        try {
            await api.delete(`/fees/payments/${paymentId}`, {
                data: { remarks: deleteRemark }
            });
            toast.success('Payment reverted successfully. Balances restored.');
            setDeletingPaymentId(null);
            setDeleteRemark('');
            // Refresh drawer and dashboard
            if (selectedId) openDrawer(selectedId);
            refreshData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to reverse payment');
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
        .glass-panel {
            background: rgba(255, 255, 255, 0.82);
            backdrop-filter: blur(20px);
        }
        .stat-card {
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .table-row-hover {
            transition: all 0.2s ease;
        }
        .table-row-hover:hover {
            background: #F8F9FD;
            transform: translateX(4px);
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.08) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.08) 0px, transparent 50%);
        }
        .drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(13, 15, 33, 0.4);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            justify-content: flex-end;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-sheet {
            width: 700px;
            max-width: 90vw;
            height: 100%;
            background: #FFFFFF;
            box-shadow: -10px 0 40px rgba(13, 15, 33, 0.15);
            display: flex;
            flex-direction: column;
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;

    return (
        <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>
            <style dangerouslySetInnerHTML={{__html: customStyles}} />

            {/* Header Section */}
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                            <IndianRupee size={20} strokeWidth={2.5} />
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                            Fee Management
                        </h1>
                    </div>
                    <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Collect, manage, and track <span style={{ color: '#10B981', fontWeight: 700 }}>Institutional revenue</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => router.push(`/${user?.role || 'admin'}/fees/assign`)} style={{
                         background: '#FFFFFF', color: '#3B82F6', border: '1px solid #DBEAFE',
                         borderRadius: '14px', padding: '12px 20px', fontSize: '14px',
                         fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                         cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59,130,246,0.05)',
                    }}
                        onMouseEnter={e => { (e.currentTarget.style.background = '#EFF6FF'); (e.currentTarget.style.borderColor = '#3B82F6'); }}
                        onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#DBEAFE'); }}
                    >
                        <Plus size={18} strokeWidth={2.5} /> Assign Fee
                    </button>
                    <button
                        onClick={() => router.push(`/${user?.role || 'admin'}/fees/pay`)}
                        style={{
                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                            color: 'white', border: 'none',
                            borderRadius: '14px', padding: '12px 24px', fontSize: '15px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(26,29,59,0.4)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget.style.transform = 'translateY(-2px)');
                            (e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(26,29,59,0.5)');
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget.style.transform = 'translateY(0)');
                            (e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(26,29,59,0.4)');
                        }}
                    >
                        <CreditCard size={18} strokeWidth={2.5} /> Record Payment
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            {stats && (
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px', animationDelay: '100ms' }}>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <Wallet style={{ position: 'absolute', top: '10%', right: '-5%', width: '100px', height: '100px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: '14px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Collected</p>
                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.02em' }}>{formatCurrency(stats.total_collected)}</h2>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '50px', width: 'fit-content' }}>
                                <TrendingUp size={12} /> Live Tracking
                            </div>
                        </div>
                    </div>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', color: 'white', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <AlertCircle style={{ position: 'absolute', top: '10%', right: '-5%', width: '100px', height: '100px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: '14px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Pending</p>
                            <h2 style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.02em' }}>{formatCurrency(stats.total_pending)}</h2>
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '50px', width: 'fit-content' }}>
                                Requires Attention
                            </div>
                        </div>
                    </div>

                    <div className="stat-card glass-panel" style={{ borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Fully Paid Students</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em', margin: 0 }}>{stats.paid_students}</h2>
                                <span style={{ fontSize: '15px', color: '#A1A5B7', fontWeight: 600 }}>Accounts</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', color: '#10B981', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', padding: '6px 12px', borderRadius: '50px', width: 'fit-content' }}>
                            <CheckCircle size={14} /> Clear Records
                        </div>
                    </div>

                    <div className="stat-card glass-panel" style={{ borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Defaulters / Due</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', letterSpacing: '-0.02em', margin: 0 }}>{stats.overdue_students + stats.partial_students}</h2>
                                <span style={{ fontSize: '15px', color: '#A1A5B7', fontWeight: 600 }}>Pending</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', color: '#F59E0B', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', padding: '6px 12px', borderRadius: '50px', width: 'fit-content' }}>
                            <Clock size={14} /> Dues Outstanding
                        </div>
                    </div>
                </div>
            )}

            {/* Table Section */}
            <div className="animate-fade-in glass-panel" style={{ borderRadius: '28px', padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)', animationDelay: '200ms' }}>
                
                <div style={{ padding: '8px 12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(226,232,240,0.6)', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Outstanding Fees & Dues</h3>
                        <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500, margin: '4px 0 0' }}>Detailed overview of all registered student accounts</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '280px' }}>
                            <Search size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or PRO_ID..." 
                                style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: '14px', outline: 'none', transition: 'all 0.2s', fontWeight: 500 }} 
                                onFocus={(e) => e.target.style.borderColor = '#1A1D3B'}
                                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>
                    </div>
                </div>

                {filteredAssignments.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '20px' }}>
                        <CreditCard size={64} style={{ marginBottom: '20px', color: '#A1A5B7', opacity: 0.4 }} />
                        <h3 style={{ fontSize: '20px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Accounts Found</h3>
                        <p style={{ fontSize: '15px', color: '#8F92A1', fontWeight: 500 }}>No fee records match your current view or filter.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '850px' }}>
                            <thead>
                                <tr>
                                    {['Student Account', 'Total Assignment', 'Paid to Date', 'Outstanding Due', 'Payment Status', 'Actions'].map((h, i) => (
                                        <th key={h} style={{
                                            padding: '16px 20px', textAlign: i === 5 ? 'right' : 'left',
                                            color: '#A1A5B7', fontWeight: 700, fontSize: '11px',
                                            textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map((a, idx) => (
                                    <tr key={a.id} className="table-row-hover" style={{ cursor: 'pointer' }} onClick={() => openDrawer(a.id)}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={18} color="#1A1D3B" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B' }}>{a.student_name}</div>
                                                    <div style={{ fontSize: '12px', color: '#A1A5B7', fontFamily: 'monospace', fontWeight: 600 }}>{a.pro_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '15px', color: '#1A1D3B' }}>{formatCurrency(a.final_fee || 0)}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 800, fontSize: '15px' }}>
                                                {formatCurrency(a.total_paid)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 900, fontSize: '15px' }}>
                                                {formatCurrency(a.total_pending || 0)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{
                                                display: 'inline-flex', padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                background: a.payment_status === 'paid' ? '#ECFDF5' : a.payment_status === 'overdue' ? '#FEF2F2' : '#FFFBEB',
                                                color: a.payment_status === 'paid' ? '#059669' : a.payment_status === 'overdue' ? '#DC2626' : '#D97706',
                                                boxShadow: a.payment_status === 'paid' ? '0 2px 8px rgba(16,185,129,0.1)' : 'none'
                                            }}>
                                                {a.payment_status}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                            <button 
                                                onClick={() => openDrawer(a.id)}
                                                style={{ 
                                                    background: 'rgba(26,29,59,0.05)', 
                                                    color: '#1A1D3B', border: 'none', borderRadius: '10px', 
                                                    padding: '10px 18px', fontSize: '13px', fontWeight: 700, 
                                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,29,59,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,29,59,0.05)'}
                                            >
                                                Manage Ledger <Info size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slide-out Horizontal Ledger Drawer */}
            {isDrawerOpen && (
                <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
                    <div className="drawer-sheet" onClick={e => e.stopPropagation()}>
                        
                        {/* Drawer Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FD' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#E2E8F0', color: '#475569' }}>LEDGER</span>
                                    <h2 style={{ fontSize: '20px', fontWeight: 850, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                                        {drawerData?.assignment?.student_name}
                                    </h2>
                                </div>
                                <p style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, margin: 0, display: 'flex', gap: '8px' }}>
                                    <span>ID: {drawerData?.assignment?.pro_id}</span>
                                    <span>•</span>
                                    <span>Batch: {drawerData?.assignment?.class_name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {drawerLoading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 600 }}>Loading detailed financial ledger...</div>
                            </div>
                        ) : (
                            <>
                                {/* Ledger Overview Cards */}
                                <div style={{ padding: '20px 24px', background: '#F8F9FD', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700 }}>NET PAYABLE FEE</span>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#1A1D3B', marginTop: '4px' }}>
                                            {formatCurrency(drawerData?.assignment?.final_fee)}
                                        </div>
                                    </div>
                                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700 }}>TOTAL COLLECTED</span>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
                                            {formatCurrency(drawerData?.assignment?.total_paid)}
                                        </div>
                                    </div>
                                    <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700 }}>OUTSTANDING DUE</span>
                                        <div style={{ fontSize: '18px', fontWeight: 900, color: (drawerData?.assignment?.total_pending || 0) > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>
                                            {formatCurrency(drawerData?.assignment?.total_pending)}
                                        </div>
                                    </div>
                                </div>

                                {/* Drawer Tabs */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                                    {[
                                        { id: 'timeline', label: 'Installments Timeline', icon: Calendar },
                                        { id: 'payments', label: 'Receipt History', icon: CreditCard },
                                        { id: 'audit', label: 'Audit Trail', icon: History }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            style={{
                                                flex: 1, padding: '16px', border: 'none', background: 'none', cursor: 'pointer',
                                                fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                color: activeTab === tab.id ? '#3B82F6' : '#64748B',
                                                borderBottom: activeTab === tab.id ? '3px solid #3B82F6' : '3px solid transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <tab.icon size={16} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Drawer Body Tab Content */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                    
                                    {/* 1. Installments Timeline Tab */}
                                    {activeTab === 'timeline' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                                    Adjustable Installment Dues
                                                </h4>
                                                {!isEditingTimeline ? (
                                                    <button 
                                                        onClick={() => setIsEditingTimeline(true)}
                                                        style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Edit3 size={13} /> Adjust Timeline
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            onClick={() => {
                                                                setIsEditingTimeline(false);
                                                                setEditableInstallments(JSON.parse(JSON.stringify(drawerData?.assignment?.installments || [])));
                                                            }}
                                                            style={{ background: '#E2E8F0', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={saveInstallmentAdjustments}
                                                            disabled={isSavingTimeline || !isTimelineSumValid}
                                                            style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Check size={13} /> {isSavingTimeline ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                                {editableInstallments.map((inst: any, idx: number) => {
                                                    const isFrozen = inst.paid_amount > 0;
                                                    return (
                                                        <div key={inst.id} style={{
                                                            padding: '16px', background: '#F8F9FD', borderRadius: '16px', border: '1px solid #E2E8F0',
                                                            display: 'grid', gridTemplateColumns: '40px 1.5fr 1.5fr 1fr', gap: '16px', alignItems: 'center'
                                                        }}>
                                                            <span style={{ fontWeight: 800, color: '#A1A5B7', fontSize: '14px' }}>#{inst.installment_number}</span>
                                                            
                                                            <div>
                                                                <label style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>DUE DATE</label>
                                                                <input 
                                                                    type="date" 
                                                                    className="form-input" 
                                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '100%', fontSize: '13px' }}
                                                                    value={inst.due_date}
                                                                    disabled={!isEditingTimeline}
                                                                    onChange={e => handleInstallmentEdit(idx, 'due_date', e.target.value)}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>AMOUNT (₹)</label>
                                                                <input 
                                                                    type="number" 
                                                                    className="form-input" 
                                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '100%', fontSize: '13px', fontWeight: 700 }}
                                                                    value={inst.amount}
                                                                    disabled={!isEditingTimeline || isFrozen}
                                                                    onChange={e => handleInstallmentEdit(idx, 'amount', e.target.value)}
                                                                />
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>STATUS</span>
                                                                <span style={{
                                                                    fontSize: '10px', padding: '3px 8px', borderRadius: '50px', fontWeight: 800, textTransform: 'uppercase',
                                                                    background: inst.status === 'paid' ? '#D1FAE5' : inst.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                                                                    color: inst.status === 'paid' ? '#10B981' : inst.status === 'overdue' ? '#EF4444' : '#F59E0B'
                                                                }}>
                                                                    {inst.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {isEditingTimeline && (
                                                <>
                                                    <div style={{ background: '#F8F9FD', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>
                                                        <span style={{ color: '#5E6278' }}>Editable Sum: {formatCurrency(installmentsSum)}</span>
                                                        <span style={{ color: isTimelineSumValid ? '#10B981' : '#EF4444' }}>Target Net Fee: {formatCurrency(targetSum)}</span>
                                                    </div>
                                                    <div style={{ marginBottom: '24px' }}>
                                                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Adjustment Reason (Saved to History)</label>
                                                        <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={drawerNotes} onChange={e => setDrawerNotes(e.target.value)} placeholder="E.g. Adjusted installment amounts based on parent request..." />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. Receipt History Tab */}
                                    {activeTab === 'payments' && (
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>
                                                Recorded Payments History
                                            </h4>

                                            {drawerData?.payments?.length === 0 ? (
                                                <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                                                    <CreditCard size={36} style={{ color: '#A1A5B7', opacity: 0.5, marginBottom: '12px' }} />
                                                    <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 500, margin: 0 }}>No payments recorded for this account.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {drawerData?.payments?.map((payment: any) => (
                                                        <div key={payment.id} style={{
                                                            padding: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px',
                                                            display: 'flex', flexDirection: 'column', gap: '12px'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#1A1D3B' }}>{payment.receipt_number}</div>
                                                                    <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>{formatDate(payment.payment_date)} • {payment.payment_method?.toUpperCase()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontWeight: 900, color: '#10B981', fontSize: '16px' }}>{formatCurrency(payment.amount_paid)}</span>
                                                                    {deletingPaymentId !== payment.id ? (
                                                                        <button 
                                                                            onClick={() => setDeletingPaymentId(payment.id)}
                                                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                                                            title="Reverse Payment Receipt"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => setDeletingPaymentId(null)}
                                                                            style={{ background: '#CBD5E1', color: '#475569', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {deletingPaymentId === payment.id && (
                                                                <div style={{ background: '#FEF2F2', border: '1px dashed #FCA5A5', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700 }}>REVERSE RECEIPT: REASON REQUIRED</span>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <input 
                                                                            type="text" 
                                                                            style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #FCA5A5', fontSize: '12px' }}
                                                                            placeholder="Reason for deletion..."
                                                                            value={deleteRemark}
                                                                            onChange={e => setDeleteRemark(e.target.value)}
                                                                        />
                                                                        <button 
                                                                            onClick={() => handleRevertPayment(payment.id)}
                                                                            style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                        >
                                                                            <Undo2 size={12} /> Confirm Revert
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {payment.remarks && (
                                                                <div style={{ fontSize: '12px', color: '#5E6278', background: '#F8F9FD', padding: '10px', borderRadius: '10px', fontStyle: 'italic' }}>
                                                                    "{payment.remarks}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. Audit History Log Tab */}
                                    {activeTab === 'audit' && (
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', marginBottom: '16px' }}>
                                                Ledger Modification Trail
                                            </h4>

                                            {drawerData?.assignment?.audit_logs?.length === 0 ? (
                                                <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px' }}>
                                                    <History size={36} style={{ color: '#A1A5B7', opacity: 0.5, marginBottom: '12px' }} />
                                                    <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 500, margin: 0 }}>No audit logs recorded for this ledger.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {drawerData?.assignment?.audit_logs?.map((log: any) => (
                                                        <div key={log.id} style={{
                                                            padding: '14px', background: '#F8F9FD', borderRadius: '12px', border: '1px solid #E2E8F0',
                                                            fontSize: '13px', color: '#475569', lineHeight: 1.5
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: 800, color: '#1A1D3B' }}>{log.action?.toUpperCase().replace('_', ' ')}</span>
                                                                <span style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>{formatDate(log.created_at)}</span>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#5E6278', marginBottom: '6px' }}>{log.details}</div>
                                                            
                                                            {log.field_changed && (
                                                                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', background: '#FFFFFF', padding: '6px', borderRadius: '6px', width: 'fit-content', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                                                                    <span style={{ color: '#8F92A1' }}>{log.field_changed?.toUpperCase()}:</span>
                                                                    <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{log.old_value}</span>
                                                                    <span>→</span>
                                                                    <span style={{ color: '#10B981' }}>{log.new_value}</span>
                                                                </div>
                                                            )}
                                                            
                                                            <div style={{ fontSize: '11px', color: '#A1A5B7', marginTop: '6px', fontWeight: 700 }}>
                                                                Authorized by: {log.user?.email} ({log.user?.role?.toUpperCase()})
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}

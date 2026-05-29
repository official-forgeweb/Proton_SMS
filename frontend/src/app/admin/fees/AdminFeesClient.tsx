'use client';
import React, { useState, useEffect } from 'react';
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

    // Segment Filters & Behavioral states
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'overdue' | 'partial' | 'watchlist' | 'high_risk'>('all');
    const [changeReason, setChangeReason] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

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
    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = 
            (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.pro_id || '').toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!matchesSearch) return false;
        
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'upcoming') {
            return a.payment_status === 'pending' || a.payment_status === 'upcoming';
        }
        if (selectedFilter === 'overdue') {
            return a.payment_status === 'overdue';
        }
        if (selectedFilter === 'partial') {
            return a.payment_status === 'partial';
        }
        if (selectedFilter === 'watchlist') {
            return a.risk_level === 'watchlist';
        }
        if (selectedFilter === 'high_risk') {
            return a.risk_level === 'high_risk_defaulter';
        }
        return true;
    });

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
                notes: drawerNotes,
                change_reason: changeReason
            });
            toast.success('Ledger and installments updated successfully!');
            setIsEditingTimeline(false);
            setChangeReason('');
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

    // Hard delete assignment
    const handleHardDeleteAssignment = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm.');
            return;
        }
        setIsDeleteSubmitting(true);
        try {
            await api.delete(`/fees/assignments/${selectedId}`, {
                data: { force: true }
            });
            toast.success('Fee assignment and payment history deleted permanently.');
            setIsDeleteDialogOpen(false);
            setDeleteConfirmText('');
            setIsDrawerOpen(false);
            refreshData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete fee assignment');
        } finally {
            setIsDeleteSubmitting(false);
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
            z-index: 9999;
            display: flex;
            justify-content: flex-end;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-sheet {
            width: 640px;
            max-width: 90vw;
            height: 100vh;
            background: #FFFFFF;
            box-shadow: -10px 0 40px rgba(13, 15, 33, 0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
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

                {/* Premium Segment Filters Row */}
                <div style={{ display: 'flex', gap: '8px', padding: '8px 12px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'all', label: 'All Students', count: assignments.length },
                        { id: 'upcoming', label: 'Upcoming', count: assignments.filter(a => a.payment_status === 'pending' || a.payment_status === 'upcoming').length },
                        { id: 'overdue', label: 'Overdue', count: assignments.filter(a => a.payment_status === 'overdue').length },
                        { id: 'partial', label: 'Partial Payment', count: assignments.filter(a => a.payment_status === 'partial').length },
                        { id: 'watchlist', label: 'Watchlist', count: assignments.filter(a => a.risk_level === 'watchlist').length },
                        { id: 'high_risk', label: 'High Risk Defaulters', count: assignments.filter(a => a.risk_level === 'high_risk_defaulter').length },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedFilter(f.id as any)}
                            style={{
                                background: selectedFilter === f.id ? '#1A1D3B' : '#FFFFFF',
                                color: selectedFilter === f.id ? '#FFFFFF' : '#5E6278',
                                border: selectedFilter === f.id ? '1px solid #1A1D3B' : '1px solid #E2E8F0',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                boxShadow: selectedFilter === f.id ? '0 4px 12px rgba(26,29,59,0.15)' : 'none'
                            }}
                        >
                            <span>{f.label}</span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                background: selectedFilter === f.id ? 'rgba(255,255,255,0.2)' : '#F8F9FD',
                                color: selectedFilter === f.id ? '#FFFFFF' : '#8F92A1',
                                padding: '2px 6px',
                                borderRadius: '6px'
                            }}>{f.count}</span>
                        </button>
                    ))}
                </div>

                {filteredAssignments.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '20px' }}>
                        <CreditCard size={64} style={{ display: 'block', margin: '0 auto 20px', color: '#A1A5B7', opacity: 0.4 }} />
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
                                    <tr 
                                        key={a.id} 
                                        className="table-row-hover" 
                                        style={{ 
                                            cursor: 'pointer',
                                            boxShadow: a.risk_level === 'high_risk_defaulter' ? 'inset 4px 0 0 #EF4444, 0 0 12px rgba(239, 68, 68, 0.03)' : a.risk_level === 'watchlist' ? 'inset 4px 0 0 #F59E0B' : 'none',
                                            background: a.risk_level === 'high_risk_defaulter' ? '#FFF5F5' : a.risk_level === 'watchlist' ? '#FFFDF5' : 'inherit'
                                        }} 
                                        onClick={() => router.push(`/${user?.role || 'admin'}/fees/ledger/${a.id}`)}
                                    >
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={18} color="#1A1D3B" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#1A1D3B' }}>{a.student_name}</div>
                                                        {a.risk_level === 'high_risk_defaulter' && (
                                                            <span style={{ fontSize: '10px', fontWeight: 800, background: '#FEF2F2', color: '#EF4444', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                                                High Risk Defaulter
                                                            </span>
                                                        )}
                                                        {a.risk_level === 'watchlist' && (
                                                            <span style={{ fontSize: '10px', fontWeight: 800, background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(217, 119, 6, 0.1)' }}>
                                                                Watchlist
                                                            </span>
                                                        )}
                                                    </div>
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
                                                onClick={() => router.push(`/${user?.role || 'admin'}/fees/ledger/${a.id}`)}
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
                        
                        {/* Drawer Header - Compact */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#E2E8F0', color: '#475569', flexShrink: 0 }}>LEDGER</span>
                                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1A1D3B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {drawerData?.assignment?.student_name}
                                    </h2>
                                </div>
                                <p style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 600, margin: '2px 0 0', display: 'flex', gap: '6px' }}>
                                    <span>{drawerData?.assignment?.pro_id}</span>
                                    <span>•</span>
                                    <span>{drawerData?.assignment?.class_name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsDrawerOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {drawerLoading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600 }}>Loading ledger...</div>
                            </div>
                        ) : (
                            <>
                                {/* Compact Summary Bar - single row */}
                                <div style={{ padding: '12px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '0', flexShrink: 0, background: '#FAFBFC' }}>
                                    <div style={{ flex: 1, paddingRight: '16px', borderRight: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Net Fee</div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#1A1D3B', marginTop: '1px' }}>
                                            {formatCurrency(drawerData?.assignment?.final_fee)}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Collected</div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981', marginTop: '1px' }}>
                                            {formatCurrency(drawerData?.assignment?.total_paid)}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, paddingLeft: '16px' }}>
                                        <div style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Due</div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: (drawerData?.assignment?.total_pending || 0) > 0 ? '#EF4444' : '#10B981', marginTop: '1px' }}>
                                            {formatCurrency(drawerData?.assignment?.total_pending)}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs - compact */}
                                <div style={{ display: 'flex', borderBottom: '2px solid #F1F5F9', flexShrink: 0 }}>
                                    {[
                                        { id: 'timeline', label: 'Installments', icon: Calendar },
                                        { id: 'payments', label: 'Receipts', icon: CreditCard },
                                        { id: 'audit', label: 'Audit Trail', icon: History }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            style={{
                                                flex: 1, padding: '10px 8px', border: 'none', background: 'none', cursor: 'pointer',
                                                fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                color: activeTab === tab.id ? '#3B82F6' : '#94A3B8',
                                                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                                                marginBottom: '-2px',
                                                transition: 'color 0.15s'
                                            }}
                                        >
                                            <tab.icon size={14} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Scrollable Body */}
                                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                    
                                    {/* 1. Installments Timeline Tab */}
                                    {activeTab === 'timeline' && (
                                        <div style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                                                    Installment Schedule
                                                </span>
                                                {!isEditingTimeline ? (
                                                    <button 
                                                        onClick={() => setIsEditingTimeline(true)}
                                                        style={{ background: 'none', color: '#3B82F6', border: '1px solid #DBEAFE', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Edit3 size={12} /> Edit
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button 
                                                            onClick={() => {
                                                                setIsEditingTimeline(false);
                                                                setEditableInstallments(JSON.parse(JSON.stringify(drawerData?.assignment?.installments || [])));
                                                            }}
                                                            style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={saveInstallmentAdjustments}
                                                            disabled={isSavingTimeline || !isTimelineSumValid}
                                                            style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', opacity: (isSavingTimeline || !isTimelineSumValid) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '3px' }}
                                                        >
                                                            <Check size={12} /> {isSavingTimeline ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Compact table */}
                                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: '#F8F9FB' }}>
                                                            <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'left', width: '36px' }}>#</th>
                                                            <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'left' }}>Due Date</th>
                                                            <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'left' }}>Amount</th>
                                                            <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {editableInstallments.map((inst: any, idx: number) => (
                                                            <React.Fragment key={inst.id}>
                                                                <tr style={{ borderTop: '1px solid #F1F5F9' }}>
                                                                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#64748B', fontSize: '12px' }}>
                                                                        {inst.installment_number}
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px' }}>
                                                                        <input 
                                                                            type="date" 
                                                                            style={{ 
                                                                                padding: '4px 8px', borderRadius: '6px', 
                                                                                border: isEditingTimeline ? '1px solid #CBD5E1' : '1px solid transparent', 
                                                                                fontSize: '12px', background: isEditingTimeline ? '#FFF' : 'transparent',
                                                                                color: '#1E293B', outline: 'none', width: '140px',
                                                                                cursor: isEditingTimeline ? 'text' : 'default'
                                                                            }}
                                                                            value={inst.due_date}
                                                                            disabled={!isEditingTimeline}
                                                                            onChange={e => handleInstallmentEdit(idx, 'due_date', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px' }}>
                                                                        <input 
                                                                            type="number" 
                                                                            style={{ 
                                                                                padding: '4px 8px', borderRadius: '6px',
                                                                                border: isEditingTimeline ? '1px solid #CBD5E1' : '1px solid transparent', 
                                                                                fontSize: '12px', fontWeight: 700,
                                                                                background: isEditingTimeline ? '#FFF' : 'transparent',
                                                                                color: '#1E293B', outline: 'none', width: '100px',
                                                                                cursor: isEditingTimeline ? 'text' : 'default'
                                                                            }}
                                                                            value={inst.amount}
                                                                            disabled={!isEditingTimeline}
                                                                            onChange={e => handleInstallmentEdit(idx, 'amount', e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                                                        <span style={{
                                                                            fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
                                                                            background: inst.status === 'paid' ? '#D1FAE5' : inst.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                                                                            color: inst.status === 'paid' ? '#059669' : inst.status === 'overdue' ? '#DC2626' : '#D97706'
                                                                        }}>
                                                                            {inst.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                                
                                                                {/* Inline audit trail row */}
                                                                {inst.date_histories && inst.date_histories.length > 0 && (
                                                                    <tr>
                                                                        <td colSpan={4} style={{ padding: '4px 12px 8px 36px', background: '#FAFBFC', borderTop: 'none' }}>
                                                                            <div style={{ fontSize: '10px', color: '#64748B', borderLeft: '2px solid #93C5FD', paddingLeft: '8px' }}>
                                                                                {inst.date_histories.map((hist: any) => (
                                                                                    <div key={hist.id} style={{ display: 'flex', gap: '4px', alignItems: 'center', lineHeight: '18px' }}>
                                                                                        <span style={{ textDecoration: 'line-through', color: '#EF4444' }}>{formatDate(hist.previous_due_date)}</span>
                                                                                        <span style={{ color: '#CBD5E1' }}>→</span>
                                                                                        <span style={{ color: '#10B981', fontWeight: 600 }}>{formatDate(hist.new_due_date)}</span>
                                                                                        {hist.change_reason && <span style={{ color: '#94A3B8' }}>({hist.change_reason})</span>}
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
                                                <div style={{ marginTop: '14px' }}>
                                                    <div style={{ background: '#F8F9FB', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '14px', border: '1px solid #E2E8F0' }}>
                                                        <span style={{ color: '#64748B' }}>Sum: {formatCurrency(installmentsSum)}</span>
                                                        <span style={{ color: isTimelineSumValid ? '#10B981' : '#EF4444' }}>Target: {formatCurrency(targetSum)} {isTimelineSumValid ? '✓' : '✗'}</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Notes</label>
                                                            <textarea style={{ width: '100%', minHeight: '60px', resize: 'vertical', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} value={drawerNotes} onChange={e => setDrawerNotes(e.target.value)} placeholder="Adjustment notes..." />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Change Reason</label>
                                                            <textarea style={{ width: '100%', minHeight: '60px', resize: 'vertical', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="Reason for date change..." />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. Receipt History Tab */}
                                    {activeTab === 'payments' && (
                                        <div style={{ padding: '16px 20px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '12px' }}>
                                                Payment Receipts
                                            </span>

                                            {drawerData?.payments?.length === 0 ? (
                                                <div style={{ padding: '32px', textAlign: 'center', background: '#FAFBFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                                    <CreditCard size={28} style={{ display: 'block', margin: '0 auto 8px', color: '#CBD5E1' }} />
                                                    <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500, margin: 0 }}>No payments recorded.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {drawerData?.payments?.map((payment: any) => (
                                                        <div key={payment.id} style={{
                                                            padding: '12px 14px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>{payment.receipt_number}</div>
                                                                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{formatDate(payment.payment_date)} • {payment.payment_method?.toUpperCase()}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 800, color: '#10B981', fontSize: '14px' }}>{formatCurrency(payment.amount_paid)}</span>
                                                                    {deletingPaymentId !== payment.id ? (
                                                                        <button 
                                                                            onClick={() => setDeletingPaymentId(payment.id)}
                                                                            style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                                            title="Reverse Payment"
                                                                            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                                                            onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => setDeletingPaymentId(null)}
                                                                            style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {deletingPaymentId === payment.id && (
                                                                <div style={{ marginTop: '8px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 10px', borderRadius: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                    <input 
                                                                        type="text" 
                                                                        style={{ flex: 1, padding: '5px 8px', borderRadius: '5px', border: '1px solid #FECACA', fontSize: '11px', outline: 'none' }}
                                                                        placeholder="Reason for reversal..."
                                                                        value={deleteRemark}
                                                                        onChange={e => setDeleteRemark(e.target.value)}
                                                                    />
                                                                    <button 
                                                                        onClick={() => handleRevertPayment(payment.id)}
                                                                        style={{ background: '#EF4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                    >
                                                                        Revert
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {payment.remarks && (
                                                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B', background: '#F8F9FB', padding: '6px 10px', borderRadius: '6px', fontStyle: 'italic' }}>
                                                                    {payment.remarks}
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
                                        <div style={{ padding: '16px 20px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '12px' }}>
                                                Modification History
                                            </span>

                                            {drawerData?.assignment?.audit_logs?.length === 0 ? (
                                                <div style={{ padding: '32px', textAlign: 'center', background: '#FAFBFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                                                    <History size={28} style={{ display: 'block', margin: '0 auto 8px', color: '#CBD5E1' }} />
                                                    <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500, margin: 0 }}>No audit logs.</p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {drawerData?.assignment?.audit_logs?.map((log: any) => (
                                                        <div key={log.id} style={{
                                                            padding: '10px 12px', background: '#FAFBFC', borderRadius: '8px', border: '1px solid #F1F5F9',
                                                            fontSize: '12px', color: '#475569'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '12px' }}>{log.action?.toUpperCase().replace('_', ' ')}</span>
                                                                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>{formatDate(log.created_at)}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{log.details}</div>
                                                            
                                                            {log.field_changed && (
                                                                <div style={{ display: 'inline-flex', gap: '6px', fontSize: '10px', background: '#FFFFFF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                                                                    <span style={{ color: '#94A3B8' }}>{log.field_changed?.toUpperCase()}:</span>
                                                                    <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{log.old_value}</span>
                                                                    <span>→</span>
                                                                    <span style={{ color: '#10B981' }}>{log.new_value}</span>
                                                                </div>
                                                            )}
                                                            
                                                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', fontWeight: 600 }}>
                                                                by {log.user?.email}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                {/* Drawer Footer - Compact */}
                                <div style={{ padding: '10px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                                        Registered {formatDate(drawerData?.assignment?.created_at)}
                                    </span>
                                    <button 
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                        style={{ 
                                            background: 'none', color: '#EF4444', border: 'none', 
                                            padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, 
                                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}

            {/* center modal for hard delete validation */}
            {isDeleteDialogOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13,15,33,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFFFFF', width: '480px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(13,15,33,0.15)', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FEF2F2', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                <AlertCircle size={22} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Confirm Permanent Deletion</h3>
                        </div>

                        {drawerData?.assignment?.total_paid > 0 || (drawerData?.payments && drawerData.payments.length > 0) ? (
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
                                Are you sure you want to permanently delete the fee assignment for <strong>{drawerData?.assignment?.student_name}</strong>? This will remove all generated installments. This action is irreversible.
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

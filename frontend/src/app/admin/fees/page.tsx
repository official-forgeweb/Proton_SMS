'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CreditCard, Search, Plus, DollarSign, Download, Clock, CheckCircle, Wallet, AlertCircle, TrendingUp, Filter, IndianRupee, User, Calendar, ReceiptText } from 'lucide-react';

export default function FeesPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        student_id: '', amount_paid: 0, payment_method: 'cash', remarks: ''
    });

    const [assignFormData, setAssignFormData] = useState({
        student_id: '', final_fee: 0, due_date: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/fees/pay', formData);
            setIsPayOpen(false);
            fetchFees();
            setFormData({ student_id: '', amount_paid: 0, payment_method: 'cash', remarks: '' });
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment');
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/fees/assignments', assignFormData);
            setIsAssignOpen(false);
            fetchFees();
            setAssignFormData({ student_id: '', final_fee: 0, due_date: '' });
        } catch (error: any) {
            console.error('Error assigning fee:', error);
            alert(error.response?.data?.message || 'Failed to assign fee');
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const [resAssignments, resStats, resStudents] = await Promise.all([
                api.get('/fees/assignments'),
                api.get('/fees/stats'),
                api.get('/students')
            ]);
            setAssignments(resAssignments.data.data);
            setStats(resStats.data.data);
            setStudents(resStudents.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;

    const filteredAssignments = assignments.filter(a => 
        a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.pro_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            -webkit-backdrop-filter: blur(20px);
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
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.1) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%);
        }
        
        /* Modal Form Refinement */
        .modal-label { fontSize: 13px; fontWeight: 700; color: #1A1D3B; display: block; marginBottom: 8px; textTransform: uppercase; letterSpacing: 0.05em; }
        .modal-input { padding: 12px 16px; border: 1px solid #E2E8F0; borderRadius: 12px; fontSize: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%; transition: all 0.2s; }
        .modal-input:focus { border-color: #E53935; background: #FFF; box-shadow: 0 0 0 4px rgba(229,57,53,0.05); }

        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px;
            font-size: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%;
            font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus { border-color: #E53935; background: #FFF; }
    `;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: customStyles}} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

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
                        <button style={{
                            background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '12px 20px', fontSize: '14px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                            onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                        >
                            <Download size={16} strokeWidth={2.5} /> Export Report
                        </button>
                        <button onClick={() => setIsAssignOpen(true)} style={{
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
                            onClick={() => setIsPayOpen(true)}
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
                                    <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', letterSpacing: '-0.02em', margin: 0 }}>{stats.pending_students}</h2>
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

                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center' }}>
                             <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #10B981', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                            </div>
                            <p style={{ color: '#1A1D3B', fontSize: '15px', fontWeight: 600 }}>Analyzing accounts...</p>
                        </div>
                    ) : filteredAssignments.length === 0 ? (
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
                                        <tr key={a.id} className="table-row-hover" style={{ cursor: 'default' }}>
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
                                            <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: '15px', color: '#1A1D3B' }}>{formatCurrency(a.final_fee)}</td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 800, fontSize: '15px' }}>
                                                    {formatCurrency(a.total_paid)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 900, fontSize: '15px' }}>
                                                    {formatCurrency(a.total_pending)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{
                                                    display: 'inline-flex', padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    background: a.payment_status === 'paid' ? '#ECFDF5' : a.payment_status === 'partial' ? '#FFFBEB' : '#FEF2F2',
                                                    color: a.payment_status === 'paid' ? '#059669' : a.payment_status === 'partial' ? '#D97706' : '#DC2626',
                                                    boxShadow: a.payment_status === 'paid' ? '0 2px 8px rgba(16,185,129,0.1)' : 'none'
                                                }}>
                                                    {a.payment_status}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                {a.total_pending > 0 ? (
                                                    <button 
                                                        onClick={() => { setFormData({ ...formData, student_id: a.student_id, amount_paid: a.total_pending }); setIsPayOpen(true); }}
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                                                            color: 'white', border: 'none', borderRadius: '10px', 
                                                            padding: '10px 18px', fontSize: '13px', fontWeight: 700, 
                                                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                            boxShadow: '0 4px 12px rgba(26,29,59,0.2)', transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                    >
                                                        Record Pay <ReceiptText size={14} strokeWidth={2.5} />
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', background: '#F0FDF4', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}>
                                                        <CheckCircle size={16} /> Fully Settled
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Record Payment Modal */}
            <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Collect Revenue / Process Payment">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: '#F8F9FD', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '32px', height: '32px', background: '#1A1D3B', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                <User size={16} strokeWidth={2.5} />
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Payee Details</h4>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label className="modal-label">Select Student Account *</label>
                            <select required className="modal-input" value={formData.student_id} onChange={e => {
                                const assignment = assignments.find(a => a.student_id === e.target.value);
                                setFormData({ ...formData, student_id: e.target.value, amount_paid: assignment ? assignment.total_pending : 0 });
                            }}>
                                <option value="">Select Account...</option>
                                {assignments.filter(a => a.total_pending > 0).map(a => (
                                    <option key={a.id} value={a.student_id}>{a.student_name} ({a.pro_id}) — Dues: ₹{a.total_pending.toLocaleString()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="modal-label">Amount Received (₹) *</label>
                            <div style={{ position: 'relative' }}>
                                <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="number" required className="modal-input" style={{ paddingLeft: '40px' }} value={formData.amount_paid || ''} onChange={e => setFormData({ ...formData, amount_paid: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <label className="modal-label">Payment Method *</label>
                            <select required className="modal-input" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                <option value="cash">💵 Physical Cash</option>
                                <option value="online">📱 Online / UPI / QR</option>
                                <option value="bank_transfer">🏦 Direct NEFT/IMPS</option>
                                <option value="cheque">📄 Check / Draft</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="modal-label">Transaction Remarks</label>
                        <textarea 
                            className="modal-input" 
                            style={{ minHeight: '80px', resize: 'none' }} 
                            placeholder="Add receipt number or specific payment notes here..."
                            value={formData.remarks} 
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                        <button type="button" onClick={() => setIsPayOpen(false)} style={{ padding: '12px 28px', background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(16,185,129,0.3)' }}>Finalize Receipt</button>
                    </div>
                </form>
            </Modal>

            {/* Assign Fee Modal */}
            <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Initialize Student Account / Assign Fee">
                <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ marginBottom: '4px' }}>
                        <label className="modal-label">Choose Student Profile *</label>
                        <select required className="modal-input" value={assignFormData.student_id} onChange={e => setAssignFormData({ ...assignFormData, student_id: e.target.value })}>
                            <option value="">Search student directory...</option>
                            {students.filter(s => !assignments.find(a => a.student_id === s.id)).map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.PRO_ID})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="modal-label">Annual/Full Package Fee (₹) *</label>
                            <div style={{ position: 'relative' }}>
                                <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="number" required min="1" className="modal-input" style={{ paddingLeft: '40px' }} value={assignFormData.final_fee || ''} onChange={e => setAssignFormData({ ...assignFormData, final_fee: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <label className="modal-label">Primary Due Date *</label>
                            <div style={{ position: 'relative' }}>
                                <DatePicker 
                                    showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" 
                                    required selected={assignFormData.due_date ? new Date(assignFormData.due_date) : null} 
                                    onChange={(date: Date | null) => setAssignFormData({ ...assignFormData, due_date: date ? date.toISOString().split('T')[0] : '' })} 
                                    dateFormat="MMMM d, yyyy" placeholderText="Set target date" 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                        <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 500, margin: 0 }}>
                            Assigning a fee will create a permanent ledger for this student. Ensure the total balance matches the scholarship or discounted rates if applicable.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                        <button type="button" onClick={() => setIsAssignOpen(false)} style={{ padding: '12px 28px', background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>Create Account</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

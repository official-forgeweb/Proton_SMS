'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { CreditCard, Search, Plus, DollarSign, Download, Clock, CheckCircle } from 'lucide-react';

export default function FeesPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

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

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Fee Management</h1>
                    <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                        Track collections, pending dues, and issue receipts.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ background: '#FFFFFF', color: '#5E6278', border: '1px solid #F0F0F5', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => setIsAssignOpen(true)} style={{ background: '#FFFFFF', color: '#5E6278', border: '1px solid #F0F0F5', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Plus size={16} /> Assign Fee
                    </button>
                    <button onClick={() => setIsPayOpen(true)} style={{ background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)' }}>
                        <Plus size={16} /> Record Payment
                    </button>
                </div>
            </div>

            <div>
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', color: 'white', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                            <p style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>Total Collected</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{formatCurrency(stats.total_collected)}</h2>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', color: 'white', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 14px rgba(239,68,68,0.25)' }}>
                            <p style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>Total Pending</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{formatCurrency(stats.total_pending)}</h2>
                        </div>
                        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500 }}>Fully Paid Students</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>{stats.paid_students}</h2>
                        </div>
                        <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '13px', color: '#A1A5B7', fontWeight: 500 }}>Pending Students</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#F59E0B' }}>{stats.pending_students}</h2>
                        </div>
                    </div>
                )}

                <div style={{ background: '#FFFFFF', borderRadius: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Fee Defaulters &amp; Assignments</h3>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#F4F5F9', borderRadius: '10px', padding: '8px 14px', width: '260px', gap: '8px', border: '1px solid #F0F0F5' }}>
                            <Search size={14} color="#A1A5B7" />
                            <input placeholder="Search student..." style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '13px', color: '#1A1D3B' }} />
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading fee data...</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#A1A5B7' }}>
                            <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Fee Data</h3>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ background: '#F8F9FD' }}>
                                        {['Student Details', 'Total Fee', 'Paid Amount', 'Pending Balance', 'Status', 'Actions'].map((h, i) => (
                                            <th key={h} style={{ padding: '13px 16px', textAlign: i === 5 ? 'right' : 'left', color: '#A1A5B7', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, idx) => (
                                        <tr key={a.id} className="animate-fade-in" style={{ borderBottom: '1px solid #F0F0F5', animationDelay: `${idx * 20}ms`, transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8F9FD'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{a.student_name}</div>
                                                <div style={{ fontSize: '12px', color: '#A1A5B7', fontFamily: 'monospace', marginTop: '2px' }}>{a.pro_id}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>{formatCurrency(a.final_fee)}</td>
                                            <td style={{ padding: '14px 16px', color: '#10B981', fontWeight: 700 }}>{formatCurrency(a.total_paid)}</td>
                                            <td style={{ padding: '14px 16px', color: '#EF4444', fontWeight: 700 }}>{formatCurrency(a.total_pending)}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, background: a.payment_status === 'paid' ? '#D1FAE5' : a.payment_status === 'partial' ? '#FEF3C7' : '#FEE2E2', color: a.payment_status === 'paid' ? '#059669' : a.payment_status === 'partial' ? '#92400E' : '#DC2626' }}>
                                                    {a.payment_status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <button style={{ background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,96,255,0.25)' }} onClick={() => { setFormData({ ...formData, student_id: a.student_id, amount_paid: a.total_pending }); setIsPayOpen(true); }}>Pay Now</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            </div>
            <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} title="Record Fee Payment">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="label">Student</label>
                        <select required className="input-field" value={formData.student_id} onChange={e => {
                            const assignment = assignments.find(a => a.student_id === e.target.value);
                            setFormData({ ...formData, student_id: e.target.value, amount_paid: assignment ? assignment.total_pending : 0 });
                        }}>
                            <option value="">Select Student...</option>
                            {assignments.filter(a => a.total_pending > 0).map(a => <option key={a.id} value={a.student_id}>{a.student_name} ({a.pro_id}) - Pending: ₹{a.total_pending}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Amount Paid</label>
                            <input type="number" required className="input-field" value={formData.amount_paid} onChange={e => setFormData({ ...formData, amount_paid: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="label">Payment Method</label>
                            <select required className="input-field" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                <option value="cash">Cash</option>
                                <option value="online">Online / UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Remarks</label>
                        <input className="input-field" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsPayOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Submit Payment</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Fee to Student">
                <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="label">Select Student *</label>
                        <select required className="input-field" value={assignFormData.student_id} onChange={e => setAssignFormData({ ...assignFormData, student_id: e.target.value })}>
                            <option value="">Choose a student...</option>
                            {students.filter(s => !assignments.find(a => a.student_id === s.id)).map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.PRO_ID})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Total Fee Amount (₹) *</label>
                            <input type="number" required min="1" className="input-field" value={assignFormData.final_fee || ''} onChange={e => setAssignFormData({ ...assignFormData, final_fee: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="label">Due Date *</label>
                            <input type="date" required className="input-field" value={assignFormData.due_date} onChange={e => setAssignFormData({ ...assignFormData, due_date: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Assign Fee</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

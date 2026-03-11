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
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Fee Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Track collections, pending dues, and issue receipts.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary"><Download size={16} /> Export</button>
                    <button className="btn btn-secondary" onClick={() => setIsAssignOpen(true)}><Plus size={16} /> Assign Fee</button>
                    <button className="btn btn-primary" onClick={() => setIsPayOpen(true)}><Plus size={16} /> Record Payment</button>
                </div>
            </div>

            <div className="page-body">
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div className="card hover-lift" style={{ background: 'var(--gradient-success)', color: 'white', border: 'none' }}>
                            <p style={{ fontSize: '13px', opacity: 0.9 }}>Total Collected</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{formatCurrency(stats.total_collected)}</h2>
                        </div>
                        <div className="card hover-lift" style={{ background: 'var(--gradient-error)', color: 'white', border: 'none' }}>
                            <p style={{ fontSize: '13px', opacity: 0.9 }}>Total Pending</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{formatCurrency(stats.total_pending)}</h2>
                        </div>
                        <div className="card hover-lift">
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fully Paid Students</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>{stats.paid_students}</h2>
                        </div>
                        <div className="card hover-lift">
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Students</p>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--warning)' }}>{stats.pending_students}</h2>
                        </div>
                    </div>
                )}

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Fee Defaulters & Assignments</h3>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input className="input-field" placeholder="Search student..." style={{ paddingLeft: '36px' }} />
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : assignments.length === 0 ? (
                        <div className="empty-state">
                            <CreditCard size={48} />
                            <h3>No Fee Data</h3>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student Details</th>
                                        <th>Total Fee</th>
                                        <th>Paid Amount</th>
                                        <th>Pending Balance</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, idx) => (
                                        <tr key={a.id} className="animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.student_name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{a.pro_id}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(a.final_fee)}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(a.total_paid)}</td>
                                            <td style={{ color: 'var(--error)', fontWeight: 600 }}>{formatCurrency(a.total_pending)}</td>
                                            <td>
                                                <span className={`badge ${a.payment_status === 'paid' ? 'badge-success' : a.payment_status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                                                    {a.payment_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => { setFormData({ ...formData, student_id: a.student_id, amount_paid: a.total_pending }); setIsPayOpen(true); }}>Pay Now</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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

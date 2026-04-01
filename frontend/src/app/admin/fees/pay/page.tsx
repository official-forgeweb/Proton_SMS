'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { CreditCard, IndianRupee } from 'lucide-react';

export default function RecordPaymentPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '', amount_paid: 0, payment_method: 'cash', remarks: ''
    });

    useEffect(() => {
        api.get('/fees/assignments').then(res => {
            setAssignments(res.data.data || []);
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/fees/pay', formData);
            router.push('/admin/fees');
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Record Payment"
            subtitle="Collect and process student fee payments"
            backHref="/admin/fees"
            backLabel="Back to Fees"
            requiredRole="admin"
            icon={<CreditCard size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading accounts...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">Payee Details</div>
                        <div>
                            <label className="form-label">Select Student Account *</label>
                            <select required className="form-input" value={formData.student_id} onChange={e => {
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

                    <div className="form-section">
                        <div className="form-section-title">Payment Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Amount Received (₹) *</label>
                                <div style={{ position: 'relative' }}>
                                    <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="number" required className="form-input" style={{ paddingLeft: '40px' }} value={formData.amount_paid || ''} onChange={e => setFormData({ ...formData, amount_paid: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Payment Method *</label>
                                <select required className="form-input" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="online">Online / UPI / QR</option>
                                    <option value="bank_transfer">NEFT / IMPS</option>
                                    <option value="cheque">Cheque / Draft</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <label className="form-label">Transaction Remarks</label>
                            <textarea className="form-input" style={{ minHeight: '80px', resize: 'none' }} placeholder="Add receipt number or specific payment notes here..." value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push('/admin/fees')}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 8px 16px rgba(16,185,129,0.3)' }}>
                            {isSubmitting ? 'Processing...' : 'Finalize Receipt'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

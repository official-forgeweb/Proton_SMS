'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { CreditCard, IndianRupee, User, Info, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';

export default function RecordPaymentPage() {
    const router = useRouter();
    const { user } = useAuthStore();
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

    const selectedAssignment = assignments.find(a => a.student_id === formData.student_id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.student_id) {
            toast.error('Please select a student account.');
            return;
        }
        if (formData.amount_paid <= 0) {
            toast.error('Please enter a valid payment amount greater than zero.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await api.post('/fees/pay', formData);
            toast.success('Payment recorded successfully!');
            router.push(`/${user?.role || 'admin'}/fees`);
        } catch (error: any) {
            console.error('Error recording payment:', error);
            toast.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Record Payment"
            subtitle="Collect and process student fee payments"
            backHref={`/${user?.role || 'admin'}/fees`}
            backLabel="Back to Fees"
            requiredRole={['admin', 'coordinator']}
            icon={<CreditCard size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                    ))}
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'flex-start' }}>
                    
                    {/* Main Controls Left */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Student selection */}
                        <div className="form-section" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0' }}>
                            <div className="form-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <User size={18} style={{ color: '#3B82F6' }} /> Payee Identification
                            </div>
                            
                            <div>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                    Search Student Financial Account *
                                </label>
                                <select required className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }} value={formData.student_id} onChange={e => {
                                    const assignment = assignments.find(a => a.student_id === e.target.value);
                                    setFormData({ ...formData, student_id: e.target.value, amount_paid: assignment ? assignment.total_pending : 0 });
                                }}>
                                    <option value="">Select Account...</option>
                                    {assignments.filter(a => a.total_pending > 0).map(a => (
                                        <option key={a.id} value={a.student_id}>
                                            {a.student_name} ({a.pro_id.toUpperCase()}) — Dues: ₹{a.total_pending.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Transaction details */}
                        <div className="form-section" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0' }}>
                            <div className="form-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <IndianRupee size={18} style={{ color: '#10B981' }} /> Transaction Details
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                        Amount Received (₹) *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input type="number" required min={1} className="form-input" style={{ paddingLeft: '44px', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }} value={formData.amount_paid || ''} onChange={e => setFormData({ ...formData, amount_paid: Number(e.target.value) })} placeholder="Enter received amount" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                        Payment Method *
                                    </label>
                                    <select required className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px' }} value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                        <option value="cash">🏦 Cash Payment</option>
                                        <option value="online">📱 Online / UPI / QR</option>
                                        <option value="bank_transfer">🏛️ Bank Transfer (NEFT/IMPS)</option>
                                        <option value="cheque">📝 Cheque / Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                    Financial Remarks / Notes
                                </label>
                                <textarea className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', minHeight: '100px', resize: 'vertical' }} placeholder="Add bank reference ID, receipt notes, or specific details regarding this transaction..." value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                            </div>
                        </div>

                    </div>

                    {/* Summary Sidebar Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
                        
                        {/* Account Balance Summary */}
                        {selectedAssignment && (
                            <div style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 12px 28px rgba(26,29,59,0.15)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '12px', margin: '0 0 16px 0', fontFamily: 'Poppins, sans-serif' }}>
                                    Account Dues Overview
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.7 }}>Student Account:</span>
                                        <span style={{ fontWeight: 800 }}>{selectedAssignment.student_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.7 }}>Net course fee:</span>
                                        <span>₹{selectedAssignment.final_fee.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.7 }}>Total settled:</span>
                                        <span style={{ color: '#10B981', fontWeight: 700 }}>₹{selectedAssignment.total_paid.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', fontSize: '18px', fontWeight: 900, color: '#EF4444' }}>
                                        <span>Outstanding Dues:</span>
                                        <span>₹{selectedAssignment.total_pending.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirmation Box */}
                        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 12px 0', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={16} style={{ color: '#3B82F6' }} /> Cascading Allocation Policy
                            </h3>
                            
                            <p style={{ fontSize: '13px', color: '#5E6278', lineHeight: 1.5, margin: '0 0 20px 0', fontWeight: 500 }}>
                                proton's financial engine automatically allocates payments sequentially to overdue and upcoming installments. Any excess payments will roll to the next installment.
                            </p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-cancel" style={{ flex: 1, padding: '12px' }} onClick={() => router.push(`/${user?.role || 'admin'}/fees`)}>Cancel</button>
                                <button type="submit" className="btn-submit" style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={isSubmitting || !formData.student_id || formData.amount_paid <= 0}>
                                    <CheckCircle size={16} /> {isSubmitting ? 'Processing...' : 'Collect Receipt'}
                                </button>
                            </div>
                        </div>

                    </div>

                </form>
            )}
        </FormPageLayout>
    );
}

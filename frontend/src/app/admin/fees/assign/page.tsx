'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, IndianRupee, AlertCircle } from 'lucide-react';

export default function AssignFeePage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '', final_fee: 0, due_date: ''
    });

    useEffect(() => {
        Promise.all([
            api.get('/students'),
            api.get('/fees/assignments'),
        ]).then(([studentsRes, assignmentsRes]) => {
            setStudents(studentsRes.data.data || []);
            setAssignments(assignmentsRes.data.data || []);
        }).catch(console.error).finally(() => setIsLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/fees/assignments', formData);
            router.push('/admin/fees');
        } catch (error: any) {
            console.error('Error assigning fee:', error);
            alert(error.response?.data?.message || 'Failed to assign fee');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormPageLayout
            title="Assign Fee to Student"
            subtitle="Initialize a new student fee account"
            backHref="/admin/fees"
            backLabel="Back to Fees"
            requiredRole="admin"
            icon={<Plus size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading students...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">Student Selection</div>
                        <div>
                            <label className="form-label">Choose Student Profile *</label>
                            <select required className="form-input" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                                <option value="">Search student directory...</option>
                                {students.filter(s => !assignments.find(a => a.student_id === s.id)).map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.PRO_ID})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">Fee Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Annual / Full Package Fee (₹) *</label>
                                <div style={{ position: 'relative' }}>
                                    <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="number" required min={1} className="form-input" style={{ paddingLeft: '40px' }} value={formData.final_fee || ''} onChange={e => setFormData({ ...formData, final_fee: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Primary Due Date *</label>
                                <DatePicker
                                    showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select"
                                    required selected={formData.due_date ? new Date(formData.due_date) : null}
                                    onChange={(date: Date | null) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="MMMM d, yyyy" placeholderText="Set target date"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 500, margin: 0 }}>
                            Assigning a fee will create a permanent ledger for this student. Ensure the total balance matches the scholarship or discounted rates if applicable.
                        </p>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push('/admin/fees')}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

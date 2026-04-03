'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, IndianRupee, AlertCircle, Users } from 'lucide-react';

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">
                            <Users size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                            Student Selection
                        </div>
                        <div>
                            <label className="form-label">Search & Select Student Profile *</label>
                            <select required className="form-input" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                                <option value="">Type to search student directory...</option>
                                {students.filter(s => !assignments.find(a => a.student_id === s.id)).map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.PRO_ID})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <IndianRupee size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                            Financial Configuration
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                            <div>
                                <label className="form-label">Total Course Fee (Annual) *</label>
                                <div style={{ position: 'relative' }}>
                                    <IndianRupee size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="number" required min={1} className="form-input" style={{ paddingLeft: '40px' }} value={formData.final_fee || ''} onChange={e => setFormData({ ...formData, final_fee: Number(e.target.value) })} placeholder="e.g. 45000" />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Primary Due Date *</label>
                                <DatePicker
                                    showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select"
                                    required selected={formData.due_date ? new Date(formData.due_date) : null}
                                    onChange={(date: Date | null) => setFormData({ ...formData, due_date: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="MMMM d, yyyy" placeholderText="Select target date"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        background: 'rgba(255, 187, 0, 0.05)', 
                        border: '1px dashed #FEF3C7', 
                        padding: '20px', 
                        borderRadius: '20px', 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '32px' 
                    }}>
                        <AlertCircle size={24} color="#D97706" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', color: '#92400E', fontWeight: 500, lineHeight: 1.6 }}>
                            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Important Ledger Information</strong>
                            Assigning a fee will initialize a permanent financial ledger. Verify scholarship rates and applicable discounts before finalizing.
                        </div>
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

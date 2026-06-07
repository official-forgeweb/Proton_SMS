'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, IndianRupee, AlertCircle, Users, BookOpen, Settings, Eye, Check, CalendarDays, ClipboardList, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';

export default function AssignFeePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    
    const [students, setStudents] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStructure, setSelectedStructure] = useState('');
    const [academicYear, setAcademicYear] = useState('2026-2027');
    
    const [totalFee, setTotalFee] = useState(0);
    const [admissionFee, setAdmissionFee] = useState(0);
    const [registrationFee, setRegistrationFee] = useState(0);
    
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [scholarshipAmount, setScholarshipAmount] = useState(0);
    
    const [paymentMode, setPaymentMode] = useState<'one_time' | 'installment'>('one_time');
    const [installmentStrategy, setInstallmentStrategy] = useState<'auto_equal' | 'manual_custom'>('auto_equal');
    const [installmentCount, setInstallmentCount] = useState(4);
    const [courseDurationMonths, setCourseDurationMonths] = useState(12);
    const [preferredDueDay, setPreferredDueDay] = useState(5);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    
    // Live installment list
    const [installments, setInstallments] = useState<any[]>([]);
    
    const queryStudentId = searchParams.get('student_id') || '';

    // Load initial data
    useEffect(() => {
        Promise.all([
            api.get('/students'),
            api.get('/fees/assignments'),
            api.get('/fees/structures')
        ]).then(async ([studentsRes, assignmentsRes, structuresRes]) => {
            let studentsList = studentsRes.data.data || [];
            const assignmentsList = assignmentsRes.data.data || [];
            
            if (queryStudentId && !studentsList.some((s: any) => s.id === queryStudentId)) {
                try {
                    const studentRes = await api.get(`/students/${queryStudentId}`);
                    if (studentRes.data.success && studentRes.data.data) {
                        studentsList = [studentRes.data.data, ...studentsList];
                    }
                } catch (err) {
                    console.error('Error fetching preselected student details:', err);
                }
            }
            
            setStudents(studentsList);
            setAssignments(assignmentsList);
            setStructures(structuresRes.data.data || []);
            
            if (queryStudentId) {
                setSelectedStudent(queryStudentId);
            }
        }).catch(console.error).finally(() => setIsLoading(false));
    }, [queryStudentId]);

    // Calculate live net payable fee
    const calculatedDiscountAmount = discountPercentage > 0 ? (totalFee * discountPercentage) / 100 : discountAmount;
    const finalFee = Math.max(0, (totalFee + admissionFee + registrationFee) - calculatedDiscountAmount - scholarshipAmount);

    // Auto calculate live preview or fetch from backend
    useEffect(() => {
        if (paymentMode === 'one_time') {
            setInstallments([{
                installment_number: 1,
                amount: finalFee,
                due_date: startDate
            }]);
        } else if (installmentStrategy === 'auto_equal') {
            // Live client-side preview generation
            const interval = courseDurationMonths / installmentCount;
            const baseAmount = Math.floor((finalFee / installmentCount) * 100) / 100;
            const lastAmount = Math.round((finalFee - (baseAmount * (installmentCount - 1))) * 100) / 100;
            
            const list = [];
            const baseDate = new Date(startDate);
            
            for (let i = 1; i <= installmentCount; i++) {
                const amount = i === installmentCount ? lastAmount : baseAmount;
                const monthsToAdd = Math.round((i - 1) * interval);
                const targetDate = new Date(baseDate);
                targetDate.setMonth(targetDate.getMonth() + monthsToAdd);
                
                if (preferredDueDay) {
                    const day = Math.min(28, Math.max(1, preferredDueDay));
                    targetDate.setDate(day);
                }
                list.push({
                    installment_number: i,
                    amount,
                    due_date: targetDate.toISOString().split('T')[0]
                });
            }
            setInstallments(list);
        }
    }, [finalFee, paymentMode, installmentStrategy, installmentCount, courseDurationMonths, preferredDueDay, startDate]);

    // Handle template structure selection
    const handleStructureChange = (structureId: string) => {
        setSelectedStructure(structureId);
        if (!structureId) return;
        
        const struct = structures.find(s => s.id === structureId);
        if (struct) {
            setTotalFee(struct.tuition_fee || 0);
            setAdmissionFee(struct.admission_fee || 0);
            setRegistrationFee(struct.registration_fee || 0);
            if (struct.academic_year) setAcademicYear(struct.academic_year);
            if (struct.max_installments) {
                setInstallmentCount(Math.min(struct.max_installments, 12));
                setPaymentMode(struct.max_installments > 1 ? 'installment' : 'one_time');
            }
            
            // Auto populate duration from class batch if exists
            if (struct.class && struct.class.course_duration_months) {
                setCourseDurationMonths(struct.class.course_duration_months);
            }
        }
    };

    // Edit individual manual custom installment
    const handleManualInstallmentChange = (index: number, field: string, value: any) => {
        const list = [...installments];
        if (field === 'amount') {
            list[index].amount = Number(value);
        } else if (field === 'due_date') {
            list[index].due_date = value;
        }
        setInstallments(list);
    };

    const installmentsSum = Math.round(installments.reduce((acc, curr) => acc + curr.amount, 0) * 100) / 100;
    const isCustomValid = Math.abs(installmentsSum - finalFee) <= 0.02;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (paymentMode === 'installment' && installmentStrategy === 'manual_custom' && !isCustomValid) {
            alert(`The sum of custom installments (${installmentsSum}) must match the Net Payable amount (${finalFee}) exactly.`);
            return;
        }
        
        setIsSubmitting(true);
        
        const payload = {
            student_id: selectedStudent,
            fee_structure_id: selectedStructure || null,
            academic_year: academicYear,
            total_fee: totalFee,
            admission_fee: admissionFee,
            registration_fee: registrationFee,
            discount_percentage: discountPercentage,
            discount_amount: discountPercentage > 0 ? 0 : discountAmount,
            scholarship_amount: scholarshipAmount,
            payment_mode: paymentMode,
            installment_strategy: installmentStrategy,
            installment_count: paymentMode === 'one_time' ? 1 : installmentCount,
            course_duration_months: courseDurationMonths,
            preferred_due_day: preferredDueDay,
            start_date: startDate,
            notes,
            custom_installments: installmentStrategy === 'manual_custom' ? installments : undefined
        };
        
        try {
            await api.post('/fees/assignments', payload);
            toast.success('Fee assigned successfully!');
            router.push(`/${user?.role || 'admin'}/fees`);
        } catch (error: any) {
            console.error('Error assigning fee:', error);
            toast.error(error.response?.data?.message || 'Failed to assign fee');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout requiredRole={['admin', 'coordinator']}>
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>
                <style dangerouslySetInnerHTML={{ __html: `
                    .form-label {
                        font-weight: 750 !important;
                        font-size: 11px !important;
                        color: #475569 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.08em !important;
                        margin-bottom: 8px !important;
                        display: block !important;
                    }
                    .form-input {
                        background: #F8FAFC !important;
                        border: 1.5px solid #E2E8F0 !important;
                        border-radius: 12px !important;
                        padding: 12px 16px !important;
                        font-size: 14px !important;
                        font-weight: 500 !important;
                        color: #1E293B !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        outline: none !important;
                        width: 100% !important;
                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.01) !important;
                    }
                    .form-input:focus {
                        background: #FFFFFF !important;
                        border-color: #3B82F6 !important;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12) !important;
                    }
                    .form-input-with-icon {
                        padding-left: 36px !important;
                    }
                    select.form-input {
                        appearance: none !important;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
                        background-repeat: no-repeat !important;
                        background-position: right 16px center !important;
                        background-size: 16px !important;
                        padding-right: 40px !important;
                    }
                    .react-datepicker-wrapper {
                        width: 100% !important;
                    }
                    .react-datepicker__input-container input {
                        background: #F8FAFC !important;
                        border: 1.5px solid #E2E8F0 !important;
                        border-radius: 12px !important;
                        padding: 12px 16px !important;
                        font-size: 14px !important;
                        font-weight: 500 !important;
                        color: #1E293B !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        outline: none !important;
                        width: 100% !important;
                        box-shadow: inset 0 1px 2px rgba(0,0,0,0.01) !important;
                    }
                    .react-datepicker__input-container input:focus {
                        background: #FFFFFF !important;
                        border-color: #3B82F6 !important;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12) !important;
                    }
                    .glow-card-blue {
                        position: relative;
                        overflow: hidden;
                        border-left: 4px solid #3B82F6 !important;
                        transition: all 0.3s ease !important;
                    }
                    .glow-card-blue:hover {
                        box-shadow: 0 12px 24px -10px rgba(59, 130, 246, 0.1) !important;
                    }
                    .glow-card-green {
                        position: relative;
                        overflow: hidden;
                        border-left: 4px solid #10B981 !important;
                        transition: all 0.3s ease !important;
                    }
                    .glow-card-green:hover {
                        box-shadow: 0 12px 24px -10px rgba(16, 185, 129, 0.1) !important;
                    }
                    .glow-card-orange {
                        position: relative;
                        overflow: hidden;
                        border-left: 4px solid #F59E0B !important;
                        transition: all 0.3s ease !important;
                    }
                    .glow-card-orange:hover {
                        box-shadow: 0 12px 24px -10px rgba(245, 158, 11, 0.1) !important;
                    }
                    .premium-summary-card {
                        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%) !important;
                        color: #F8FAFC !important;
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.35) !important;
                    }
                    .premium-net-payable {
                        font-size: 26px !important;
                        font-weight: 900 !important;
                        background: linear-gradient(135deg, #10B981 0%, #34D399 100%) !important;
                        -webkit-background-clip: text !important;
                        -webkit-text-fill-color: transparent !important;
                        display: inline-block !important;
                    }
                    .premium-installment-slab {
                        background: #FFFFFF !important;
                        border: 1px solid #E2E8F0 !important;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02) !important;
                        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    .premium-installment-slab:hover {
                        border-color: #CBD5E1 !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04) !important;
                        transform: translateY(-2px) !important;
                    }
                    .btn-submit {
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                        cursor: pointer !important;
                    }
                    .btn-submit:hover:not(:disabled) {
                        transform: translateY(-2.5px) scale(1.015) !important;
                        box-shadow: 0 12px 24px rgba(59, 130, 246, 0.35) !important;
                    }
                    .btn-cancel {
                        transition: all 0.2s !important;
                        cursor: pointer !important;
                        border: 1px solid #E2E8F0 !important;
                        border-radius: 12px !important;
                        background: #FFFFFF !important;
                        color: #475569 !important;
                    }
                    .btn-cancel:hover {
                        background: #F1F5F9 !important;
                        border-color: #CBD5E1 !important;
                        color: #0F172A !important;
                    }
                    .form-section {
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.015) !important;
                    }
                    .bg-mesh {
                        background-color: #f7f8fc;
                        background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.05) 0px, transparent 50%),
                                          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.05) 0px, transparent 50%),
                                          radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%);
                    }
                ` }} />

                {/* Back Button & Header in Dashboard Style */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', animation: 'headerIn 0.8s ease' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <button
                                type="button"
                                onClick={() => router.push(`/${user?.role || 'admin'}/fees`)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'white', border: '1px solid #E2E8F0', 
                                    cursor: 'pointer', color: '#5E6278', fontSize: '11px', fontWeight: 800,
                                    padding: '8px 16px', borderRadius: '12px', transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginRight: '12px'
                                }}
                            >
                                <ArrowLeft size={14} strokeWidth={3} /> BACK
                            </button>
                            <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Assign Fee to Student
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, margin: 0 }}>
                            Initialize a new student fee account and configure customized installments
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', color: '#8F92A1', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <ClipboardList className="animate-pulse" style={{ color: '#3B82F6' }} /> Loading configuration data...
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '32px', alignItems: 'flex-start' }}>
                        
                        {/* Form Controls Left */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            
                            {/* Select Student & Template */}
                            <div className="form-section glow-card-blue" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0' }}>
                                <div className="form-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>
                                    <Users size={18} style={{ color: '#3B82F6' }} /> Student Selection & Templates
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label className="form-label">
                                            Search & Select Student *
                                        </label>
                                        <select required className="form-input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                                            <option value="">Type to search student directory...</option>
                                            {students.filter(s => !assignments.find(a => a.student_id === s.id)).map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.PRO_ID})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Apply Fee Template (Optional)
                                        </label>
                                        <select className="form-input" value={selectedStructure} onChange={e => handleStructureChange(e.target.value)}>
                                            <option value="">Manual Setup (No Template)</option>
                                            {structures.map(s => (
                                                <option key={s.id} value={s.id}>{s.structure_name} ({s.academic_year})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Allocation */}
                            <div className="form-section glow-card-green" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0' }}>
                                <div className="form-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>
                                    <IndianRupee size={18} style={{ color: '#10B981' }} /> Financial Allocation
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                                    <div>
                                        <label className="form-label">Tuition Fee *</label>
                                        <div style={{ position: 'relative' }}>
                                            <IndianRupee size={14} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                                            <input type="number" required min={0} className="form-input form-input-with-icon" style={{ paddingLeft: '36px' }} value={totalFee || ''} onChange={e => setTotalFee(Number(e.target.value))} placeholder="e.g. 40000" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Admission Fee</label>
                                        <div style={{ position: 'relative' }}>
                                            <IndianRupee size={14} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                                            <input type="number" min={0} className="form-input form-input-with-icon" style={{ paddingLeft: '36px' }} value={admissionFee || ''} onChange={e => setAdmissionFee(Number(e.target.value))} placeholder="e.g. 5000" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Registration Fee</label>
                                        <div style={{ position: 'relative' }}>
                                            <IndianRupee size={14} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                                            <input type="number" min={0} className="form-input form-input-with-icon" style={{ paddingLeft: '36px' }} value={registrationFee || ''} onChange={e => setRegistrationFee(Number(e.target.value))} placeholder="e.g. 2000" />
                                        </div>
                                    </div>
                                </div>

                                {/* Discounts & Scholarship */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                    <div>
                                        <label className="form-label" style={{ color: '#64748B' }}>Discount (%)</label>
                                        <input type="number" min={0} max={100} className="form-input" style={{ background: '#FFFFFF' }} value={discountPercentage || ''} onChange={e => { setDiscountPercentage(Number(e.target.value)); setDiscountAmount(0); }} placeholder="e.g. 10" />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ color: '#64748B' }}>Discount Amt (₹)</label>
                                        <input type="number" min={0} className="form-input" style={{ background: '#FFFFFF' }} value={discountAmount || ''} onChange={e => { setDiscountAmount(Number(e.target.value)); setDiscountPercentage(0); }} placeholder="e.g. 5000" disabled={discountPercentage > 0} />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ color: '#64748B' }}>Scholarship (₹)</label>
                                        <input type="number" min={0} className="form-input" style={{ background: '#FFFFFF' }} value={scholarshipAmount || ''} onChange={e => setScholarshipAmount(Number(e.target.value))} placeholder="e.g. 15000" />
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Configuration */}
                            <div className="form-section glow-card-orange" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0' }}>
                                <div className="form-section-title" style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontFamily: 'Poppins, sans-serif' }}>
                                    <Settings size={18} style={{ color: '#F59E0B' }} /> Installment & Timeline Strategy
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="form-label">Payment Mode *</label>
                                        <select className="form-input" value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)}>
                                            <option value="one_time">One-Time (Fully paid at once)</option>
                                            <option value="installment">Installment Structure</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="form-label">Academic Year *</label>
                                        <input type="text" className="form-input" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="e.g. 2026-2027" />
                                    </div>
                                </div>

                                {paymentMode === 'installment' && (
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="form-label" style={{ color: '#475569' }}>Installment Strategy</label>
                                                <select className="form-input" style={{ background: '#FFFFFF' }} value={installmentStrategy} onChange={e => setInstallmentStrategy(e.target.value as any)}>
                                                    <option value="auto_equal">Auto-Calculated Equal Dues</option>
                                                    <option value="manual_custom">Manually Customize Schedule</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ color: '#475569' }}>Installment Count (1-12)</label>
                                                <input type="number" min={1} max={12} className="form-input" style={{ background: '#FFFFFF' }} value={installmentCount} onChange={e => setInstallmentCount(Number(e.target.value))} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label className="form-label" style={{ color: '#475569' }}>Course Duration (mths)</label>
                                                <input type="number" min={1} className="form-input" style={{ background: '#FFFFFF' }} value={courseDurationMonths} onChange={e => setCourseDurationMonths(Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ color: '#475569' }}>Pref. Due Day of Mth</label>
                                                <input type="number" min={1} max={28} className="form-input" style={{ background: '#FFFFFF' }} value={preferredDueDay} onChange={e => setPreferredDueDay(Number(e.target.value))} placeholder="e.g. 5" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ color: '#475569' }}>First Due Date</label>
                                                <DatePicker
                                                    showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select"
                                                    required selected={startDate ? new Date(startDate) : null}
                                                    onChange={(date: Date | null) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                                                    dateFormat="MMMM d, yyyy" placeholderText="Select target date"
                                                />
                                            </div>
                                        </div>
                                        
                                    </div>
                                )}
                            </div>

                            {/* Remarks */}
                            <div className="form-section" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)' }}>
                                <label className="form-label" style={{ color: '#1E293B' }}>Financial Notes / Ledger Remarks</label>
                                <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. Approved special 15% batch discount..." />
                            </div>

                        </div>

                        {/* Right Summary Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'sticky', top: '24px' }}>
                            
                            {/* Financial Summary */}
                            <div className="premium-summary-card" style={{ borderRadius: '24px', padding: '28px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', margin: '0 0 20px 0', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.02em' }}>
                                    Financial Summary
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.65, fontWeight: 500 }}>Base Tuition Fee:</span>
                                        <span style={{ fontWeight: 700 }}>₹{totalFee.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.65, fontWeight: 500 }}>Admission + Reg. Fee:</span>
                                        <span style={{ fontWeight: 700 }}>+₹{(admissionFee + registrationFee).toLocaleString()}</span>
                                    </div>
                                    {calculatedDiscountAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F87171', fontWeight: 600 }}>
                                            <span style={{ opacity: 0.85 }}>Discount Applied:</span>
                                            <span>-₹{calculatedDiscountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {scholarshipAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F87171', fontWeight: 600 }}>
                                            <span style={{ opacity: 0.85 }}>Scholarship Applied:</span>
                                            <span>-₹{scholarshipAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', fontSize: '18px', alignItems: 'baseline' }}>
                                        <span style={{ opacity: 0.8, fontWeight: 700, fontSize: '15px' }}>Net Payable:</span>
                                        <span className="premium-net-payable">₹{finalFee.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Installment Grid Preview */}
                            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', margin: 0, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.01em' }}>
                                        <Eye size={16} style={{ color: '#3B82F6' }} /> Installments Timeline
                                    </h3>
                                    {paymentMode === 'installment' && installmentStrategy === 'manual_custom' && (
                                        <span style={{
                                            fontSize: '10px', padding: '4px 10px', borderRadius: '50px', fontWeight: 800,
                                            background: isCustomValid ? '#DCFCE7' : '#FEE2E2',
                                            color: isCustomValid ? '#15803D' : '#991B1B'
                                        }}>
                                            {isCustomValid ? 'SUM MATCH' : 'MISMATCH'}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {installments.map((inst, idx) => (
                                        <div key={idx} className="premium-installment-slab" style={{
                                            padding: '14px', borderRadius: '12px',
                                            display: 'grid', gridTemplateColumns: '35px 1fr 1fr', gap: '12px', alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 800, color: '#94A3B8', fontSize: '13px' }}>#{inst.installment_number}</span>
                                            
                                            {installmentStrategy === 'manual_custom' && paymentMode === 'installment' ? (
                                                <>
                                                    <input 
                                                        type="number" 
                                                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none' }}
                                                        value={inst.amount || ''}
                                                        onChange={(e) => handleManualInstallmentChange(idx, 'amount', e.target.value)}
                                                    />
                                                    <input 
                                                        type="date" 
                                                        style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none' }}
                                                        value={inst.due_date}
                                                        onChange={(e) => handleManualInstallmentChange(idx, 'due_date', e.target.value)}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>₹{inst.amount.toLocaleString()}</span>
                                                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CalendarDays size={12} style={{ color: '#94A3B8' }} /> {inst.due_date}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {paymentMode === 'installment' && installmentStrategy === 'manual_custom' && (
                                    <div style={{ marginTop: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                        <span style={{ color: '#64748B' }}>Sum: ₹{installmentsSum.toLocaleString()}</span>
                                        <span style={{ color: isCustomValid ? '#10B981' : '#EF4444' }}>Target: ₹{finalFee.toLocaleString()}</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className="btn-cancel" style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700 }} onClick={() => router.push(`/${user?.role || 'admin'}/fees`)}>Cancel</button>
                                    <button type="submit" className="btn-submit" style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }} disabled={isSubmitting || (paymentMode === 'installment' && installmentStrategy === 'manual_custom' && !isCustomValid)}>
                                        <Plus size={16} strokeWidth={2.5} /> {isSubmitting ? 'Saving...' : 'Finalize Setup'}
                                    </button>
                                </div>
                            </div>

                        </div>

                    </form>
                )}
            </div>
        </DashboardLayout>
    );
}

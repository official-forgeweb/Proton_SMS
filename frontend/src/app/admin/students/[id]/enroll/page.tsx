'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EnrollStudentPage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            Promise.all([
                api.get(`/students/${params.id}`),
                api.get('/classes'),
            ]).then(([studentRes, classesRes]) => {
                setStudent(studentRes.data.data);
                setClasses(classesRes.data.data || []);
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return toast.error('Please select a class');
        setIsSubmitting(true);
        try {
            await api.post(`/students/${params.id}/enroll`, { class_id: selectedClass });
            toast.success('Student enrolled successfully');
            router.push(`/admin/students/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableClasses = classes.filter(
        c => !student?.classes?.some((ec: any) => (ec.id || ec._id) === (c.id || c._id))
    );

    return (
        <FormPageLayout
            title="Enroll in Class"
            subtitle={student ? `Enroll ${student.first_name} ${student.last_name} in a new batch` : 'Loading...'}
            backHref={`/admin/students/${params.id}`}
            backLabel="Back to Student Profile"
            requiredRole="admin"
            icon={<GraduationCap size={20} strokeWidth={2.5} />}
        >
            {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading enrollment details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-section-title">Select Class / Batch</div>
                        <p style={{ fontSize: '14px', color: '#5E6278', marginBottom: '16px' }}>
                            Choose a class to enroll <strong>{student?.first_name}</strong> in.
                            {student?.classes?.length > 0 && ` Currently enrolled in ${student.classes.length} class(es).`}
                        </p>
                        <select required className="form-input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            <option value="">Select a batch...</option>
                            {availableClasses.map((c: any, idx: number) => (
                                <option key={c.id || c._id || `opt-${idx}`} value={c.id}>
                                    {c.class_name} | {c.subject} | {c.class_time_start}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => router.push(`/admin/students/${params.id}`)}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting || !selectedClass}>
                            {isSubmitting ? 'Processing...' : 'Assign Class'}
                        </button>
                    </div>
                </form>
            )}
        </FormPageLayout>
    );
}

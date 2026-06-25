'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Edit } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/ui/CustomSelect';
import DashboardLayout from '@/components/DashboardLayout';

export default function HETEditClient() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const role = user?.role || 'teacher';
  const isTeacher = role === 'teacher';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [het, setHet] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    description: '',
    total_marks: 10,
    passing_marks: 4,
    remarks: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (params.id) {
      fetchHetData();
    }
  }, [params.id]);

  const fetchHetData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/hets/${params.id}`);
      if (res.data.success) {
        const data = res.data.data;
        setHet(data);
        setFormData({
          title: data.title || '',
          date: data.date || new Date().toISOString().split('T')[0],
          topic: data.topic || '',
          description: data.description || '',
          total_marks: data.total_marks || 10,
          passing_marks: data.passing_marks || 4,
          remarks: data.remarks || '',
          status: data.status || 'scheduled'
        });
      }
    } catch (error) {
      console.error('Failed to fetch HET detail:', error);
      toast.error('Failed to load HET record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put(`/hets/${params.id}`, {
        ...formData,
        total_marks: Number(formData.total_marks),
        passing_marks: Number(formData.passing_marks)
      });
      if (res.data?.success) {
        toast.success('HET updated successfully');
        router.push(`/${role}/hets/${params.id}`);
      }
    } catch (error: any) {
      console.error('Error updating HET:', error);
      toast.error(error.response?.data?.message || 'Failed to update HET');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole={['admin', 'coordinator', 'teacher']}>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: '#64748B', marginTop: '16px', fontWeight: 600 }}>Loading HET Record...</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <FormPageLayout
      title="Edit HET"
      subtitle={`Modify parameters for "${formData.title}"`}
      backHref={`/${role}/hets/${params.id}`}
      backLabel="Back to Details"
      requiredRole={['admin', 'coordinator', 'teacher']}
      icon={<Edit size={20} strokeWidth={2.5} />}
    >
      <form onSubmit={handleSubmit}>
        {/* Section 1: HET Metadata */}
        <div className="form-section">
          <div className="form-section-title">
            <Edit size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
            HET Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            <div>
              <label className="form-label">Evaluation Title *</label>
              <input 
                required 
                className="form-input" 
                placeholder="e.g. Daily Math Review - Trigonometry" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            <div>
              <label className="form-label">HET Topic *</label>
              <input 
                required 
                className="form-input" 
                placeholder="e.g. Sine and Cosine Laws" 
                value={formData.topic} 
                onChange={e => setFormData({ ...formData, topic: e.target.value })} 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Targeting and Staff assignment (Read Only) */}
        <div className="form-section">
          <div className="form-section-title">Target Class, Subject & Assessor (Read Only)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label">Class</label>
              <input disabled className="form-input" value={het?.class_name || ''} style={{ background: '#E2E8F0', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label className="form-label">Academic Subject</label>
              <input disabled className="form-input" value={het?.subject_name || ''} style={{ background: '#E2E8F0', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label className="form-label">Assigned Teacher</label>
              <input disabled className="form-input" value={het?.teacher_name || ''} style={{ background: '#E2E8F0', cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        {/* Section 3: Performance, Scoring and Date parameters */}
        <div className="form-section">
          <div className="form-section-title">Evaluation Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr', gap: '20px' }}>
            <div>
              <label className="form-label">Date of Test *</label>
              <DatePicker 
                showMonthDropdown 
                showYearDropdown 
                scrollableYearDropdown 
                dropdownMode="select" 
                required 
                selected={formData.date ? new Date(formData.date) : null} 
                onChange={(date: Date | null) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })} 
                dateFormat="MMMM d, yyyy" 
                placeholderText="Select Date" 
              />
            </div>
            <div>
              <label className="form-label">Total Marks *</label>
              <input 
                type="number" 
                step="any"
                required 
                className="form-input" 
                value={formData.total_marks} 
                onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="form-label">Passing Marks *</label>
              <input 
                type="number" 
                step="any"
                required 
                className="form-input" 
                value={formData.passing_marks} 
                onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="form-label">Status *</label>
              <CustomSelect 
                value={formData.status} 
                onChange={val => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Remarks & Description */}
        <div className="form-section">
          <div className="form-section-title">Instructions & Remarks</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div>
              <label className="form-label">Instructions / Description</label>
              <textarea 
                className="form-input" 
                placeholder="Write specific guidelines, question references, or instructions..." 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ minHeight: '100px', resize: 'vertical' }}
              />
            </div>
            <div>
              <label className="form-label">Additional Remarks</label>
              <input 
                className="form-input" 
                placeholder="Internal or student-facing notes..." 
                value={formData.remarks} 
                onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => router.push(`/${role}/hets/${params.id}`)}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
}

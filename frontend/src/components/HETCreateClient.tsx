'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import ClassSubjectSelector from '@/components/ClassSubjectSelector';
import CustomSelect from '@/components/ui/CustomSelect';

export default function HETCreateClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role || 'teacher';
  const isTeacher = role === 'teacher';

  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    class_id: '',
    subject_id: '',
    teacher_id: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    description: '',
    total_marks: 10,
    passing_marks: 4,
    remarks: '',
    status: 'scheduled'
  });

  useEffect(() => {
    // Fetch classes
    api.get('/classes')
      .then(res => {
        if (res.data?.success) {
          setClasses(res.data.data || []);
        }
      })
      .catch(err => {
        console.error('Failed to load classes', err);
        toast.error('Failed to load classes');
      });

    // Fetch teachers if Admin or Coordinator
    if (!isTeacher) {
      api.get('/teachers')
        .then(res => {
          if (res.data?.success) {
            setTeachers(res.data.data || []);
          }
        })
        .catch(err => {
          console.error('Failed to load teachers', err);
        });
    } else {
      // If teacher, teacher_id is their own profile ID
      const teacherProfileId = user?.profile?.id;
      if (teacherProfileId) {
        setFormData(prev => ({ ...prev, teacher_id: teacherProfileId }));
      }
    }
  }, [role, isTeacher, user]);

  // When class changes, resolve selectedClass object
  useEffect(() => {
    if (!formData.class_id) {
      setSelectedClass(null);
      return;
    }
    const c = classes.find(item => item.id === formData.class_id);
    setSelectedClass(c || null);
  }, [formData.class_id, classes]);

  // When subject changes, try to auto-resolve teacher (only for Admin/Coordinator)
  useEffect(() => {
    if (isTeacher || !formData.subject_id || !selectedClass) return;

    // Look in the class schedule for this subject
    const scheduleMatch = selectedClass.schedule?.find(
      (s: any) => s.subject_id === formData.subject_id || s.subject === formData.subject_id
    );

    if (scheduleMatch && scheduleMatch.teacher_id) {
      setFormData(prev => ({ ...prev, teacher_id: scheduleMatch.teacher_id }));
    } else if (selectedClass.primary_teacher_id) {
      // Fallback to primary teacher
      setFormData(prev => ({ ...prev, teacher_id: selectedClass.primary_teacher_id }));
    }
  }, [formData.subject_id, selectedClass, isTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id) {
      toast.error('Please select a target class');
      return;
    }
    if (!formData.subject_id) {
      toast.error('Please select a subject');
      return;
    }
    if (!formData.teacher_id) {
      toast.error('Please assign a teacher profile');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/hets', {
        ...formData,
        total_marks: Number(formData.total_marks),
        passing_marks: Number(formData.passing_marks)
      });
      if (res.data?.success) {
        toast.success('HET created and scheduled successfully');
        router.push(`/${role}/hets`);
      }
    } catch (error: any) {
      console.error('Error creating HET:', error);
      toast.error(error.response?.data?.message || 'Failed to create HET');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPageLayout
      title="Create New HET"
      subtitle="Schedule a daily Homework Evaluation Test"
      backHref={`/${role}/hets`}
      backLabel="Back to HET Records"
      requiredRole={['admin', 'coordinator', 'teacher']}
      icon={<ClipboardList size={20} strokeWidth={2.5} />}
    >
      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic HET Metadata */}
        <div className="form-section">
          <div className="form-section-title">
            <ClipboardList size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
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

        {/* Section 2: Targeting and Staff assignment */}
        <div className="form-section">
          <div className="form-section-title">Target Class, Subject & Assessor</div>
          <div style={{ display: 'grid', gridTemplateColumns: isTeacher ? '1fr 1fr' : '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label">Target Class *</label>
              <CustomSelect 
                required 
                value={formData.class_id} 
                onChange={val => setFormData({ ...formData, class_id: val, subject_id: '' })}
                placeholder="Select Class..."
                options={classes.map(c => ({ 
                  value: c.id, 
                  label: `${c.class_name}${c.batch_type ? ` • ${c.batch_type.toUpperCase()} BATCH` : ''}` 
                }))}
              />
            </div>
            <div>
              <label className="form-label">Academic Subject *</label>
              <ClassSubjectSelector 
                classId={formData.class_id}
                value={formData.subject_id} 
                onChange={val => setFormData({ ...formData, subject_id: val })} 
                placeholder="Select Subject..."
                required
                returnId={true}
              />
            </div>
            {!isTeacher && (
              <div>
                <label className="form-label">Assigned Teacher *</label>
                <CustomSelect 
                  required 
                  value={formData.teacher_id} 
                  onChange={val => setFormData({ ...formData, teacher_id: val })}
                  placeholder="Select Teacher..."
                  options={teachers.map(t => ({ 
                    value: t.id, 
                    label: `${t.first_name || ''} ${t.last_name || ''}`.trim() 
                  }))}
                />
              </div>
            )}
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
                  { value: 'draft', label: 'Draft' }
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
          <button type="button" className="btn-cancel" onClick={() => router.push(`/${role}/hets`)}>Cancel</button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Initialize HET'}
          </button>
        </div>
      </form>
    </FormPageLayout>
  );
}

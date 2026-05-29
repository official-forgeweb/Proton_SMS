'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList } from 'lucide-react';
import SubjectSelector from '@/components/SubjectSelector';

export default function CoordinatorCreateTestPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        test_name: '', class_id: '', subject: '', test_type: 'weekly_test',
        test_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        duration_minutes: 60, total_marks: 100, passing_marks: 33,
        description: '', images: [] as string[]
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/tests', formData);
            router.push('/coordinator/tests');
        } catch (error) {
            console.error('Error creating test:', error);
            alert('Failed to create test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingImage(true);
        try {
            const sigRes = await api.get('/study-materials/signature');
            const { signature, timestamp, folder, cloudName, apiKey } = sigRes.data.data;

            if (!cloudName || !apiKey) {
                throw new Error("Missing Cloudinary configuration variables in the server.");
            }

            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', folder);
            
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

            const res = await axios.post(cloudinaryUrl, formData);
            if (res.data.secure_url) {
                setFormData(prev => ({ ...prev, images: [...prev.images, res.data.secure_url] }));
            }
        } catch (error) {
            console.error('Image upload failed', error);
            alert('Failed to upload image. Please check your Cloudinary configuration.');
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <FormPageLayout
            title="Create New Assessment"
            subtitle="Design and schedule a new test or examination"
            backHref="/coordinator/tests"
            backLabel="Back to Examinations"
            requiredRole="coordinator"
            icon={<ClipboardList size={20} strokeWidth={2.5} />}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <div className="form-section-title">
                        <ClipboardList size={16} strokeWidth={2.5} style={{ color: '#E53935' }} /> 
                        Examination Metadata
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Assessment Title *</label>
                            <input required className="form-input" placeholder="e.g. Mathematics Midterm" value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Examination Category *</label>
                            <select className="form-input" value={formData.test_type} onChange={e => setFormData({ ...formData, test_type: e.target.value })}>
                                <option value="weekly_test">📅 Weekly Assessment</option>
                                <option value="monthly_test">📊 Monthly Test</option>
                                <option value="mock_test">🧪 Mock Examination</option>
                                <option value="term_exam">🏛️ Term Exam</option>
                                <option value="final_exam">🎓 Final Semester Exam</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Target Audience & Subject</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Target Batch / Class *</label>
                            <select required className="form-input" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select Target Audience...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Academic Subject *</label>
                            <SubjectSelector 
                                value={formData.subject} 
                                onChange={val => setFormData({ ...formData, subject: val })} 
                                placeholder="Search or select subject..."
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section" style={{ border: 'none', background: 'rgba(26,29,59,0.02)', padding: '28px', borderRadius: '24px' }}>
                    <div className="form-section-title">Schedule & Scoring Parameters</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label className="form-label">Exam Date *</label>
                            <DatePicker showMonthDropdown showYearDropdown scrollableYearDropdown dropdownMode="select" required selected={formData.test_date ? new Date(formData.test_date) : null} onChange={(date: Date | null) => setFormData({ ...formData, test_date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="MMMM d, yyyy" placeholderText="Set Date" />
                        </div>
                        <div>
                            <label className="form-label">Start Time *</label>
                            <input type="time" required className="form-input" value={(formData as any).start_time || '09:00'} onChange={e => setFormData({ ...formData, start_time: e.target.value } as any)} />
                        </div>
                        <div>
                            <label className="form-label">Duration (Min) *</label>
                            <input type="number" required className="form-input" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="form-label">Max Score *</label>
                            <input type="number" required className="form-input" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="form-label">Pass Marks *</label>
                            <input type="number" required className="form-input" value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">Additional Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">Syllabus / Description</label>
                            <textarea 
                                className="form-input" 
                                placeholder="Details about the syllabus or instructions..." 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ minHeight: '100px', resize: 'vertical' }}
                            />
                        </div>
                        <div>
                            <label className="form-label">Attachments (Images)</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                disabled={uploadingImage}
                                className="form-input"
                            />
                            {uploadingImage && <span style={{ fontSize: '12px', color: '#E53935' }}>Uploading...</span>}
                            {formData.images.length > 0 && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={img} alt="attachment" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => router.push('/coordinator/tests')}>Cancel</button>
                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Initialize Test'}
                    </button>
                </div>
            </form>
        </FormPageLayout>
    );
}

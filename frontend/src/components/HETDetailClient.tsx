'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  ArrowLeft, CheckCircle, Save, Users, AlertCircle, Edit, Trash2,
  Calendar, Award, BookOpen, User, Percent, Star, CheckCircle2,
  XCircle, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function HETDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role || 'student';
  const isStudent = role === 'student';

  const [het, setHet] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, { marks: string; remarks: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchHetDetails();
    }
  }, [params.id]);

  const fetchHetDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/hets/${params.id}`);
      if (res.data.success) {
        const data = res.data.data;
        setHet(data);
        const fetchedResults = data.results || [];
        setResults(fetchedResults);

        // Initialize grades map
        const initialMap: Record<string, { marks: string; remarks: string }> = {};
        fetchedResults.forEach((r: any) => {
          initialMap[r.student_id] = {
            marks: r.marks_obtained !== null && r.marks_obtained !== undefined ? r.marks_obtained.toString() : '',
            remarks: r.remarks || ''
          };
        });
        setGradesMap(initialMap);
      }
    } catch (error) {
      console.error('Failed to load HET details:', error);
      toast.error('Failed to load HET details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, val: string) => {
    if (val === '') {
      setGradesMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], marks: '' } }));
      return;
    }

    const numeric = Number(val);
    if (isNaN(numeric)) return;

    let finalVal = val;
    if (numeric > (het?.total_marks || 10)) {
      finalVal = (het?.total_marks || 10).toString();
      toast.error(`Marks cannot exceed total marks of ${het?.total_marks}`);
    } else if (numeric < 0) {
      finalVal = '0';
    }

    setGradesMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: finalVal }
    }));
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setGradesMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: val }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number, field: 'marks' | 'remarks') => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`${field}-input-${currentIndex + 1}`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`${field}-input-${currentIndex - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const submitGrades = async () => {
    setIsSaving(true);
    try {
      const payload = {
        results: results.map(r => {
          const state = gradesMap[r.student_id];
          return {
            student_id: r.student_id,
            marks_obtained: state && state.marks !== '' ? Number(state.marks) : null,
            remarks: state?.remarks || ''
          };
        })
      };

      const res = await api.post(`/hets/${params.id}/grades`, payload);
      if (res.data.success) {
        toast.success('Grades published successfully!');
        fetchHetDetails();
      }
    } catch (error: any) {
      console.error('Failed to submit grades:', error);
      toast.error(error.response?.data?.message || 'Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this HET record and all student marks?')) return;
    try {
      const res = await api.delete(`/hets/${params.id}`);
      if (res.data.success) {
        toast.success('HET record deleted successfully');
        router.push(`/${role}/hets`);
      }
    } catch (error) {
      console.error('Failed to delete HET:', error);
      toast.error('Failed to delete HET');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole={['admin', 'coordinator', 'teacher', 'student']}>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ color: '#64748B', marginTop: '16px', fontWeight: 600 }}>Loading HET Records...</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!het) {
    return (
      <DashboardLayout requiredRole={['admin', 'coordinator', 'teacher', 'student']}>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>HET record not found</h3>
          <button 
            onClick={() => router.push(`/${role}/hets`)} 
            style={{ marginTop: '16px', background: '#E53935', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
          >
            Back to HET Management
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics (if completed)
  const isCompleted = het.status === 'completed';
  const gradedResults = results.filter(r => r.marks_obtained !== null && r.marks_obtained !== undefined);
  const totalGraded = gradedResults.length;
  
  let averageScore = 0;
  let highestScore = 0;
  let lowestScore = het.total_marks;
  let passCount = 0;

  if (totalGraded > 0) {
    let totalObtained = 0;
    gradedResults.forEach(r => {
      const marks = r.marks_obtained || 0;
      totalObtained += marks;
      if (marks > highestScore) highestScore = marks;
      if (marks < lowestScore) lowestScore = marks;
      if (marks >= het.passing_marks) passCount++;
    });
    averageScore = Math.round((totalObtained / (totalGraded * het.total_marks)) * 100);
  }

  const passPercentage = totalGraded > 0 ? Math.round((passCount / totalGraded) * 100) : 0;

  const customStyles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade {
      animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }
    .badge-comp {
      background: #ECFDF5;
      color: #059669;
      border: 1px solid #A7F3D0;
    }
    .badge-sch {
      background: #E0F2FE;
      color: #0369A1;
      border: 1px solid #BAE6FD;
    }
    .badge-draft {
      background: #F1F5F9;
      color: #475569;
      border: 1px solid #E2E8F0;
    }
    .roster-input {
      padding: 8px 12px;
      border: 1.5px solid #E2E8F0;
      background: white;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      color: #1A1D3B;
      outline: none;
      transition: all 0.2s;
      width: 100%;
    }
    .roster-input:focus {
      border-color: #E53935;
      box-shadow: 0 0 0 3px rgba(229,57,53,0.08);
    }
  `;

  return (
    <DashboardLayout requiredRole={['admin', 'coordinator', 'teacher', 'student']}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Poppins, sans-serif' }}>
        
        {/* Header Section */}
        <div className="animate-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px', animationDelay: '0ms' }}>
          <div>
            <button 
              onClick={() => router.push(`/${role}/hets`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, fontSize: '13.5px', marginBottom: '12px', padding: 0 }}
            >
              <ArrowLeft size={16} /> Back to HET List
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em' }}>
                {het.title}
              </h1>
              <span style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px',
                border: '1px solid transparent'
              }} className={het.status === 'completed' ? 'badge-comp' : het.status === 'scheduled' ? 'badge-sch' : 'badge-draft'}>
                {het.status}
              </span>
            </div>
            <p style={{ color: '#5E6278', fontSize: '14px', marginTop: '6px', fontWeight: 500 }}>
              Class: <strong style={{ color: '#1A1D3B' }}>{het.class_name}</strong> • 
              Subject: <strong style={{ color: '#1A1D3B', marginLeft: '4px' }}>{het.subject_name}</strong> • 
              Date: <strong style={{ color: '#1A1D3B', marginLeft: '4px' }}>{new Date(het.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </p>
          </div>
          
          {!isStudent && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => router.push(`/${role}/hets/${het.id}/edit`)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#1A1D3B', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8F9FD'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <Edit size={14} /> Edit HET Details
              </button>
              <button 
                onClick={handleDelete}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', border: 'none', background: '#FEF2F2', color: '#EF4444', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {isStudent ? (
          /* ==============================================================
             STUDENT VIEW: Performance Detail and Teacher Feedback
             ============================================================== */
          <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', animationDelay: '100ms' }}>
            {/* Card 1: Score & Metrics */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.02)', textAlign: 'center' }}>
              <Award size={48} color="#E53935" style={{ display: 'block', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Evaluation Result</h3>
              
              {results.length > 0 && results[0].marks_obtained !== null ? (
                <div>
                  <div style={{ fontSize: '56px', fontWeight: 900, color: '#1A1D3B', lineHeight: '1' }}>
                    {results[0].marks_obtained}
                    <span style={{ fontSize: '20px', color: '#94A3B8', fontWeight: 600 }}> / {het.total_marks}</span>
                  </div>
                  
                  {/* Pass/Fail indicator */}
                  <div style={{ marginTop: '20px' }}>
                    {results[0].marks_obtained >= het.passing_marks ? (
                      <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} /> Passed Test
                      </span>
                    ) : (
                      <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#FEF2F2', color: '#EF4444', fontWeight: 800, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={14} /> Below Passing Marks
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px', borderTop: '1px solid #F1F2F7', paddingTop: '24px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Passing Score Required</p>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: '4px 0 0 0' }}>{het.passing_marks} Marks</h4>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Percentage Gained</p>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: '4px 0 0 0' }}>
                        {Math.round(((results[0].marks_obtained || 0) / het.total_marks) * 100)}%
                      </h4>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '32px 0' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#E53935', marginBottom: '8px' }}>Not Evaluated Yet</div>
                  <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, fontWeight: 500 }}>
                    Your assessor has not uploaded grades for this test yet. Please check back later.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Feedback & Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={16} color="#E53935" /> Teacher Feedback
                </h3>
                {results.length > 0 && results[0].remarks ? (
                  <blockquote style={{ margin: 0, paddingLeft: '16px', borderLeft: '4px solid #E53935', fontStyle: 'italic', color: '#475569', fontSize: '14.5px', fontWeight: 500, lineHeight: '1.6' }}>
                    "{results[0].remarks}"
                  </blockquote>
                ) : (
                  <p style={{ fontSize: '13.5px', color: '#8F92A1', fontWeight: 500, margin: 0, fontStyle: 'italic' }}>
                    No feedback or comments added.
                  </p>
                )}
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="#E53935" /> HET Topic & Instructions
                </h3>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', margin: '0 0 6px 0' }}>{het.topic}</h4>
                <p style={{ fontSize: '13.5px', color: '#5E6278', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                  {het.description || 'No additional instructions defined for this test.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ==============================================================
             STAFF VIEW: Statistics and Bulk Grading spreadsheet roster
             ============================================================== */
          <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', animationDelay: '100ms' }}>
            
            {/* KPI Statistics */}
            {isCompleted && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '8px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', color: '#6366F1' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Enrolled / Graded</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>
                      {totalGraded} <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>/ {results.length}</span>
                    </h3>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', color: '#10B981' }}>
                    <Percent size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Class Average Score</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', margin: '2px 0 0 0' }}>{averageScore}%</h3>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(245,158,11,0.08)', borderRadius: '12px', color: '#F59E0B' }}>
                    <Star size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Highest Score</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: '2px 0 0 0' }}>
                      {highestScore} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>/ {het.total_marks}</span>
                    </h3>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(139,92,246,0.08)', borderRadius: '12px', color: '#8B5CF6' }}>
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Passing Rate</p>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>{passPercentage}%</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Roster spreadsheet */}
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #F1F2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Student Evaluation Roster</h3>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 }}>
                    Enter evaluation marks (out of <strong>{het.total_marks}</strong>, passing threshold: <strong>{het.passing_marks}</strong>)
                  </p>
                </div>
                <div>
                  <button 
                    onClick={submitGrades}
                    disabled={isSaving || results.length === 0}
                    style={{
                      background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      padding: '11px 22px', fontSize: '13.5px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      boxShadow: '0 8px 20px -6px rgba(26,29,59,0.3)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Save size={16} /> {isSaving ? 'Publishing...' : 'Publish Evaluation Scores'}
                  </button>
                </div>
              </div>

              {results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <Users size={40} style={{ color: '#A1A5B7', opacity: 0.5, marginBottom: '12px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', margin: 0 }}>No Enrolled Students</h4>
                  <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px', marginInline: 0 }}>
                    There are no active student enrollments mapped in this class.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FD', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '14px 24px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>PRO ID</th>
                        <th style={{ padding: '14px 24px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</th>
                        <th style={{ padding: '14px 24px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px' }}>Marks Obtained</th>
                        <th style={{ padding: '14px 24px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>Performance</th>
                        <th style={{ padding: '14px 24px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessor Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, index) => {
                        const student = r.student || {};
                        const state = gradesMap[r.student_id] || { marks: '', remarks: '' };
                        const marksNum = state.marks !== '' ? Number(state.marks) : null;
                        const isPass = marksNum !== null && marksNum >= het.passing_marks;

                        return (
                          <tr key={r.student_id} style={{ borderBottom: '1px solid #F1F2F7', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8F9FD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '14px 24px', fontFamily: 'monospace', fontWeight: 600, color: '#64748B', fontSize: '13px' }}>
                              {student.PRO_ID || 'N/A'}
                            </td>
                            <td style={{ padding: '14px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F2F7', color: '#E53935', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                  {(student.first_name?.[0] || '').toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B' }}>
                                  {student.first_name} {student.last_name}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 24px' }}>
                              <input 
                                id={`marks-input-${index}`}
                                className="roster-input"
                                placeholder="Ungraded"
                                value={state.marks}
                                onChange={e => handleMarksChange(r.student_id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, index, 'marks')}
                                style={{ textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '14px 24px' }}>
                              {marksNum === null ? (
                                <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  No Score
                                </span>
                              ) : isPass ? (
                                <span style={{ color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Passed
                                </span>
                              ) : (
                                <span style={{ color: '#EF4444', background: '#FEF2F2', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Failed
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px 24px' }}>
                              <input 
                                id={`remarks-input-${index}`}
                                className="roster-input"
                                placeholder="Good progress, needs review, etc..."
                                value={state.remarks}
                                onChange={e => handleRemarksChange(r.student_id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, index, 'remarks')}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

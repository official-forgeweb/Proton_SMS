'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Users, Clock, Calendar, MapPin, 
  TrendingUp, Award, AlertCircle, FileSpreadsheet, 
  Search, ArrowLeft, ChevronRight, UserCheck, 
  UserX, Percent, BarChart2, Star, ThumbsDown, 
  Activity, GraduationCap, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { customAlert, customConfirm } from '@/utils/dialog';
import { useAuthStore } from '@/stores/authStore';

interface ClassCohortClientProps {
  initialData: {
    class: any;
    students: any[];
    subject_counts: Record<string, number>;
    stats: {
      boysCount: number;
      girlsCount: number;
      averageAttendance: string;
      averageMarks: string;
      highestMarks: string;
      lowestMarks: string;
      attendanceInsights: {
        present: number;
        absent: number;
        late: number;
      };
      topPerformers: Array<{ name: string; id: string; average: string }>;
      weakPerformers: Array<{ name: string; id: string; average: string }>;
      upcomingTestsCount: number;
      recentActivity: Array<{ type: string; message: string; time: string }>;
    };
  };
}

export default function ClassCohortClient({ initialData }: ClassCohortClientProps) {
  const { class: cls, students, subject_counts, stats } = initialData;
  const { user } = useAuthStore();
  const basePath = user?.role === 'coordinator' ? '/coordinator' : '/admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'academics' | 'het'>('roster');
  const [classHets, setClassHets] = useState<any[]>([]);
  const [hetLoading, setHetLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'het' && classHets.length === 0) {
      setHetLoading(true);
      api.get('/hets', { params: { class_id: cls.id } })
        .then(res => {
          if (res.data?.success) {
            setClassHets(res.data.data || []);
          }
        })
        .catch(err => console.error('Failed to load class HETs', err))
        .finally(() => setHetLoading(false));
    }
  }, [activeTab, cls.id, classHets.length]);

  // Class cohort delete validation & hooks
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasTeacherLinked = (cls.primary_teacher_id !== null && cls.primary_teacher_id !== '') || (cls.schedule && cls.schedule.length > 0);
  const hasStudentsAssigned = students.length > 0;
  const canDelete = !hasTeacherLinked && !hasStudentsAssigned;

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete(`/classes/${cls.id}`);
      if (res.data.success) {
        await customAlert(`Class "${cls.class_name || cls.class_code}" deleted successfully.`, 'Delete Successful');
        window.location.href = `${basePath}/classes`;
      } else {
        await customAlert(res.data.message || 'Failed to delete class.', 'Error');
      }
    } catch (err: any) {
      await customAlert(err.response?.data?.message || 'Server error occurred while deleting class.', 'Error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.PRO_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.phone && student.phone.includes(searchTerm))
  );

  // CSV Export handler
  const exportToCSV = () => {
    const headers = ['PRO ID', 'Full Name', 'Gender', 'Phone', 'Enrolled Subjects'];
    const rows = students.map(s => [
      s.PRO_ID,
      `${s.first_name} ${s.last_name}`,
      s.gender || 'N/A',
      s.phone || 'N/A',
      s.enrolled_subjects?.join('; ') || 'None'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${cls.class_name.replace(/\s+/g, '_')}_Student_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalGender = stats.boysCount + stats.girlsCount || 1;
  const boyPct = Math.round((stats.boysCount / totalGender) * 100);
  const girlPct = Math.round((stats.girlsCount / totalGender) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic Slide-in Animations via Inline CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease forwards;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .tab-btn {
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 700;
          color: #64748B;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #6366F1;
          border-bottom-color: #6366F1;
        }
      `}} />

      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <Link href={`${basePath}/classes`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, textDecoration: 'none', fontSize: '14px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Classes
          </Link>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {cls.class_code}
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', marginTop: '6px' }}>{cls.class_name}</h1>
          <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px', fontWeight: 500 }}>
            {cls.subject || 'General'} • Grade: {cls.grade_level || 'N/A'} • Batch: <span style={{ textTransform: 'capitalize' }}>{cls.batch_type || 'N/A'}</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={exportToCSV}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
              border: '1px solid #E2E8F0', background: 'white', color: '#334155', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <FileSpreadsheet size={16} color="#10B981" /> Export Roster
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
              border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
          >
            <Trash2 size={16} /> Delete Class
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Card 1: Students */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: '16px', color: '#6366F1' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Enrolled Students</p>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{students.length} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>/ {cls.max_students || '50'} max</span></h3>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: '16px', color: '#10B981' }}>
            <Percent size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Average Attendance</p>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{stats.averageAttendance}%</h3>
          </div>
        </div>

        {/* Card 3: Performance */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', borderRadius: '16px', color: '#F59E0B' }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Class Average Marks</p>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{stats.averageMarks}%</h3>
          </div>
        </div>

        {/* Card 4: Upcoming Tests */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: '16px', color: '#EF4444' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: 0 }}>Upcoming Tests</p>
            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', margin: '4px 0 0 0' }}>{stats.upcomingTestsCount} Active</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '32px', alignItems: 'start' }} className="animate-fade-in-up">
        
        {/* Left Side: Cohort Profile & Insights Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Class Information */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#6366F1" /> Batch Specifications
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Room Allocation</span>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{cls.room_number || 'Room 102'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Course Fee</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{cls.course_fee ? `₹${cls.course_fee}` : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Primary Instructor</span>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{cls.teacher?.name || 'Unassigned'}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '24px', marginBottom: '12px' }}>
              Timetable Slots
            </h4>
            {cls.schedule && cls.schedule.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cls.schedule.map((slot: any, idx: number) => (
                  <div key={idx} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', borderLeft: '4px solid #6366F1' }}>
                    <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '13px', margin: 0 }}>{slot.subject}</p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {slot.time_start} - {slot.time_end}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                <p style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: 600, margin: 0 }}><Calendar size={14} color="#6366F1" /> {cls.class_days?.join(', ') || 'Mon, Wed, Fri'}</p>
                <p style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748B', marginTop: '6px', marginInline: 0 }}><Clock size={14} color="#6366F1" /> {cls.class_time_start || '17:00'} - {cls.class_time_end || '19:00'}</p>
              </div>
            )}
          </div>

          {/* Gender distribution */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#6366F1" /> Demographic Split
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
              <span style={{ color: '#3B82F6' }}>Boys: {stats.boysCount}</span>
              <span style={{ color: '#EC4899' }}>Girls: {stats.girlsCount}</span>
            </div>
            <div style={{ height: '12px', width: '100%', background: '#EC4899', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${boyPct}%`, background: '#3B82F6', height: '100%', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              <span>{boyPct}% Boys</span>
              <span>{girlPct}% Girls</span>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#EF4444" /> Live Activity Feed
            </h3>
            {stats.recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                {stats.recentActivity.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: act.type === 'test' ? '#F59E0B' : '#10B981', 
                      marginTop: '6px', flexShrink: 0 
                    }} />
                    <div>
                      <p style={{ margin: 0, color: '#1E293B', fontWeight: 600 }}>{act.message}</p>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, textAlign: 'center', padding: '16px 0' }}>No recent activities logged.</p>
            )}
          </div>

        </div>

        {/* Right Side: Roster, Attendance Insights, and Performance Sheets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: '16px' }}>
            <button 
              className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              Enrolled Students Roster ({students.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance Intelligence
            </button>
            <button 
              className={`tab-btn ${activeTab === 'academics' ? 'active' : ''}`}
              onClick={() => setActiveTab('academics')}
            >
              Academics & Performance
            </button>
            <button 
              className={`tab-btn ${activeTab === 'het' ? 'active' : ''}`}
              onClick={() => setActiveTab('het')}
            >
              HET Evaluations
            </button>
          </div>

          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' }} className="animate-fade-in-up">
              
              {/* Table search filters */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by student name or PRO ID..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  Showing {filteredStudents.length} of {students.length} students
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#F8FAFC' }}>
                      <tr>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>PRO ID</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Student details</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Demographics</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Subjects</th>
                        <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontWeight: 700, color: '#6366F1' }}>{s.PRO_ID}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2F6', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                                {s.first_name?.[0] || 'S'}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{s.first_name} {s.last_name}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{s.phone || 'No phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', textTransform: 'capitalize', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            {s.gender || 'unspecified'}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {s.enrolled_subjects?.map((sub: string) => (
                                <span key={sub} style={{ fontSize: '11px', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '3px 8px', borderRadius: '20px' }}>
                                  {sub}
                                </span>
                              ))}
                              {(!s.enrolled_subjects || s.enrolled_subjects.length === 0) && '-'}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <Link 
                              href={`${basePath}/students/${s.id}`} 
                              style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', 
                                color: '#6366F1', fontWeight: 700, fontSize: '13px', background: '#EEF2F6', padding: '6px 12px', borderRadius: '8px' 
                              }}
                            >
                              Profile <ChevronRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                  <p style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>No matching students found</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Try checking your search criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Intelligence Tab */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }} className="animate-fade-in-up">
              
              {/* Left Insight Card */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#10B981" /> Attendance Margins
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Present Ratio */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      <span>Present Records</span>
                      <span>{stats.attendanceInsights.present} ({Math.round(stats.attendanceInsights.present / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#10B981', width: `${(stats.attendanceInsights.present / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Late Ratio */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      <span>Late Submissions</span>
                      <span>{stats.attendanceInsights.late} ({Math.round(stats.attendanceInsights.late / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#F59E0B', width: `${(stats.attendanceInsights.late / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Absent Ratio */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                      <span>Absent Records</span>
                      <span>{stats.attendanceInsights.absent} ({Math.round(stats.attendanceInsights.absent / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#EF4444', width: `${(stats.attendanceInsights.absent / (stats.attendanceInsights.present + stats.attendanceInsights.absent + stats.attendanceInsights.late || 1) * 100)}%` }} />
                    </div>
                  </div>

                </div>

                <div style={{ marginTop: '24px', background: '#EFF6FF', padding: '16px', borderRadius: '16px', display: 'flex', gap: '10px' }}>
                  <AlertCircle size={18} color="#3B82F6" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: '#1E40AF', margin: 0, fontWeight: 600 }}>
                    Class overall attendance is maintaining at <strong>{stats.averageAttendance}%</strong>. Keeping class attendance above 75% is required by institute guidelines.
                  </p>
                </div>
              </div>

              {/* Right: Detailed Attendance Register Quick Navigation */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={18} color="#6366F1" /> Attendance Register
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                    Access the complete, date-specific grid representing the attendance roster of every student in this batch. Update, review and export monthly reports.
                  </p>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <Link 
                    href={`${basePath}/attendance`} 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', 
                      background: '#6366F1', color: 'white', fontWeight: 700, padding: '12px 24px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(99,102,241,0.2)' 
                    }}
                  >
                    Open Attendance Console
                  </Link>
                </div>
              </div>

            </div>
          )}

          {/* Academics & Performance Tab */}
          {activeTab === 'academics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in-up">
              
              {/* Test statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, margin: 0 }}>Highest Score</p>
                  <h2 style={{ fontSize: '32px', fontWeight: 950, color: '#10B981', margin: '8px 0 0 0' }}>{stats.highestMarks}%</h2>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, margin: 0 }}>Class Average</p>
                  <h2 style={{ fontSize: '32px', fontWeight: 950, color: '#6366F1', margin: '8px 0 0 0' }}>{stats.averageMarks}%</h2>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, margin: 0 }}>Lowest Score</p>
                  <h2 style={{ fontSize: '32px', fontWeight: 950, color: '#EF4444', margin: '8px 0 0 0' }}>{stats.lowestMarks}%</h2>
                </div>
              </div>

              {/* Performers grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* Top Performers */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} color="#F59E0B" /> Top Performers (Best of Batch)
                  </h3>
                  
                  {stats.topPerformers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.topPerformers.map((student, idx) => (
                        <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#F59E0B', width: '20px' }}>#{idx+1}</span>
                            <span style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{student.name}</span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#10B981', fontSize: '13px', background: '#D1FAE5', padding: '4px 10px', borderRadius: '20px' }}>
                            {student.average}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, textAlign: 'center', padding: '16px 0' }}>No academics recorded yet.</p>
                  )}
                </div>

                {/* Weak Performers */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ThumbsDown size={18} color="#EF4444" /> Needs Attention (Under 40%)
                  </h3>

                  {stats.weakPerformers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.weakPerformers.map((student, idx) => (
                        <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', width: '20px' }}>#{idx+1}</span>
                            <span style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{student.name}</span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '13px', background: '#FEE2E2', padding: '4px 10px', borderRadius: '20px' }}>
                            {student.average}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, textAlign: 'center', padding: '16px 0' }}>No weak performance logs.</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* HET Evaluations Tab */}
          {activeTab === 'het' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }} className="animate-fade-in-up">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#E53935" /> Homework Evaluation Tests (HET) History
              </h3>

              {hetLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : classHets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <Award size={36} style={{ opacity: 0.25, marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No HET records found</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>No daily assessments have been scheduled for this class cohort.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>HET Details</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Subject</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Assessor</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Passing Marks</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748B', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classHets.map((h) => {
                        const isComp = h.status === 'completed';
                        const isSch = h.status === 'scheduled';
                        return (
                          <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#1A1D3B' }}>{h.title}</div>
                              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Topic: {h.topic}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366F1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                                {h.subject_name}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#1A1D3B' }}>
                              {h.teacher_name}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#64748B' }}>
                              {new Date(h.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1A1D3B', fontSize: '13px' }}>
                              {h.passing_marks} <span style={{ color: '#94A3B8', fontWeight: 500 }}>/ {h.total_marks}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase',
                                background: isComp ? '#ECFDF5' : isSch ? '#E0F2FE' : '#F1F5F9',
                                color: isComp ? '#059669' : isSch ? '#0369A1' : '#64748B',
                              }}>
                                {h.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <Link 
                                href={`${basePath}/hets/${h.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
                                  color: 'white', background: '#1A1D3B', padding: '6px 12px', borderRadius: '8px',
                                  fontSize: '12.5px', fontWeight: 700
                                }}
                              >
                                Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>


      {/* Dynamic Deletion Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(9,11,17,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '90%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid #F0F0F5', display: 'flex',
            flexDirection: 'column', gap: '20px', animation: 'fadeIn var(--duration-fast) var(--ease-premium)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                background: canDelete ? '#FEF2F2' : '#FFF4E5',
                color: canDelete ? '#EF4444' : '#F97316',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {canDelete ? <Trash2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  {canDelete ? 'Delete Class Cohort' : 'Deletion Locked'}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginTop: '8px', marginInline: 0 }}>
                  {canDelete 
                    ? `Are you sure you want to delete ${cls.class_name || cls.class_code}? This action is permanent and will discard all schedules.`
                    : 'This class cannot be deleted right now because active resources are linked:'
                  }
                </p>
              </div>
            </div>

            {/* Validation warning block if cannot delete */}
            {!canDelete && (
              <div style={{ background: '#FFF9F2', border: '1px solid #FFEADA', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hasStudentsAssigned && (
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#B45309', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} /> {students.length} active students are assigned.
                  </p>
                )}
                {hasTeacherLinked && (
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#B45309', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} /> Primary instructor or timetable slots are assigned.
                  </p>
                )}
                <span style={{ fontSize: '11px', color: '#B45309', opacity: 0.85, fontWeight: 500 }}>
                  Please unassign all students and clear teacher slots to delete this class safely.
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white',
                  color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                Close
              </button>
              {canDelete && (
                <button
                  onClick={handleDeleteClass}
                  disabled={isDeleting}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#EF4444',
                    color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={e => e.currentTarget.style.background = '#EF4444'}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

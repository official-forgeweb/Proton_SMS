'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
  ClipboardList, Plus, Calendar, CheckCircle, Clock, 
  BookOpen, Award, ChevronRight, Search, Filter, 
  Trash2, Edit, Eye, AlertCircle, TrendingUp, Users, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function HETDashboardClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role || 'student';
  const isStudent = role === 'student';

  const [hets, setHets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalHets: 0,
    todayHets: 0,
    upcomingHets: 0,
    completedHets: 0,
    averagePerformance: 0,
    weakStudents: [],
    topPerformers: []
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStats();
    fetchHets();
    if (!isStudent) {
      fetchFiltersData();
    }
  }, [classFilter, subjectFilter, teacherFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/hets/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchHets = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (classFilter) params.class_id = classFilter;
      if (subjectFilter) params.subject_id = subjectFilter;
      if (teacherFilter) params.teacher_id = teacherFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/hets', { params });
      if (res.data.success) {
        setHets(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch HETs:', error);
      toast.error('Failed to load HET records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers')
      ]);
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
    } catch (error) {
      console.error('Failed to load filter metadata:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this HET and all its results?')) return;
    try {
      const res = await api.delete(`/hets/${id}`);
      if (res.data.success) {
        toast.success('HET deleted successfully');
        setHets(hets.filter(h => h.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete HET:', error);
      toast.error('Failed to delete HET');
    }
  };

  const filteredHets = hets.filter(h => 
    (h.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (h.topic || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customStyles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }
    .glass-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 32px rgba(26, 29, 59, 0.06);
      border-color: #E53935;
    }
    .bg-mesh {
      background-color: #f7f8fc;
      background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.08) 0px, transparent 50%),
                        radial-gradient(at 80% 0%, hsla(189,100%,56%,0.08) 0px, transparent 50%),
                        radial-gradient(at 0% 50%, hsla(355,100%,93%,0.08) 0px, transparent 50%);
    }
    .filter-select {
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      background: white;
      font-size: 13.5px;
      color: #1A1D3B;
      font-weight: 600;
      outline: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .filter-select:focus {
      border-color: #E53935;
    }
  `;

  return (
    <DashboardLayout requiredRole={['admin', 'coordinator', 'teacher', 'student']}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', paddingBottom: '120px' }}>
        
        {/* Header Section */}
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', animationDelay: '0ms' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                <Award size={20} strokeWidth={2.5} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                {isStudent ? 'HET Performance' : 'Homework Evaluation Test (HET)'}
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500 }}>
              {isStudent 
                ? 'Track your daily learning progress and evaluation marks' 
                : 'Rapid daily evaluation, concept assessments & classroom understanding checks'
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by topic or title..." 
                style={{ padding: '11px 16px 11px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontSize: '13.5px', width: '240px', outline: 'none', transition: 'all 0.2s', fontWeight: 600 }} 
                onFocus={e => e.target.style.borderColor = '#E53935'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            {!isStudent && (
              <button 
                onClick={() => router.push(`/${role}/hets/create`)} 
                style={{ 
                  background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                  color: 'white', border: 'none', borderRadius: '12px', 
                  padding: '11px 20px', fontSize: '13.5px', fontWeight: 700, 
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', 
                  boxShadow: '0 8px 20px -6px rgba(26,29,59,0.3)', transition: 'all 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={16} strokeWidth={2.5} /> Create HET
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px', animationDelay: '100ms' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', color: '#6366F1' }}>
              <ClipboardList size={22} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Total HETs</p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>{stats.totalHets}</h3>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', color: '#EF4444' }}>
              <Calendar size={22} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Today's HETs</p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>{stats.todayHets}</h3>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(245,158,11,0.08)', borderRadius: '12px', color: '#F59E0B' }}>
              <Clock size={22} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Upcoming Scheduled</p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>{stats.upcomingHets}</h3>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', color: '#10B981' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, margin: 0 }}>Average Score</p>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: '2px 0 0 0' }}>{stats.averagePerformance}%</h3>
            </div>
          </div>
        </div>

        {/* Filters Panel (Only visible for Staff) */}
        {!isStudent && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', animationDelay: '150ms' }}>
            <select className="filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>

            <select className="filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.canonical_name}</option>)}
            </select>

            {role !== 'teacher' && (
              <select className="filter-select" value={teacherFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                <option value="">All Teachers</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{`${t.first_name} ${t.last_name}`}</option>)}
              </select>
            )}

            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Dashboard Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: (!isStudent && stats.weakStudents?.length > 0) ? '1fr 340px' : '1fr', gap: '28px', alignItems: 'start' }}>
          
          {/* Main HETs List Card */}
          <div className="animate-fade-in glass-card" style={{ padding: '12px', animationDelay: '200ms' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: '72px', background: '#F8F9FD', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : filteredHets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', background: '#FFFFFF', borderRadius: '16px' }}>
                <ClipboardList size={48} style={{ display: 'block', margin: '0 auto 16px', color: '#A1A5B7', opacity: 0.5 }} />
                <h3 style={{ fontSize: '18px', color: '#1A1D3B', marginBottom: '6px', fontWeight: 800 }}>No HET Records Found</h3>
                <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500, margin: 0 }}>
                  There are no Homework Evaluation Tests logged under your filter criteria.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr>
                      {['HET Details', 'Class & Subject', 'Presenter / Date', 'Total Marks', 'Status', 'Actions'].map((h, i) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left', color: '#A1A5B7', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHets.map((het) => {
                      const isComp = het.status === 'completed';
                      const isSch = het.status === 'scheduled';
                      return (
                        <tr key={het.id} style={{ background: '#F8F9FD', transition: 'all 0.2s' }}>
                          <td style={{ padding: '14px 16px', borderRadius: '12px 0 0 12px' }}>
                            <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#1A1D3B' }}>{het.title}</div>
                            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>Topic: {het.topic}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1A1D3B' }}>{het.class_name}</div>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#6366F1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '2px' }}>
                              {het.subject_name}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1A1D3B' }}>{het.teacher_name}</div>
                            <div style={{ fontSize: '12px', color: '#8F92A1', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Calendar size={12} /> {new Date(het.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#1A1D3B' }}>
                            {het.passing_marks} <span style={{ color: '#A1A5B7', fontWeight: 500 }}>/ {het.total_marks}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: isComp ? '#ECFDF5' : isSch ? '#E0F2FE' : '#F1F5F9',
                              color: isComp ? '#059669' : isSch ? '#0369A1' : '#64748B',
                            }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                              {het.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => router.push(`/${role}/hets/${het.id}`)}
                                style={{ background: '#1A1D3B', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={13} /> {isStudent ? 'View' : 'Grade'}
                              </button>
                              
                              {!isStudent && (
                                <>
                                  <button
                                    onClick={() => router.push(`/${role}/hets/${het.id}/edit`)}
                                    style={{ background: 'white', color: '#1A1D3B', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(e, het.id)}
                                    style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Side panel: Analytics Insights (Only for staff) */}
          {!isStudent && stats.weakStudents?.length > 0 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animationDelay: '250ms' }}>
              {/* Weak Students list */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#EF4444" /> Attention Required (Under 40%)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.weakStudents.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#FEF2F2', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px' }}>{s.name}</div>
                        <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'monospace', fontWeight: 600 }}>{s.proId}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444', background: 'white', padding: '4px 8px', borderRadius: '8px' }}>
                        {s.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performers list */}
              {stats.topPerformers?.length > 0 && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="#F59E0B" /> Top Achievers
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.topPerformers.map((s: any) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F0FDF4', borderRadius: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px' }}>{s.name}</div>
                          <span style={{ fontSize: '11px', color: '#15803D', fontFamily: 'monospace', fontWeight: 600 }}>{s.proId}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', background: 'white', padding: '4px 8px', borderRadius: '8px' }}>
                          {s.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}

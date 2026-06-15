'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, Calendar, FileSpreadsheet, Search, Check, 
  X, AlertCircle, Save, Printer, ArrowLeft, Clock,
  BookOpen, Edit3, Sparkles
} from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

interface AttendanceRegisterClientProps {
  classes: any[];
  selectedClassId: string;
  selectedMonth: string; // YYYY-MM
  registerData: any;
  basePath?: string;
}

export default function AttendanceRegisterClient({ 
  classes, 
  selectedClassId, 
  selectedMonth,
  registerData,
  basePath = '/admin/attendance/register'
}: AttendanceRegisterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for attendance inspector modal
  const [inspectorModal, setInspectorModal] = useState<{
    isOpen: boolean;
    student: any;
    date: string;
    session: any;
    status: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Parse Year and Month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  // Generate days array for the selected month
  const numDays = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);

  const getDayName = (dayNum: number) => {
    const date = new Date(year, month - 1, dayNum);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayFullName = (dayNum: number) => {
    const date = new Date(year, month - 1, dayNum);
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Extract from registerData
  const cls = registerData?.class;
  const students = registerData?.students || [];
  const attendance = registerData?.attendance || [];
  const sessions = registerData?.sessions || [];

  // Filter students by search term
  const filteredStudents = students.filter((s: any) => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.PRO_ID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update filters in URL
  const handleClassChange = (classId: string) => {
    startTransition(() => {
      router.push(`${basePath}?class_id=${classId}&month=${selectedMonth}`);
    });
  };

  const handleMonthChange = (monthVal: string) => {
    startTransition(() => {
      router.push(`${basePath}?class_id=${selectedClassId}&month=${monthVal}`);
    });
  };

  // Find attendance and session details for cell
  const getCellData = (studentId: string, dayNum: number) => {
    const dateStr = `${selectedMonth}-${dayNum.toString().padStart(2, '0')}`;
    
    // Find sessions scheduled on this day
    const daySessions = sessions.filter((s: any) => s.date === dateStr);
    
    // Find attendance records on this day
    const records = attendance.filter((a: any) => a.student_id === studentId && a.attendance_date === dateStr);

    return {
      dateStr,
      hasSession: daySessions.length > 0,
      sessions: daySessions,
      records: records
    };
  };

  // Save cell edit
  const handleSaveAttendance = async () => {
    if (!inspectorModal || !inspectorModal.session) return;
    setIsSaving(true);
    try {
      const payload = {
        timetable_id: inspectorModal.session.id,
        date: inspectorModal.date,
        records: [
          { student_id: inspectorModal.student.id, status: inspectorModal.status }
        ]
      };

      await api.post('/attendance/mark', payload);
      toast.success('Attendance updated!');
      setInspectorModal(null);
      
      // Refresh Next.js Server Components
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Excel / CSV Export
  const handleCSVExport = () => {
    if (!cls) return;

    // Header: PRO ID, Name, 1, 2, 3, ..., 31, Attendance %
    const headers = ['PRO ID', 'Student Name', ...daysArray.map(d => `${d}`), 'Attendance %'];
    const rows = students.map((s: any) => {
      let presentCount = 0;
      let totalMarked = 0;
      
      const dayStatuses = daysArray.map(d => {
        const { records, hasSession } = getCellData(s.id, d);
        if (!hasSession) return '-';
        if (records.length === 0) return 'U'; // Unmarked
        
        const status = records[0].status;
        if (status === 'present' || status === 'late') presentCount++;
        totalMarked++;
        
        return status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'U';
      });

      const percentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;
      
      return [
        s.PRO_ID,
        `${s.first_name} ${s.last_name}`,
        ...dayStatuses,
        `${percentage}%`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: any) => e.map((val: any) => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${cls.class_name.replace(/\s+/g, '_')}_${selectedMonth}_Attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalStudents = students.length;
  const activeSessionsCount = sessions.length;
  
  const presentCount = attendance.filter((a: any) => a.status === 'present').length;
  const lateCount = attendance.filter((a: any) => a.status === 'late').length;
  const absentCount = attendance.filter((a: any) => a.status === 'absent').length;
  const totalMarked = presentCount + lateCount + absentCount;
  
  const attendancePercentage = totalMarked > 0 
    ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
    : 100;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {styleBlock}

      {/* Selector Filters Bar */}
      <div style={{ 
        background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', 
        display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1, minWidth: '300px' }}>
          
          {/* Class Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Batch</label>
            <div style={{ minWidth: '220px' }}>
              <CustomSelect
                value={selectedClassId}
                onChange={val => handleClassChange(val)}
                disabled={isPending}
                options={classes.map(c => ({ value: c.id, label: `${c.class_name} (${c.class_code})` }))}
              />
            </div>
          </div>

          {/* Month Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Period</label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => handleMonthChange(e.target.value)}
              disabled={isPending}
              style={{ padding: '11px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 700, color: '#1E293B', background: '#F8FAFC' }}
            />
          </div>

          {/* Instant search in ledger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, maxWidth: '320px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Student</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by student name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}
              />
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button 
            onClick={() => window.print()}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
              border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <Printer size={16} /> Print Sheet
          </button>
          
          <button 
            onClick={handleCSVExport}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px',
              border: 'none', background: '#10B981', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <FileSpreadsheet size={16} /> Export Excel/CSV
          </button>
        </div>
      </div>

      {/* Month Summaries Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(99,102,241,0.06)', color: '#6366F1', borderRadius: '14px' }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Active Roster</p>
            <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{totalStudents} Enrolled</h4>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.06)', color: '#10B981', borderRadius: '14px' }}>
            <Clock size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Month Scheduled Classes</p>
            <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{activeSessionsCount} Lectures</h4>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.06)', color: '#10B981', borderRadius: '14px' }}>
            <Check size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Present Rate</p>
            <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#10B981' }}>{attendancePercentage}% Present</h4>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.06)', color: '#EF4444', borderRadius: '14px' }}>
            <X size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Absent Rate</p>
            <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#EF4444' }}>{totalMarked > 0 ? Math.round((absentCount / totalMarked) * 100) : 0}% Absent</h4>
          </div>
        </div>
      </div>

      {/* Spreadsheet grid register */}
      <div style={{ 
        background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', 
        overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
      }}>
        
        {/* Ledger explanation alert */}
        <div style={{ background: '#F8FAFC', padding: '14px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Sparkles size={16} color="#6366F1" />
          <p style={{ fontSize: '12px', color: '#475569', fontWeight: 600, margin: 0 }}>
            Click on cells with scheduled sessions (indicated with an active blue dot in headers) to inspect status, edit remarks, or override marked values dynamically.
          </p>
        </div>

        {filteredStudents.length > 0 ? (
          <div style={{ overflowX: 'auto', maxHeight: '650px', position: 'relative' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
              
              {/* Sticky Columns Header */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC' }}>
                <tr>
                  {/* Sticky student header */}
                  <th style={{ 
                    position: 'sticky', left: 0, zIndex: 11, background: '#F8FAFC', 
                    padding: '16px 24px', minWidth: '240px', borderRight: '2px solid #E2E8F0', borderBottom: '2px solid #E2E8F0',
                    fontSize: '12px', textTransform: 'uppercase', color: '#64748B', textAlign: 'left'
                  }}>
                    Student Details
                  </th>
                  
                  {/* Monthly Dates Columns */}
                  {daysArray.map(d => {
                    const dateStr = `${selectedMonth}-${d.toString().padStart(2, '0')}`;
                    const hasSession = sessions.some((s: any) => s.date === dateStr);
                    const dayName = getDayName(d);
                    const isWeekend = dayName === 'Sat' || dayName === 'Sun';

                    return (
                      <th key={d} style={{ 
                        padding: '10px 14px', minWidth: '60px', textAlign: 'center', 
                        borderBottom: '2px solid #E2E8F0', borderRight: '1px solid #E2E8F0',
                        background: isWeekend ? '#F1F5F9' : '#F8FAFC', position: 'relative'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#1E293B' }}>{d}</span>
                          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{dayName}</span>
                          {hasSession && (
                            <span style={{ 
                              width: '6px', height: '6px', background: '#6366F1', 
                              borderRadius: '50%', position: 'absolute', bottom: '4px' 
                            }} title="Classes Scheduled" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                  
                  {/* Ledger Metrics column */}
                  <th style={{ 
                    padding: '16px 20px', minWidth: '90px', borderBottom: '2px solid #E2E8F0',
                    background: '#F8FAFC', fontSize: '12px', textTransform: 'uppercase', color: '#64748B', textAlign: 'center'
                  }}>
                    Month %
                  </th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody>
                {filteredStudents.map((student: any) => {
                  
                  // Compute month percentage for this student
                  let studentPresent = 0;
                  let studentTotal = 0;

                  return (
                    <tr key={student.id} style={{ background: 'white' }} className="register-row">
                      
                      {/* Sticky Student Name cell */}
                      <td style={{ 
                        position: 'sticky', left: 0, zIndex: 5, background: 'white',
                        padding: '14px 24px', borderRight: '2px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
                        boxShadow: '4px 0 8px rgba(0,0,0,0.01)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EEF2F6', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                            {student.first_name?.[0] || 'S'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1E293B', whiteSpace: 'nowrap' }}>{student.first_name} {student.last_name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>{student.PRO_ID}</p>
                          </div>
                        </div>
                      </td>

                      {/* Calendar Columns for Student */}
                      {daysArray.map(d => {
                        const { hasSession, records, dateStr } = getCellData(student.id, d);
                        
                        let cellContent = '-';
                        let cellStyle: React.CSSProperties = { color: '#CBD5E1', cursor: 'default' };
                        let record = null;

                        if (hasSession) {
                          if (records.length > 0) {
                            record = records[0];
                            const status = record.status;
                            if (status === 'present') {
                              studentPresent++;
                              studentTotal++;
                              cellContent = 'P';
                              cellStyle = { background: '#D1FAE5', color: '#065F46', fontWeight: 800 };
                            } else if (status === 'absent') {
                              studentTotal++;
                              cellContent = 'A';
                              cellStyle = { background: '#FEE2E2', color: '#991B1B', fontWeight: 800 };
                            } else if (status === 'late') {
                              studentPresent++;
                              studentTotal++;
                              cellContent = 'L';
                              cellStyle = { background: '#FEF3C7', color: '#92400E', fontWeight: 800 };
                            }
                          } else {
                            // Unmarked timetabled session
                            cellContent = '?';
                            cellStyle = { background: '#F1F5F9', color: '#64748B', fontWeight: 700 };
                          }
                          // Make active timetabled sessions clickable
                          cellStyle.cursor = 'pointer';
                          cellStyle.transition = 'all 0.15s';
                        }

                        const dayName = getDayName(d);
                        const isWeekend = dayName === 'Sat' || dayName === 'Sun';

                        return (
                          <td 
                            key={d} 
                            style={{ 
                              textAlign: 'center', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
                              padding: '10px', fontSize: '13px', 
                              background: isWeekend && !hasSession ? '#F8FAFC' : 'white',
                              ...cellStyle
                            }}
                            className={hasSession ? 'session-cell' : ''}
                            onClick={() => {
                              if (hasSession) {
                                // Open Inspector modal
                                const session = cellDataSession(dateStr);
                                setInspectorModal({
                                  isOpen: true,
                                  student,
                                  date: dateStr,
                                  session: session || { id: 'unmarked', subject: cls.subject || 'Lecture' },
                                  status: record ? record.status : 'present'
                                });
                              }
                            }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}

                      {/* Cumulative column for this student */}
                      <td style={{ 
                        padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid #E2E8F0',
                        fontSize: '13px', fontWeight: 800, color: '#1E293B', background: '#F8FAFC' 
                      }}>
                        {studentTotal > 0 ? `${Math.round((studentPresent / studentTotal) * 100)}%` : '100%'}
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        ) : (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#64748B' }}>
            <p style={{ fontWeight: 700, fontSize: '18px', margin: 0 }}>No students matching your search</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Try resetting or updating your filter query.</p>
          </div>
        )}

      </div>

      {/* Click-to-edit Inspector Modal */}
      {inspectorModal && inspectorModal.isOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          
          <div style={{ 
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px',
            border: '1px solid #E2E8F0', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: '12px' }}>
                  Attendance Override
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginTop: '6px', marginBottom: 0 }}>Inspect Attendance Cell</h3>
              </div>
              <button 
                onClick={() => setInspectorModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Profile</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 800, color: '#1E293B', fontSize: '16px' }}>{inspectorModal.student.first_name} {inspectorModal.student.last_name}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>PRO ID: {inspectorModal.student.PRO_ID}</p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Lecture</p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#6366F1" /> {getDayFullName(parseInt(inspectorModal.date.split('-')[2]))}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <BookOpen size={14} color="#6366F1" /> {inspectorModal.session?.subject} Session
                </p>
              </div>

              {/* Status Radio Buttons */}
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Attendance Status</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  
                  {/* Present */}
                  <button 
                    onClick={() => setInspectorModal(prev => prev ? { ...prev, status: 'present' } : null)}
                    style={{ 
                      padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                      background: inspectorModal.status === 'present' ? '#D1FAE5' : 'white',
                      color: inspectorModal.status === 'present' ? '#065F46' : '#64748B',
                      borderColor: inspectorModal.status === 'present' ? '#10B981' : '#E2E8F0',
                      transition: 'all 0.15s'
                    }}
                  >
                    Present
                  </button>

                  {/* Late */}
                  <button 
                    onClick={() => setInspectorModal(prev => prev ? { ...prev, status: 'late' } : null)}
                    style={{ 
                      padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                      background: inspectorModal.status === 'late' ? '#FEF3C7' : 'white',
                      color: inspectorModal.status === 'late' ? '#92400E' : '#64748B',
                      borderColor: inspectorModal.status === 'late' ? '#F59E0B' : '#E2E8F0',
                      transition: 'all 0.15s'
                    }}
                  >
                    Late
                  </button>

                  {/* Absent */}
                  <button 
                    onClick={() => setInspectorModal(prev => prev ? { ...prev, status: 'absent' } : null)}
                    style={{ 
                      padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                      background: inspectorModal.status === 'absent' ? '#FEE2E2' : 'white',
                      color: inspectorModal.status === 'absent' ? '#991B1B' : '#64748B',
                      borderColor: inspectorModal.status === 'absent' ? '#EF4444' : '#E2E8F0',
                      transition: 'all 0.15s'
                    }}
                  >
                    Absent
                  </button>

                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setInspectorModal(null)}
                style={{ padding: '10px 18px', border: '1px solid #E2E8F0', borderRadius: '10px', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSaving}
                style={{ 
                  padding: '10px 20px', border: 'none', borderRadius: '10px', background: '#6366F1', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
                }}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Override'}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );

  // Helper to find session details for inspector modal
  function cellDataSession(dateStr: string) {
    return sessions.find((s: any) => s.date === dateStr);
  }
}

// Styling classes in standard React CSS-in-JS style
const styleBlock = (
  <style dangerouslySetInnerHTML={{__html: `
    .register-row:hover {
      background: #F8FAFC !important;
    }
    .session-cell:hover {
      filter: brightness(0.96);
      transform: scale(1.05);
      z-index: 2;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      .animate-fade-in-up, .animate-fade-in-up * {
        visibility: visible;
      }
      .animate-fade-in-up {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      button, select, input {
        display: none !important;
      }
    }
  `}} />
);

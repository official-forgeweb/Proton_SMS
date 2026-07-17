/**
 * Shared Read-Only Data Access Layer
 *
 * Central place for all "read" queries used by Server Components.
 * This avoids duplicating query logic across pages and keeps all
 * database access in one auditable location.
 *
 * IMPORTANT: This module is for READ-ONLY operations.
 * All mutations (POST/PUT/DELETE) should continue to go through
 * the Express API at localhost:5001 to maintain clear separation.
 */

import prisma, { withRetry } from '@/lib/prisma';

// ──────────────────────────────────────────────
// Thread-Safe Server-Side In-Memory Cache System
// with Stale-While-Revalidate for instant page loads
// ──────────────────────────────────────────────
interface CacheEntry {
  data: any;
  expiresAt: number;   // Hard expiry — after this, must wait for fresh data
  staleAt: number;     // Soft expiry — serve stale, refresh in background
}

const memoryCache = new Map<string, CacheEntry>();
const pendingRefreshes = new Set<string>();

// Default TTLs
const DEFAULT_STALE_MS = 60_000;  // 60s — serve cached data for up to 1 min
const DEFAULT_MAX_MS = 300_000;   // 5min — hard expiry, must refetch

async function useCache<T>(key: string, ttlMs: number, fetchFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);
  
  // Case 1: Cache hit and still fresh — return immediately
  if (cached && cached.staleAt > now) {
    return cached.data as T;
  }
  
  // Case 2: Cache hit but stale (within hard expiry) — serve stale, refresh in background
  if (cached && cached.expiresAt > now) {
    // Trigger background refresh if not already in progress
    if (!pendingRefreshes.has(key)) {
      pendingRefreshes.add(key);
      fetchFn()
        .then((freshData) => {
          memoryCache.set(key, {
            data: freshData,
            staleAt: Date.now() + ttlMs,
            expiresAt: Date.now() + DEFAULT_MAX_MS,
          });
        })
        .catch((err) => {
          console.warn(`⚠️ [Cache] Background refresh failed for "${key}":`, err.message);
        })
        .finally(() => {
          pendingRefreshes.delete(key);
        });
    }
    return cached.data as T;
  }
  
  // Case 3: No cache or hard-expired — must fetch synchronously
  const freshData = await fetchFn();
  memoryCache.set(key, {
    data: freshData,
    staleAt: Date.now() + ttlMs,
    expiresAt: Date.now() + DEFAULT_MAX_MS,
  });
  
  return freshData;
}


// ──────────────────────────────────────────────
// Admin Dashboard Stats
// ──────────────────────────────────────────────

export interface AdminDashboardStats {
  students: { total: number; active: number };
  teachers: { total: number; active: number };
  classes: { total: number; active: number };
  enquiries: { total: number; new: number };
  demos: { total: number; completed: number };
  revenue: { total: number; pending: number };
  attendance: { today_present: number; today_absent: number; avg_percentage: number | string };
  tests: { upcoming: number; avg_performance: number | string };
  coordinators: { total: number; active: number };
  upcoming_installments: number;
}

export interface AdminDashboardCharts {
  performance: Array<{ name: string; Student: number; Attendance: number }>;
  gender: Array<{ name: string; value: number; fill: string }>;
  top_students: Array<{ name: string; id: string; marks: number | null; percent: string; year: number }>;
  fees: Array<{ name: string; Fees: number }>;
  students: Array<{ name: string; Students: number }>;
  attendance: Array<{ name: string; Attendance: number }>;
  enquiries: Array<{ name: string; Enquiries: number }>;
}

export interface RecentActivity {
  type: string;
  message: string;
  time: string;
}

export interface AlertInsight {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action_link?: string;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recent_activity: RecentActivity[];
  charts: AdminDashboardCharts;
  alerts: AlertInsight[];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return useCache('admin_dashboard_ssr', 60000, async () => {
    return withRetry(async () => {
      // Parallelize all queries into a single Promise.all block to optimize database throughput and reduce network roundtrips
      const [
        totalStudents, activeStudents,
        totalTeachers, activeTeachers,
        totalClasses, activeClasses,
        totalEnquiries, newEnquiries,
        totalDemos, completedDemos,
        revenueAgg, pendingAgg,
        recentStudents, recentPayments, recentEnquiries,
        upcomingTestsCount, todayPresent, todayAbsent,
        totalAttendanceCount, totalPresentCount, totalTestScore, totalTestCount,
        totalCoordinators, activeCoordinators, upcomingInstallmentsCount
      ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { academic_status: 'active' } }),
        prisma.teacher.count(),
        prisma.teacher.count({ where: { employment_status: 'active' } }),
        prisma.class.count(),
        prisma.class.count({ where: { status: 'ongoing' } }),
        prisma.enquiry.count(),
        prisma.enquiry.count({ where: { status: 'new' } }),
        prisma.demoClass.count(),
        prisma.demoClass.count({ where: { status: 'completed' } }),
        prisma.feePayment.aggregate({
          where: { payment_status: 'completed' },
          _sum: { amount_paid: true },
        }),
        prisma.studentFeeAssignment.aggregate({
          _sum: { total_pending: true },
        }),
        prisma.student.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
        prisma.feePayment.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
          include: { student: true },
        }),
        prisma.enquiry.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
        prisma.test.count({ where: { test_date: { gt: new Date().toISOString().split('T')[0] } } }),
        prisma.attendance.count({ where: { attendance_date: new Date().toISOString().split('T')[0], status: 'present' } }),
        prisma.attendance.count({ where: { attendance_date: new Date().toISOString().split('T')[0], status: 'absent' } }),
        prisma.attendance.count(),
        prisma.attendance.count({ where: { status: 'present' } }),
        prisma.testResult.aggregate({ _sum: { percentage: true } }),
        prisma.testResult.count(),
        prisma.coordinator.count(),
        prisma.coordinator.count({ where: { status: 'active' } }),
        prisma.feeInstallment.count({
          where: {
            status: { in: ['upcoming', 'due', 'overdue', 'partially_paid'] },
            is_deleted: false,
          }
        }),
      ]);

      const totalRevenue = revenueAgg._sum.amount_paid || 0;
      const totalPending = pendingAgg._sum.total_pending || 0;

      // Build recent activity feed
      const recentActivity: RecentActivity[] = [
        ...recentStudents.map(s => ({
          type: 'enrollment',
          message: `New enrollment: ${s.first_name} ${s.last_name} (${s.PRO_ID})`,
          time: s.created_at.toISOString(),
        })),
        ...recentPayments.map(p => ({
          type: 'payment',
          message: `Payment received: ₹${(p.amount_paid || 0).toLocaleString()} from ${p.student?.first_name || 'Unknown'}`,
          time: p.payment_date || p.created_at.toISOString(),
        })),
        ...recentEnquiries.map(e => ({
          type: 'enquiry',
          message: `New enquiry: ${e.student_name} - ${e.interested_course}`,
          time: e.created_at.toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      return {
        stats: {
          students: { total: totalStudents, active: activeStudents },
          teachers: { total: totalTeachers, active: activeTeachers },
          classes: { total: totalClasses, active: activeClasses },
          enquiries: { total: totalEnquiries, new: newEnquiries },
          demos: { total: totalDemos, completed: completedDemos },
          revenue: { total: totalRevenue, pending: totalPending },
          attendance: { 
            today_present: todayPresent, 
            today_absent: todayAbsent, 
            avg_percentage: totalAttendanceCount > 0 ? ((totalPresentCount / totalAttendanceCount) * 100).toFixed(1) : 0 
          },
          tests: { 
            upcoming: upcomingTestsCount, 
            avg_performance: totalTestCount > 0 ? ((totalTestScore._sum.percentage || 0) / totalTestCount).toFixed(1) : 0 
          },
          coordinators: { total: totalCoordinators, active: activeCoordinators },
          upcoming_installments: upcomingInstallmentsCount
        },
        recent_activity: recentActivity,
        charts: {
          performance: [],
          gender: [],
          top_students: [],
          fees: [],
          students: [],
          attendance: [],
          enquiries: [],
        },
        alerts: [],
      };
    });
  });
}

// ──────────────────────────────────────────────
// Teacher Dashboard
// ──────────────────────────────────────────────

export interface TeacherDashboardData {
  teacher_name: string;
  today: {
    classes: any[];
    attendance_summary: { present: number; absent: number; total: number };
  };
  classes: any[];
  stats: { total_classes: number; total_students: number; pending_evaluations: number; assigned_enquiries: number; pending_demos: number };
  enquiries: any[];
  upcoming_demos: any[];
  charts: { performance: any[]; attendance: any[] };
}

export async function getTeacherDashboardData(userId: string): Promise<TeacherDashboardData | null> {
  return useCache(`teacher_dashboard_${userId}`, 60000, async () => {
    return withRetry(async () => {
      const teacher = await prisma.teacher.findUnique({ where: { user_id: userId } });
      if (!teacher) return null;

      const myClasses = await prisma.class.findMany({
        where: {
          OR: [
            { primary_teacher_id: teacher.id },
            { schedule: { some: { teacher_id: teacher.id } } },
          ],
        },
        include: { schedule: true },
      });

      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

      const classIds = myClasses.map(c => c.id);

      const [todayTimetable, todaysAttendance, studentCountsAgg, pendingEvaluations] = await Promise.all([
        prisma.timetable.findMany({
            where: { teacher_id: teacher.id, date: today },
            include: { class_ref: true }
        }),
        prisma.attendance.findMany({ where: { attendance_date: today, class_id: { in: classIds } } }),
        prisma.studentClassEnrollment.groupBy({
          by: ['class_id'],
          where: { class_id: { in: classIds }, enrollment_status: 'active' },
          _count: true,
        }),
        prisma.testResult.count(),
      ]);

      const [myEnquiries, pendingDemos, assignedEnquiriesCount, pendingDemosCount] = await Promise.all([
        prisma.enquiry.findMany({ where: { assigned_to: userId }, take: 5 }),
        prisma.demoClass.findMany({ where: { teacher_id: teacher.id, status: 'scheduled' }, take: 5 }),
        prisma.enquiry.count({ where: { assigned_to: userId } }),
        prisma.demoClass.count({ where: { teacher_id: teacher.id, status: 'scheduled' } }),
      ]);

      const todaysClassesBase = myClasses
        .filter(c => {
          const hasLegacyDay = c.class_days?.includes(dayOfWeek);
          const hasScheduleDay = c.schedule?.some((s: any) => s.teacher_id === teacher.id && s.days?.includes(dayOfWeek));
          return hasLegacyDay || hasScheduleDay;
        })
        .map(c => {
          const mySchedule = c.schedule?.find((s: any) => s.teacher_id === teacher.id && s.days?.includes(dayOfWeek));
          return {
            ...c,
            class_time_start: mySchedule?.time_start || c.class_time_start,
            class_time_end: mySchedule?.time_end || c.class_time_end,
          };
        });

      // Merge date-specific timetable entries (override or add)
      const todaysClasses: any[] = [...todaysClassesBase];
      todayTimetable.forEach(t => {
          const existingIdx = todaysClasses.findIndex(c => c.id === t.class_id);
          if (existingIdx !== -1) {
              todaysClasses[existingIdx] = {
                  ...todaysClasses[existingIdx],
                  class_time_start: t.start_time,
                  class_time_end: t.end_time,
                  room_number: t.room || todaysClasses[existingIdx].room_number
              };
          } else if (t.class_ref) {
              // If it's a date-specific class not in the regular schedule
              todaysClasses.push({
                  ...t.class_ref,
                  class_time_start: t.start_time,
                  class_time_end: t.end_time,
                  room_number: t.room
              });
          }
      });

      const studentCountMap: Record<string, number> = {};
      studentCountsAgg.forEach(r => { studentCountMap[r.class_id] = r._count; });
      const totalStudents = Object.values(studentCountMap).reduce((sum, c) => sum + c, 0);

      const todayClassesData = todaysClasses.map(c => ({
        ...c, id: c.id,
        attendance_marked: todaysAttendance.some(a => a.class_id === c.id),
        student_count: studentCountMap[c.id] || 0,
      }));

      const myClassesData = myClasses.map(c => ({
        ...c, id: c.id,
        student_count: studentCountMap[c.id] || 0,
      }));

      // Performance trend
      const testIds = await prisma.test.findMany({ where: { class_id: { in: classIds } }, select: { id: true } });
      const testIdList = testIds.map(t => t.id);

      let performanceData: any[] = [];
      if (testIdList.length > 0) {
        const performanceAgg: any[] = await prisma.$queryRaw`
          SELECT EXTRACT(MONTH FROM created_at) as month, AVG(percentage) as "avgScore"
          FROM test_results
          WHERE test_id = ANY(${testIdList})
          GROUP BY EXTRACT(MONTH FROM created_at)
          ORDER BY month
        `;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        performanceData = monthNames.map((name, index) => {
          const perf = performanceAgg.find((p: any) => Number(p.month) === index + 1);
          return { name, value: perf ? Math.round(Number(perf.avgScore)) : 0 };
        });
      }

      // Attendance trend
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const attendanceTrendData = await prisma.attendance.findMany({
        where: { class_id: { in: classIds }, attendance_date: { gte: thirtyDaysAgo } },
        orderBy: { attendance_date: 'asc' },
      });

      const attendanceByDate: Record<string, { present: number; total: number }> = {};
      attendanceTrendData.forEach(a => {
        if (!attendanceByDate[a.attendance_date]) attendanceByDate[a.attendance_date] = { present: 0, total: 0 };
        attendanceByDate[a.attendance_date].total++;
        if (a.status === 'present') attendanceByDate[a.attendance_date].present++;
      });

      const attendanceData = Object.entries(attendanceByDate).map(([date, data]) => ({
        date: date.split('-').slice(1).join('/'),
        percentage: Math.round((data.present / data.total) * 100),
      }));

      return {
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
        today: {
          classes: todayClassesData,
          attendance_summary: {
            present: todaysAttendance.filter(a => a.status === 'present').length,
            absent: todaysAttendance.filter(a => a.status === 'absent').length,
            total: todaysAttendance.length,
          },
        },
        classes: myClassesData,
        stats: { total_classes: myClasses.length, total_students: totalStudents, pending_evaluations: pendingEvaluations, assigned_enquiries: assignedEnquiriesCount, pending_demos: pendingDemosCount },
        enquiries: myEnquiries.map(e => ({ ...e, id: e.id })),
        upcoming_demos: pendingDemos.map(d => ({ ...d, id: d.id })),
        charts: { performance: performanceData, attendance: attendanceData },
      };
    });
  });
}

// ──────────────────────────────────────────────
// Timetable (Admin view — all entries with filters)
// ──────────────────────────────────────────────

export interface TimetableFilters {
  class_id?: string;
  start_date?: string;
  end_date?: string;
}

export async function getTimetableData(filters: TimetableFilters = {}) {
  const cacheKey = `timetable_data_${filters.class_id || 'all'}_${filters.start_date || 'none'}_${filters.end_date || 'none'}`;
  return useCache(cacheKey, 30000, async () => {
    return withRetry(async () => {
      const where: any = {};
      if (filters.class_id) where.class_id = filters.class_id;
      if (filters.start_date && filters.end_date) {
        where.date = { gte: filters.start_date, lte: filters.end_date };
      }

      const [timetableRaw, classes, teachers] = await Promise.all([
        prisma.timetable.findMany({
          where,
          orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
          include: {
            class_ref: { select: { class_name: true, class_code: true } },
            teacher: { select: { first_name: true, last_name: true } },
            subject: { select: { canonical_name: true } },
          },
        }),
        prisma.class.findMany({
          where: { status: 'ongoing' },
          include: { schedule: { include: { teacher: true } } },
        }),
        prisma.teacher.findMany({
          where: { employment_status: 'active' },
          select: { id: true, first_name: true, last_name: true },
        }),
      ]);

      // Map timetable to match the API route's response format (subject as string, type field)
      const timetable = timetableRaw.map(t => ({
        ...t,
        subject: (t as any).subject?.canonical_name || '',
        type: 'class' as const,
      }));

      return { timetable, classes, teachers };
    });
  });
}

// ──────────────────────────────────────────────
// Timetable for Teacher (filtered to their entries)
// ──────────────────────────────────────────────

export async function getTeacherTimetableData(userId: string, filters: TimetableFilters = {}) {
  return withRetry(async () => {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: userId } });
    if (!teacher) return { timetable: [] };

    const where: any = { teacher_id: teacher.id };
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.start_date && filters.end_date) {
      where.date = { gte: filters.start_date, lte: filters.end_date };
    }

    const timetable = await prisma.timetable.findMany({
      where,
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
      include: {
        class_ref: { select: { class_name: true, class_code: true } },
        teacher: { select: { first_name: true, last_name: true } },
      },
    });

    return { timetable };
  });
}

// ──────────────────────────────────────────────
// Class Detail View   /admin/classes/[id]
// ──────────────────────────────────────────────

export interface ClassDetailData {
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
}

export async function getClassDetailData(classId: string): Promise<ClassDetailData | null> {
  return withRetry(async () => {
    const [cls, enrollments, subjectEnrollments, attendanceRecords, tests, recentAttendance] = await Promise.all([
      prisma.class.findUnique({
        where: { id: classId },
        include: {
          primary_teacher: true,
          schedule: { include: { teacher: true } },
        },
      }),
      prisma.studentClassEnrollment.findMany({
        where: { class_id: classId, enrollment_status: 'active' },
        include: { student: true },
      }),
      prisma.studentSubjectEnrollment.findMany({
        where: { class_id: classId, status: 'active' },
        include: { subject: true }
      }),
      prisma.attendance.findMany({
        where: { class_id: classId }
      }),
      prisma.test.findMany({
        where: { class_id: classId },
        include: { subject: true }
      }),
      prisma.attendance.findMany({
        where: { class_id: classId },
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { student: true }
      })
    ]);

    if (!cls) return null;

    const subjectCounts: Record<string, number> = {};
    subjectEnrollments.forEach((se: any) => {
      const subjectName = se.subject?.canonical_name || se.subject_id;
      subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
    });

    const students = enrollments
      .filter(e => e.student)
      .map(e => {
        const studentSubjects = subjectEnrollments
          .filter(se => se.student_id === e.student.id)
          .map(se => se.subject?.canonical_name || se.subject_id);
        return {
          ...e.student,
          id: e.student.id,
          enrolled_subjects: studentSubjects,
          enrollment: { ...e, student_id: e.student_id, student: undefined },
        };
      });

    // 1. Gender Splits
    const boysCount = students.filter(s => s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'boy').length;
    const girlsCount = students.filter(s => s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'girl').length;

    // 2. Attendance Stats

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let averageAttendance = '100.0';

    if (attendanceRecords.length > 0) {
      presentCount = attendanceRecords.filter(a => a.status === 'present').length;
      absentCount = attendanceRecords.filter(a => a.status === 'absent').length;
      lateCount = attendanceRecords.filter(a => a.status === 'late').length;
      averageAttendance = (((presentCount + lateCount) / attendanceRecords.length) * 100).toFixed(1);
    }

    // 3. Test & Performance Analytics

    let averageMarks = '0.0';
    let highestMarks = '0.0';
    let lowestMarks = '0.0';
    let topPerformers: Array<{ name: string; id: string; average: string }> = [];
    let weakPerformers: Array<{ name: string; id: string; average: string }> = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingTestsCount = tests.filter(t => t.test_date && t.test_date >= todayStr).length;

    const testIds = tests.map(t => t.id);
    const testResults = testIds.length > 0 
      ? await prisma.testResult.findMany({ where: { test_id: { in: testIds } } })
      : [];

    if (testResults.length > 0) {
      const percentages = testResults
        .filter(r => r.marks_obtained !== null && r.total_marks)
        .map(r => (r.marks_obtained! / r.total_marks!) * 100);

      if (percentages.length > 0) {
        averageMarks = (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1);
        highestMarks = Math.max(...percentages).toFixed(1);
        lowestMarks = Math.min(...percentages).toFixed(1);
      }

      // Calculate individual student averages for rankings
      const studentAverages = students.map(s => {
        const sResults = testResults.filter(r => r.student_id === s.id && r.marks_obtained !== null && r.total_marks);
        if (sResults.length === 0) return { name: `${s.first_name || 'Student'} ${s.last_name || ''}`, id: s.id, average: null };
        const avg = sResults.reduce((sum, r) => sum + (r.marks_obtained! / r.total_marks!) * 100, 0) / sResults.length;
        return { name: `${s.first_name || 'Student'} ${s.last_name || ''}`, id: s.id, average: avg };
      }).filter(item => item.average !== null);

      const sortedAverages = [...studentAverages].sort((a, b) => b.average! - a.average!);
      topPerformers = sortedAverages.slice(0, 5).map(item => ({ name: item.name, id: item.id, average: item.average!.toFixed(1) }));
      weakPerformers = [...sortedAverages].reverse().slice(0, 5).map(item => ({ name: item.name, id: item.id, average: item.average!.toFixed(1) }));
    }

    // 4. Compile Recent Activities
    const recentTests = tests.slice(-3);

    const recentActivity: any[] = [];
    recentTests.forEach(t => {
      recentActivity.push({
        type: 'test',
        message: `Test "${t.test_name || t.test_code}" (${t.subject?.canonical_name || 'General'}) scheduled.`,
        time: t.test_date || 'Recent',
      });
    });
    recentAttendance.forEach(a => {
      recentActivity.push({
        type: 'attendance',
        message: `Attendance marked ${a.status} for ${a.student?.first_name || 'Student'}.`,
        time: a.attendance_date,
      });
    });

    const teacher = cls.primary_teacher;
    return {
      class: {
        ...cls,
        id: cls.id,
        teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher.id } : null,
        primary_teacher_id: teacher?.id,
        primary_teacher: undefined,
        schedule: cls.schedule?.map((s: any) => ({
          ...s,
          teacher_id: s.teacher || s.teacher_id,
        })),
      },
      students,
      subject_counts: subjectCounts,
      stats: {
        boysCount,
        girlsCount,
        averageAttendance,
        averageMarks,
        highestMarks,
        lowestMarks,
        attendanceInsights: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
        },
        topPerformers,
        weakPerformers,
        upcomingTestsCount,
        recentActivity: recentActivity.slice(0, 6),
      }
    };
  });
}

export interface AttendanceRegisterData {
  class: any;
  students: any[];
  attendance: any[];
  sessions: any[];
}

export async function getAttendanceRegisterData(classId: string, yearMonth: string): Promise<AttendanceRegisterData | null> {
  return withRetry(async () => {
    const cls = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!cls) return null;

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: classId, enrollment_status: 'active' },
      include: { student: true }
    });

    const students = enrollments.map(e => e.student).filter(Boolean);

    const [attendance, sessions] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          class_id: classId,
          attendance_date: { startsWith: yearMonth }
        },
        include: {
          user: {
            select: {
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.timetable.findMany({
        where: {
          class_id: classId,
          date: { startsWith: yearMonth }
        },
        orderBy: { date: 'asc' }
      })
    ]);

    return {
      class: cls,
      students,
      attendance,
      sessions
    };
  });
}

// ──────────────────────────────────────────────
// Fees Page — Assignments + Stats
// ──────────────────────────────────────────────

export interface FeeStats {
  total_collected: number;
  total_pending: number;
  total_students: number;
  paid_students: number;
  partial_students: number;
  overdue_students: number;
  pending_students: number;
}

export interface FeeAssignment {
  id: string;
  student_name: string;
  pro_id: string;
  final_fee: number | null;
  total_paid: number;
  total_pending: number | null;
  payment_status: string;
  [key: string]: any;
}

export interface FeesPageData {
  stats: FeeStats;
  assignments: FeeAssignment[];
}

export async function getFeesPageData(): Promise<FeesPageData> {
  return useCache('fees_page_data', 60000, async () => {
    return withRetry(async () => {
      const [paymentAgg, feeAgg, assignments] = await Promise.all([
        prisma.feePayment.aggregate({
          where: { payment_status: 'completed' },
          _sum: { amount_paid: true },
        }),
        prisma.studentFeeAssignment.groupBy({
          by: ['payment_status'],
          _count: true,
          _sum: { total_pending: true },
        }),
        prisma.studentFeeAssignment.findMany({
          include: {
            student: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                PRO_ID: true
              }
            }
          },
        }),
      ]);

      const totalCollected = paymentAgg._sum.amount_paid || 0;
      let totalPending = 0, totalStudents = 0, paidStudents = 0, partialStudents = 0, overdueStudents = 0;

      feeAgg.forEach(g => {
        totalStudents += g._count;
        totalPending += g._sum.total_pending || 0;
        if (g.payment_status === 'paid') paidStudents = g._count;
        if (g.payment_status === 'partial') partialStudents = g._count;
        if (g.payment_status === 'overdue') overdueStudents = g._count;
      });

      const assignmentData: FeeAssignment[] = assignments.map(a => {
        const student = a.student;
        return {
          ...a,
          id: a.id,
          student_id: student?.id,
          student_name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '',
          pro_id: student?.PRO_ID || '',
          student: undefined as any,
        };
      });

      return {
        stats: {
          total_collected: totalCollected,
          total_pending: totalPending,
          total_students: totalStudents,
          paid_students: paidStudents,
          partial_students: partialStudents,
          overdue_students: overdueStudents,
          pending_students: totalStudents - paidStudents,
        },
        assignments: assignmentData,
      };
    });
  });
}

async function getStudentsList(where: any) {
  return withRetry(async () => {
    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        take: 20,
        select: {
          id: true, PRO_ID: true, first_name: true, last_name: true,
          email: true, phone: true, gender: true, academic_status: true,
          fee_assignments: {
            take: 1,
            select: { payment_status: true, final_fee: true, total_paid: true },
          },
          class_enrollments: {
            where: { enrollment_status: 'active' },
            select: {
              overall_attendance_percentage: true,
              class: { select: { id: true, class_name: true, class_code: true } },
            },
          },
          subject_enrollments: {
            where: { status: 'active' },
            select: {
              subject: { select: { canonical_name: true } },
              class_id: true,
              status: true
            },
          },
          test_results: {
            select: { percentage: true },
          },
          created_at: true,
        },
      })
    ]);

    const enrichedStudents = students.map(s => ({
      id: s.id, PRO_ID: s.PRO_ID, first_name: s.first_name, last_name: s.last_name,
      email: s.email, phone: s.phone, gender: s.gender, academic_status: s.academic_status,
      fee_status: s.fee_assignments[0]?.payment_status || 'pending',
      total_fee: s.fee_assignments[0]?.final_fee || 0,
      total_paid: s.fee_assignments[0]?.total_paid || 0,
      classes: s.class_enrollments.map((e: any) => ({
        id: e.class?.id, name: e.class?.class_name, code: e.class?.class_code,
      })),
      subjects: s.subject_enrollments.map((se: any) => ({
        subject: se.subject?.canonical_name || '', class_id: se.class_id, status: se.status,
      })),
      attendance_percentage: s.class_enrollments[0]?.overall_attendance_percentage || 0,
      avg_marks: s.test_results && s.test_results.length > 0 
        ? Math.round(s.test_results.reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / s.test_results.length)
        : 0,
      join_date: s.created_at,
    }));

    return { data: enrichedStudents, total, page: 1, limit: 20 };
  });
}

export async function getAdminStudentsData() {
  return useCache('admin_students_data', 60000, async () => {
    return withRetry(async () => {
      const [classes, studentsRes] = await Promise.all([
        prisma.class.findMany({
          select: { id: true, class_name: true, class_code: true, schedule: true }
        }),
        getStudentsList({})
      ]);
      return {
        classes,
        students: studentsRes.data,
        totalCount: studentsRes.total
      };
    });
  });
}

export async function getTeacherStudentsData(teacherUserId: string) {
  return withRetry(async () => {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: teacherUserId }, select: { id: true } });
    if (!teacher) return { students: [], totalCount: 0 };
    
    const myClasses = await prisma.class.findMany({
      where: {
        OR: [
          { primary_teacher_id: teacher.id },
          { schedule: { some: { teacher_id: teacher.id } } }
        ]
      },
      select: { id: true },
    });
    
    if (myClasses.length === 0) return { students: [], totalCount: 0 };
    
    const classIds = myClasses.map(c => c.id);
    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: { in: classIds } },
      select: { student_id: true }
    });
    
    const studentIds = enrollments.map(e => e.student_id);
    if (studentIds.length === 0) return { students: [], totalCount: 0 };

    const res = await getStudentsList({ id: { in: studentIds } });
    return { students: res.data, totalCount: res.total };
  });
}

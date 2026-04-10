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
// Admin Dashboard Stats
// ──────────────────────────────────────────────

export interface AdminDashboardStats {
  students: { total: number; active: number };
  teachers: { total: number; active: number };
  parents: { total: number };
  classes: { total: number; active: number };
  enquiries: { total: number; new: number };
  demos: { total: number; completed: number };
  revenue: { total: number; pending: number };
}

export interface AdminDashboardCharts {
  performance: Array<{ name: string; Student: number; Attendance: number }>;
  gender: Array<{ name: string; value: number; fill: string }>;
  top_students: Array<{ name: string; id: string; marks: number | null; percent: string; year: number }>;
}

export interface RecentActivity {
  type: string;
  message: string;
  time: string;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recent_activity: RecentActivity[];
  charts: AdminDashboardCharts;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return withRetry(async () => {
    const [
      totalStudents, activeStudents,
      totalTeachers, activeTeachers,
      totalClasses, activeClasses,
      totalEnquiries, newEnquiries,
      totalDemos, completedDemos,
      totalParents,
      revenueAgg, pendingAgg,
      recentStudents, recentPayments, recentEnquiries,
      genderAgg,
      topStudents,
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
      prisma.parent.count(),
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
      prisma.student.groupBy({ by: ['gender'], _count: true }),
      prisma.testResult.findMany({
        orderBy: { percentage: 'desc' },
        take: 5,
        include: { student: { select: { first_name: true, last_name: true, PRO_ID: true } } },
      }),
    ]);

    // Monthly performance and attendance (raw queries for month extraction)
    const monthlyPerformance: any[] = await prisma.$queryRaw`
      SELECT EXTRACT(MONTH FROM created_at) as month, AVG(percentage) as "avgScore"
      FROM test_results
      WHERE created_at IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `;

    const monthlyAttendance: any[] = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM TO_DATE(attendance_date, 'YYYY-MM-DD')) as month,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as "presentCount",
        COUNT(*) as "totalCount"
      FROM attendance
      WHERE attendance_date IS NOT NULL AND attendance_date != ''
      GROUP BY EXTRACT(MONTH FROM TO_DATE(attendance_date, 'YYYY-MM-DD'))
      ORDER BY month
    `;

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

    // Build chart data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = monthNames.map((name, index) => {
      const perf = monthlyPerformance.find((p: any) => Number(p.month) === index + 1);
      const att = monthlyAttendance.find((a: any) => Number(a.month) === index + 1);
      return {
        name,
        Student: perf ? Math.round(Number(perf.avgScore)) : 0,
        Attendance: att ? Math.round((Number(att.presentCount) / Number(att.totalCount)) * 100) : 0,
      };
    });

    const radialData = genderAgg.map(g => ({
      name: g.gender || 'Unknown',
      value: g._count,
      fill: g.gender === 'male' ? '#E53935' : '#F97316',
    }));

    const topStudentData = topStudents.map(s => ({
      name: s.student ? `${s.student.first_name} ${s.student.last_name}` : 'Unknown',
      id: s.student?.PRO_ID || 'N/A',
      marks: s.marks_obtained,
      percent: `${s.percentage}%`,
      year: new Date(s.created_at).getFullYear(),
    }));

    return {
      stats: {
        students: { total: totalStudents, active: activeStudents },
        teachers: { total: totalTeachers, active: activeTeachers },
        classes: { total: totalClasses, active: activeClasses },
        enquiries: { total: totalEnquiries, new: newEnquiries },
        demos: { total: totalDemos, completed: completedDemos },
        revenue: { total: totalRevenue, pending: totalPending },
        parents: { total: totalParents },
      },
      recent_activity: recentActivity,
      charts: {
        performance: chartData,
        gender: radialData,
        top_students: topStudentData,
      },
    };
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

    const [todayTimetable, todaysAttendance, studentCountsAgg, pendingEvaluations, myEnquiries, pendingDemos, assignedEnquiriesCount, pendingDemosCount] = await Promise.all([
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
    const todaysClasses = [...todaysClassesBase];
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
  return withRetry(async () => {
    const where: any = {};
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.start_date && filters.end_date) {
      where.date = { gte: filters.start_date, lte: filters.end_date };
    }

    const [timetable, classes, teachers] = await Promise.all([
      prisma.timetable.findMany({
        where,
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        include: {
          class_ref: { select: { class_name: true, class_code: true } },
          teacher: { select: { first_name: true, last_name: true } },
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

    return { timetable, classes, teachers };
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
}

export async function getClassDetailData(classId: string): Promise<ClassDetailData | null> {
  return withRetry(async () => {
    const cls: any = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        primary_teacher: true,
        schedule: { include: { teacher: true } },
      },
    });

    if (!cls) return null;

    const enrollments = await prisma.studentClassEnrollment.findMany({
      where: { class_id: cls.id, enrollment_status: 'active' },
      include: { student: true },
    });

    const subjectEnrollments = await prisma.studentSubjectEnrollment.findMany({
      where: { class_id: cls.id, status: 'active' },
    });

    const subjectCounts: Record<string, number> = {};
    subjectEnrollments.forEach((se: any) => {
      subjectCounts[se.subject] = (subjectCounts[se.subject] || 0) + 1;
    });

    const students = enrollments
      .filter(e => e.student)
      .map(e => {
        const studentSubjects = subjectEnrollments
          .filter(se => se.student_id === e.student.id)
          .map(se => se.subject);
        return {
          ...e.student,
          id: e.student.id,
          enrolled_subjects: studentSubjects,
          enrollment: { ...e, student_id: e.student_id, student: undefined },
        };
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
        include: { student: true },
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
}

async function getStudentsList(where: any) {
  return withRetry(async () => {
    const total = await prisma.student.count({ where });
    const students = await prisma.student.findMany({
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
          select: { subject: true, class_id: true, status: true },
        },
      },
    });

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
        subject: se.subject, class_id: se.class_id, status: se.status,
      })),
      attendance_percentage: s.class_enrollments[0]?.overall_attendance_percentage || 0,
    }));

    return { data: enrichedStudents, total, page: 1, limit: 20 };
  });
}

export async function getAdminStudentsData() {
  return withRetry(async () => {
    const classes = await prisma.class.findMany({
      select: { id: true, class_name: true, class_code: true, schedule: true }
    });
    const studentsRes = await getStudentsList({});
    return {
      classes,
      students: studentsRes.data,
      totalCount: studentsRes.total
    };
  });
}

export async function getTeacherStudentsData(teacherUserId: string) {
  return withRetry(async () => {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: teacherUserId }, select: { id: true } });
    if (!teacher) return { students: [], totalCount: 0 };
    
    const myClasses = await prisma.class.findMany({
      where: { primary_teacher_id: teacher.id },
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

import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// GET /api/dashboard/admin
router.get('/admin', authenticateToken, authorize('admin'), cacheMiddleware(30), async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalStudents, activeStudents,
      totalTeachers, activeTeachers,
      totalClasses, activeClasses,
      totalEnquiries, newEnquiries,
      totalDemos, completedDemos,
      totalParents,
      contacted, demoScheduled, demoCompleted, enrolled,
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
      prisma.enquiry.count({ where: { status: { in: ['contacted', 'demo_scheduled', 'demo_completed', 'enrolled'] } } }),
      prisma.enquiry.count({ where: { status: { in: ['demo_scheduled', 'demo_completed', 'enrolled'] } } }),
      prisma.enquiry.count({ where: { status: { in: ['demo_completed', 'enrolled'] } } }),
      prisma.enquiry.count({ where: { converted_to_student: true } }),
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

    // Monthly performance and attendance (use raw queries for month extraction)
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

    const recentActivity = [
      ...recentStudents.map(s => ({ type: 'enrollment', message: `New enrollment: ${s.first_name} ${s.last_name} (${s.PRO_ID})`, time: s.created_at })),
      ...recentPayments.map(p => ({ type: 'payment', message: `Payment received: ₹${(p.amount_paid || 0).toLocaleString()} from ${p.student?.first_name || 'Unknown'}`, time: p.payment_date })),
      ...recentEnquiries.map(e => ({ type: 'enquiry', message: `New enquiry: ${e.student_name} - ${e.interested_course}`, time: e.created_at })),
    ].sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime()).slice(0, 10);

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

    res.json({
      success: true,
      data: {
        stats: {
          students: { total: totalStudents, active: activeStudents },
          teachers: { total: totalTeachers, active: activeTeachers },
          classes: { total: totalClasses, active: activeClasses },
          enquiries: { total: totalEnquiries, new: newEnquiries },
          demos: { total: totalDemos, completed: completedDemos },
          revenue: { total: totalRevenue, pending: totalPending },
          parents: { total: totalParents },
        },
        funnel: {
          enquiries: totalEnquiries, contacted, demo_scheduled: demoScheduled, demo_completed: demoCompleted, enrolled,
          conversion_rate: totalEnquiries > 0 ? ((enrolled / totalEnquiries) * 100).toFixed(1) : 0,
        },
        recent_activity: recentActivity,
        charts: {
          performance: chartData,
          gender: radialData,
          top_students: topStudents.map(s => ({
            name: s.student ? `${s.student.first_name} ${s.student.last_name}` : 'Unknown',
            id: s.student?.PRO_ID || 'N/A',
            marks: s.marks_obtained,
            percent: `${s.percentage}%`,
            year: new Date(s.created_at).getFullYear(),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Dashboard admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/teacher
router.get('/teacher', authenticateToken, authorize('teacher'), cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user!.id } });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    const myClasses = await prisma.class.findMany({ where: { primary_teacher_id: teacher.id } });
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

    const todaysClasses = myClasses.filter(c => c.class_days?.includes(dayOfWeek));
    const classIds = myClasses.map(c => c.id);

    const [todaysAttendance, studentCountsAgg, pendingEvaluations, myEnquiries, pendingDemos, assignedEnquiriesCount, pendingDemosCount] = await Promise.all([
      prisma.attendance.findMany({ where: { attendance_date: today, class_id: { in: classIds } } }),
      prisma.studentClassEnrollment.groupBy({
        by: ['class_id'],
        where: { class_id: { in: classIds }, enrollment_status: 'active' },
        _count: true,
      }),
      prisma.testResult.count(),
      prisma.enquiry.findMany({ where: { assigned_to: req.user!.id }, take: 5 }),
      prisma.demoClass.findMany({ where: { teacher_id: teacher.id, status: 'scheduled' }, take: 5 }),
      prisma.enquiry.count({ where: { assigned_to: req.user!.id } }),
      prisma.demoClass.count({ where: { teacher_id: teacher.id, status: 'scheduled' } }),
    ]);

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
    const testIds = await prisma.test.findMany({
      where: { class_id: { in: classIds } },
      select: { id: true },
    });
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

    // Group by date
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

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Dashboard teacher error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/student
router.get('/student', authenticateToken, authorize('student'), cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const [enrollments, attendance, recentTests, pendingHomework, feeAssignment] = await Promise.all([
      prisma.studentClassEnrollment.findMany({
        where: { student_id: student.id, enrollment_status: 'active' },
        include: { class: true },
      }),
      prisma.attendance.findMany({ where: { student_id: student.id } }),
      prisma.testResult.findMany({
        where: { student_id: student.id },
        orderBy: { created_at: 'desc' },
        take: 3,
        include: { test: true },
      }),
      prisma.homeworkSubmission.findMany({
        where: { student_id: student.id, status: 'pending' },
        include: { homework: true },
      }),
      prisma.studentFeeAssignment.findFirst({ where: { student_id: student.id } }),
    ]);

    const classes = enrollments.map(e => e.class);
    const totalClasses = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

    const classIds = enrollments.map(e => e.class_id);
    const allTests = await prisma.test.findMany({
      where: { class_id: { in: classIds } },
      orderBy: { test_date: 'desc' },
    });

    const now = new Date();
    const completedTests = allTests.filter(t => t.status === 'completed' || t.results_published || new Date(t.test_date || '') < now);
    const upcomingTests = allTests.filter(t => t.status === 'scheduled' && new Date(t.test_date || '') > now);
    const ongoingTests = allTests.filter(t => t.status === 'ongoing' || (new Date(t.test_date || '').toDateString() === now.toDateString() && t.status !== 'completed'));

    // Performance trend
    const performanceAgg: any[] = await prisma.$queryRaw`
      SELECT EXTRACT(MONTH FROM created_at) as month, AVG(percentage) as "avgScore"
      FROM test_results
      WHERE student_id = ${student.id}
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const performanceData = monthNames.map((name, index) => {
      const perf = performanceAgg.find((p: any) => Number(p.month) === index + 1);
      return { name, value: perf ? Math.round(Number(perf.avgScore)) : 0 };
    });

    // Attendance trend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const last30DaysAttendance = await prisma.attendance.findMany({
      where: { student_id: student.id, attendance_date: { gte: thirtyDaysAgo } },
      orderBy: { attendance_date: 'asc' },
    });

    const attendanceTrend = last30DaysAttendance.map(a => ({
      date: a.attendance_date.split('-').slice(1).join('/'),
      status: a.status === 'present' || a.status === 'late' ? 1 : 0,
    }));

    res.json({
      success: true,
      data: {
        student: { ...student, id: student.id },
        classes: classes.map(c => c ? { ...c, id: c.id } : null).filter(Boolean),
        attendance: { percentage: parseFloat(String(attendancePercentage)), total: totalClasses, present: presentCount, absent: totalClasses - presentCount },
        recent_tests: recentTests.map(tr => ({ ...tr, test_name: tr.test?.test_name, test_date: tr.test?.test_date })),
        tests: { upcoming: upcomingTests, ongoing: ongoingTests, completed: completedTests },
        pending_homework: pendingHomework.map(s => ({ ...s, homework: s.homework })),
        fee: feeAssignment ? { total: feeAssignment.final_fee, paid: feeAssignment.total_paid, pending: feeAssignment.total_pending, status: feeAssignment.payment_status } : null,
        charts: { performance: performanceData, attendance: attendanceTrend },
      },
    });
  } catch (error) {
    console.error('Dashboard student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/dashboard/parent
router.get('/parent', authenticateToken, authorize('parent'), cacheMiddleware(15), async (req: Request, res: Response): Promise<void> => {
  try {
    const parent = await prisma.parent.findUnique({ where: { user_id: req.user!.id } });
    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent profile not found' });
      return;
    }

    const mappings = await prisma.parentStudentMapping.findMany({
      where: { parent_id: parent.id },
      include: { student: true },
    });
    const studentIds = mappings.map(m => m.student?.id).filter(Boolean) as string[];

    if (studentIds.length === 0) {
      res.json({ success: true, data: { parent: { ...parent, id: parent.id }, children: [] } });
      return;
    }

    const [allEnrollments, allAttendance, allRecentTests, allFeeAssignments] = await Promise.all([
      prisma.studentClassEnrollment.findMany({
        where: { student_id: { in: studentIds }, enrollment_status: 'active' },
        include: { class: true },
      }),
      prisma.attendance.findMany({ where: { student_id: { in: studentIds } } }),
      prisma.testResult.findMany({
        where: { student_id: { in: studentIds } },
        orderBy: { created_at: 'desc' },
        include: { test: true },
      }),
      prisma.studentFeeAssignment.findMany({ where: { student_id: { in: studentIds } } }),
    ]);

    // Build lookup maps
    const enrollmentMap: Record<string, any[]> = {};
    allEnrollments.forEach(e => {
      if (!enrollmentMap[e.student_id]) enrollmentMap[e.student_id] = [];
      enrollmentMap[e.student_id].push(e);
    });

    const attendanceMap: Record<string, any[]> = {};
    allAttendance.forEach(a => {
      if (!attendanceMap[a.student_id]) attendanceMap[a.student_id] = [];
      attendanceMap[a.student_id].push(a);
    });

    const testMap: Record<string, any> = {};
    allRecentTests.forEach(t => {
      if (!testMap[t.student_id]) testMap[t.student_id] = t;
    });

    const feeMap: Record<string, any> = {};
    allFeeAssignments.forEach(f => { feeMap[f.student_id] = f; });

    const children = await Promise.all(mappings.map(async m => {
      const student = m.student;
      if (!student) return null;
      const sid = student.id;

      const studentAttendance = attendanceMap[sid] || [];
      const present = studentAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const attendancePercent = studentAttendance.length > 0 ? ((present / studentAttendance.length) * 100).toFixed(1) : 0;

      const enrollment = (enrollmentMap[sid] || [])[0];
      const recentTest = testMap[sid];
      const feeAssign = feeMap[sid];

      // Performance & attendance trends per child
      const performanceAgg: any[] = await prisma.$queryRaw`
        SELECT EXTRACT(MONTH FROM created_at) as month, AVG(percentage) as "avgScore"
        FROM test_results
        WHERE student_id = ${sid}
        GROUP BY EXTRACT(MONTH FROM created_at)
        ORDER BY month
      `;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const last30DaysAttendance = await prisma.attendance.findMany({
        where: { student_id: sid, attendance_date: { gte: thirtyDaysAgo } },
        orderBy: { attendance_date: 'asc' },
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const performanceData = monthNames.map((name, index) => {
        const perf = performanceAgg.find((p: any) => Number(p.month) === index + 1);
        return { name, value: perf ? Math.round(Number(perf.avgScore)) : 0 };
      });

      const attendanceTrend = last30DaysAttendance.map(a => ({
        date: a.attendance_date.split('-').slice(1).join('/'),
        status: a.status === 'present' || a.status === 'late' ? 1 : 0,
      }));

      return {
        ...student,
        id: student.id,
        relationship: m.relationship,
        class_name: enrollment?.class?.class_name,
        attendance_percentage: parseFloat(String(attendancePercent)),
        last_test: recentTest ? { ...recentTest, test_name: recentTest.test?.test_name } : null,
        fee: feeAssign ? { total: feeAssign.final_fee, paid: feeAssign.total_paid, pending: feeAssign.total_pending, status: feeAssign.payment_status } : null,
        charts: { performance: performanceData, attendance: attendanceTrend },
      };
    }));

    res.json({ success: true, data: { parent: { ...parent, id: parent.id }, children } });
  } catch (error) {
    console.error('Dashboard parent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

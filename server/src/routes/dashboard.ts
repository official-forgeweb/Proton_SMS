import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// GET /api/dashboard/admin
router.get('/admin', authenticateToken, authorize('admin', 'coordinator'), cacheMiddleware(30), async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalStudents, activeStudents,
      totalTeachers, activeTeachers,
      totalClasses, activeClasses,
      totalEnquiries, newEnquiries,
      totalDemos, completedDemos,
      contacted, demoScheduled, demoCompleted, enrolled,
      revenueAgg, pendingAgg,
      recentStudents, recentPayments, recentEnquiries,
      genderAgg,
      topStudents,
      upcomingTestsCount,
      todayPresent,
      todayAbsent,
      totalAttendanceCount,
      totalPresentCount,
      totalTestScore,
      totalTestCount,
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
      prisma.test.count({ where: { test_date: { gt: new Date().toISOString().split('T')[0] } } }),
      prisma.attendance.count({ where: { attendance_date: new Date().toISOString().split('T')[0], status: 'present' } }),
      prisma.attendance.count({ where: { attendance_date: new Date().toISOString().split('T')[0], status: 'absent' } }),
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'present' } }),
      prisma.testResult.aggregate({ _sum: { percentage: true } }),
      prisma.testResult.count(),
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

    // Fetch dynamic monthly chart data directly from the DB
    const [payments, studentRegistrations, enquiryRegistrations] = await Promise.all([
      prisma.feePayment.findMany({
        where: { payment_status: 'completed' },
        select: { amount_paid: true, payment_date: true, created_at: true },
      }),
      prisma.student.findMany({
        select: { created_at: true },
      }),
      prisma.enquiry.findMany({
        select: { created_at: true },
      }),
    ]);

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

    // Group real dynamic chart aggregations
    const monthlyFees = monthNames.map((name, index) => {
      const total = payments
        .filter(p => {
          const date = p.payment_date ? new Date(p.payment_date) : p.created_at;
          return date.getMonth() === index && date.getFullYear() === new Date().getFullYear();
        })
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      return { name, Fees: total };
    });

    const monthlyStudents = monthNames.map((name, index) => {
      const count = studentRegistrations.filter(s => {
        const date = new Date(s.created_at);
        return date.getFullYear() < new Date().getFullYear() || 
               (date.getFullYear() === new Date().getFullYear() && date.getMonth() <= index);
      }).length;
      return { name, Students: count };
    });

    const monthlyEnquiries = monthNames.map((name, index) => {
      const count = enquiryRegistrations.filter(e => {
        const date = new Date(e.created_at);
        return date.getMonth() === index && date.getFullYear() === new Date().getFullYear();
      }).length;
      return { name, Enquiries: count };
    });

    const monthlyAttendanceData = monthNames.map((name, index) => {
      const att = monthlyAttendance.find((a: any) => Number(a.month) === index + 1);
      return {
        name,
        Attendance: att ? Math.round((Number(att.presentCount) / Number(att.totalCount)) * 100) : 0,
      };
    });

    const radialData = genderAgg.map(g => ({
      name: g.gender || 'Unknown',
      value: g._count,
      fill: g.gender === 'male' ? '#E53935' : '#F97316',
    }));

    // Generate Smart Alerts
    const alerts: any[] = [];
    
    // 1. Critical Student Attendance Alert (< 60% overall attendance)
    const lowAttendanceEnrollments = await prisma.studentClassEnrollment.findMany({
        where: {
            enrollment_status: 'active',
            overall_attendance_percentage: { lt: 60, gt: 0 }
        },
        include: {
            student: { select: { first_name: true, last_name: true, PRO_ID: true } },
            class: { select: { class_name: true, class_code: true } }
        },
        orderBy: { overall_attendance_percentage: 'asc' },
        take: 3
    });

    lowAttendanceEnrollments.forEach(e => {
        if (e.student) {
            alerts.push({
                type: 'danger',
                title: 'Critical Student Attendance',
                message: `${e.student.first_name} ${e.student.last_name || ''} (${e.student.PRO_ID}) has an attendance of ${e.overall_attendance_percentage.toFixed(1)}% in Class ${e.class.class_name || e.class.class_code}.`,
                action_link: `/admin/students/${e.student_id}`
            });
        }
    });

    // 2. Academic Failure Alert (Average score < 40%)
    const lowAverageEnrollments = await prisma.studentClassEnrollment.findMany({
        where: {
            enrollment_status: 'active',
            average_marks: { lt: 40, gt: 0 }
        },
        include: {
            student: { select: { first_name: true, last_name: true, PRO_ID: true } },
            class: { select: { class_name: true, class_code: true } }
        },
        orderBy: { average_marks: 'asc' },
        take: 3
    });

    lowAverageEnrollments.forEach(e => {
        if (e.student) {
            alerts.push({
                type: 'danger',
                title: 'Academic Failure Alert',
                message: `${e.student.first_name} ${e.student.last_name || ''} (${e.student.PRO_ID}) is failing with an average score of ${e.average_marks.toFixed(1)}% in Class ${e.class.class_name || e.class.class_code}.`,
                action_link: `/admin/students/${e.student_id}`
            });
        }
    });

    // 3. Consecutive Absences Warning (Absent for 3+ sessions)
    const recentAttendances = await prisma.attendance.findMany({
        orderBy: { attendance_date: 'desc' },
        take: 1000,
        select: {
            student_id: true,
            status: true,
            attendance_date: true,
            student: { select: { first_name: true, last_name: true, PRO_ID: true } },
            class: { select: { class_name: true, class_code: true } }
        }
    });

    const attendancesByStudent: Record<string, any[]> = {};
    recentAttendances.forEach(att => {
        if (!attendancesByStudent[att.student_id]) {
            attendancesByStudent[att.student_id] = [];
        }
        attendancesByStudent[att.student_id].push(att);
    });

    let consecutiveAbsenceCount = 0;
    for (const studentId in attendancesByStudent) {
        const records = attendancesByStudent[studentId];
        records.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
        
        let consecutiveAbsences = 0;
        for (const r of records) {
            if (r.status === 'absent') {
                consecutiveAbsences++;
            } else {
                break;
            }
        }

        if (consecutiveAbsences >= 3 && consecutiveAbsenceCount < 3) {
            const student = records[0].student;
            const cls = records[0].class;
            if (student) {
                alerts.push({
                    type: 'danger',
                    title: 'Consecutive Absences Warning',
                    message: `${student.first_name} ${student.last_name || ''} (${student.PRO_ID}) has been absent for ${consecutiveAbsences} consecutive class sessions in Class ${cls.class_name || cls.class_code}.`,
                    action_link: `/admin/students/${studentId}`
                });
                consecutiveAbsenceCount++;
            }
        }
    }

    // 4. Sudden Performance Drop (Drop of >= 20% in latest exam compared to prior)
    const recentResults = await prisma.testResult.findMany({
        orderBy: { created_at: 'desc' },
        take: 500,
        include: {
            student: { select: { first_name: true, last_name: true, PRO_ID: true } },
            test: { select: { test_name: true, subject: true, class: { select: { class_name: true, class_code: true } } } }
        }
    });

    const resultsByStudent: Record<string, any[]> = {};
    recentResults.forEach(r => {
        if (!resultsByStudent[r.student_id]) {
            resultsByStudent[r.student_id] = [];
        }
        resultsByStudent[r.student_id].push(r);
    });

    let performanceDropCount = 0;
    for (const studentId in resultsByStudent) {
        const studentResults = resultsByStudent[studentId];
        studentResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        if (studentResults.length >= 2 && performanceDropCount < 3) {
            const latest = studentResults[0];
            const previous = studentResults[1];
            
            if (latest.percentage !== null && previous.percentage !== null) {
                const drop = previous.percentage - latest.percentage;
                if (drop >= 20) {
                    const student = latest.student;
                    if (student) {
                        alerts.push({
                            type: 'warning',
                            title: 'Sudden Performance Drop',
                            message: `${student.first_name} ${student.last_name || ''} (${student.PRO_ID}) had a sudden drop of ${drop.toFixed(0)}% in their latest exam "${latest.test.test_name || 'Test'}" compared to prior.`,
                            action_link: `/admin/students/${studentId}`
                        });
                        performanceDropCount++;
                    }
                }
            }
        }
    }

    // 5. Academic Star Performer (Average score >= 90%)
    const topPerformers = await prisma.studentClassEnrollment.findMany({
        where: {
            enrollment_status: 'active',
            average_marks: { gte: 90 }
        },
        include: {
            student: { select: { first_name: true, last_name: true, PRO_ID: true } },
            class: { select: { class_name: true, class_code: true } }
        },
        orderBy: { average_marks: 'desc' },
        take: 3
    });

    topPerformers.forEach(e => {
        if (e.student) {
            alerts.push({
                type: 'success',
                title: 'Academic Star Performer',
                message: `${e.student.first_name} ${e.student.last_name || ''} (${e.student.PRO_ID}) is excelling with an average score of ${e.average_marks.toFixed(1)}% in Class ${e.class.class_name || e.class.class_code}.`,
                action_link: `/admin/students/${e.student_id}`
            });
        }
    });

    // 6. Institutional Stats Alerts
    if (totalAttendanceCount > 0 && (totalPresentCount / totalAttendanceCount) < 0.6) {
        alerts.push({
            type: 'danger',
            title: 'Critical Attendance Drop',
            message: `Overall institute attendance is below 60% today.`,
            action_link: '/admin/attendance'
        });
    }

    const pendingDemosCount = totalDemos - completedDemos;
    if (pendingDemosCount > 0) {
        alerts.push({
            type: 'warning',
            title: 'Pending Demo Classes',
            message: `There are ${pendingDemosCount} demo classes scheduled that need attention.`,
            action_link: '/admin/demos'
        });
    }

    if (totalPending > 50000) {
        alerts.push({
            type: 'danger',
            title: 'High Pending Dues',
            message: `Total pending fee collection has exceeded ₹50,000.`,
            action_link: '/admin/fees'
        });
    }

    // 7. Internal Risky Fee Behavior Alerts
    const riskyAssignments = await prisma.studentFeeAssignment.findMany({
        where: {
            risk_level: { in: ['watchlist', 'high_risk_defaulter'] }
        },
        include: {
            student: { select: { first_name: true, last_name: true, PRO_ID: true } }
        }
    });

    riskyAssignments.forEach(a => {
        if (a.student) {
            alerts.push({
                type: a.risk_level === 'high_risk_defaulter' ? 'danger' : 'warning',
                title: a.risk_level === 'high_risk_defaulter' ? 'High Risk Defaulter Flagged' : 'Watchlist Financial Notice',
                message: `${a.student.first_name} ${a.student.last_name || ''} (${a.student.PRO_ID}) has been flagged as ${a.risk_level === 'high_risk_defaulter' ? 'High Risk Defaulter' : 'Watchlist'} due to frequent due date modifications.`,
                action_link: '/admin/fees'
            });
        }
    });

    if (alerts.length === 0) {
        alerts.push({
            type: 'success',
            title: 'All Systems Nominal',
            message: 'No critical alerts or warnings at this time.'
        });
    }

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
          attendance: { 
            today_present: todayPresent, 
            today_absent: todayAbsent, 
            avg_percentage: totalAttendanceCount > 0 ? ((totalPresentCount / totalAttendanceCount) * 100).toFixed(1) : 0 
          },
          tests: { 
            upcoming: upcomingTestsCount, 
            avg_performance: totalTestCount > 0 ? ((totalTestScore._sum.percentage || 0) / totalTestCount).toFixed(1) : 0 
          }
        },
        funnel: {
          enquiries: totalEnquiries, contacted, demo_scheduled: demoScheduled, demo_completed: demoCompleted, enrolled,
          conversion_rate: totalEnquiries > 0 ? ((enrolled / totalEnquiries) * 100).toFixed(1) : 0,
        },
        recent_activity: recentActivity,
        alerts: alerts,
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
          fees: monthlyFees,
          students: monthlyStudents,
          attendance: monthlyAttendanceData,
          enquiries: monthlyEnquiries,
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

    const myClasses = await prisma.class.findMany({ 
        where: { 
            OR: [
                { primary_teacher_id: teacher.id },
                { schedule: { some: { teacher_id: teacher.id } } }
            ]
        },
        include: { schedule: true }
    });
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

    const todaysClasses = myClasses.filter(c => {
      // Check legacy class_days OR schedule days assignment
      const hasLegacyDay = c.class_days?.includes(dayOfWeek);
      const hasScheduleDay = c.schedule?.some((s: any) => s.teacher_id === teacher.id && s.days?.includes(dayOfWeek));
      return hasLegacyDay || hasScheduleDay;
    }).map(c => {
      // For today's classes, display the start time specifically from the schedule if possible
      const mySchedule = c.schedule?.find((s: any) => s.teacher_id === teacher.id && s.days?.includes(dayOfWeek));
      return {
        ...c,
        class_time_start: mySchedule?.time_start || c.class_time_start,
        class_time_end: mySchedule?.time_end || c.class_time_end
      };
    });
    
    const classIds = myClasses.map(c => c.id);

    // Get teacher-responsible tests
    const primaryClasses = await prisma.class.findMany({
      where: { primary_teacher_id: teacher.id },
      select: { id: true },
    });
    const primaryClassIds = primaryClasses.map(c => c.id);

    const schedulesForTeacher = await prisma.classSchedule.findMany({
      where: { teacher_id: teacher.id },
      select: { class_id: true, subject: true }
    });

    const teacherOrConditions: any[] = [];
    if (primaryClassIds.length > 0) {
      teacherOrConditions.push({ class_id: { in: primaryClassIds } });
    }
    schedulesForTeacher.forEach(sched => {
      if (sched.class_id && sched.subject) {
        teacherOrConditions.push({
          class_id: sched.class_id,
          subject: { equals: sched.subject, mode: 'insensitive' }
        });
      }
    });
    teacherOrConditions.push({ created_by: req.user!.id });

    const testIds = await prisma.test.findMany({
      where: { OR: teacherOrConditions },
      select: { id: true }
    });
    const testIdList = testIds.map(t => t.id);

    const [todaysAttendance, studentCountsAgg, pendingEvaluations, myEnquiries, pendingDemos, assignedEnquiriesCount, pendingDemosCount] = await Promise.all([
      prisma.attendance.findMany({ where: { attendance_date: today, class_id: { in: classIds } } }),
      prisma.studentClassEnrollment.groupBy({
        by: ['class_id'],
        where: { class_id: { in: classIds }, enrollment_status: 'active' },
        _count: true,
      }),
      prisma.testResult.count({ where: { test_id: { in: testIdList }, marks_obtained: null } }),
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

    // Performance trend using teacher-restricted testIdList
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

// GET /api/dashboard/admin/teacher-activities
router.get('/admin/teacher-activities', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacher_id, action_type, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (teacher_id) {
      where.teacher_id = teacher_id;
    }

    if (action_type) {
      where.action_type = action_type;
    }

    if (search) {
      where.OR = [
        { teacher_name: { contains: search, mode: 'insensitive' } },
        { affected_entity: { contains: search, mode: 'insensitive' } },
        { new_value: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.teacherActivityLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
        include: {
          teacher: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          }
        }
      }),
      prisma.teacherActivityLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher activities:', error);
    res.status(500).json({ success: false, message: 'Server error fetching teacher activities' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// GET /api/attendance/calendar
// Fetches personalized academic calendar: enrolled classes, attendance, and tests
router.get('/calendar', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id, start_date, end_date } = req.query as Record<string, string>;
    
    let targetStudentId = student_id;
    if (req.user!.role === 'student') {
        const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student profile not found' });
            return;
        }
        targetStudentId = student.id;
    }

    if (!targetStudentId) {
        res.status(400).json({ success: false, message: 'student_id is required' });
        return;
    }

    // 1. Get student's enrollments (Classes and specific Subjects)
    const [classEnrollments, subjectEnrollments] = await Promise.all([
        prisma.studentClassEnrollment.findMany({
            where: { student_id: targetStudentId, enrollment_status: 'active' },
            select: { class_id: true }
        }),
        prisma.studentSubjectEnrollment.findMany({
            where: { student_id: targetStudentId, status: 'active' },
            select: { class_id: true, subject: true }
        })
    ]);

    const classIds = classEnrollments.map(e => e.class_id);
    const enrolledSubjectsByClass: Record<string, string[]> = {};
    subjectEnrollments.forEach(se => {
        if (!enrolledSubjectsByClass[se.class_id]) enrolledSubjectsByClass[se.class_id] = [];
        enrolledSubjectsByClass[se.class_id].push(se.subject.trim().toLowerCase());
    });

    // 2. Fetch all timetable entries and filter by enrollment
    const allSessions = await prisma.timetable.findMany({
        where: {
            class_id: { in: classIds },
            date: { gte: start_date, lte: end_date }
        },
        include: {
            class_ref: { select: { class_name: true } },
            teacher: { select: { first_name: true, last_name: true } }
        },
        orderBy: { start_time: 'asc' }
    });

    // Filter sessions: student must be in that class AND enrolled in that specific subject
    const filteredSessions = allSessions.filter(session => {
        const enrolledSubjects = enrolledSubjectsByClass[session.class_id] || [];
        // If class has specific subject enrollments, check them. 
        // If not, allow all (some classes might be general/mandatory)
        if (enrolledSubjects.length > 0) {
            return enrolledSubjects.includes(session.subject.trim().toLowerCase());
        }
        return true; 
    });

    // 3. Fetch Tests for these classes and subjects
    const allTests = await prisma.test.findMany({
        where: {
            class_id: { in: classIds },
            test_date: { gte: start_date, lte: end_date }
        },
        include: {
            results: { where: { student_id: targetStudentId } }
        }
    });

    // Filter tests by subject enrollment too
    const filteredTests = allTests.filter(test => {
        const enrolledSubjects = enrolledSubjectsByClass[test.class_id] || [];
        if (enrolledSubjects.length > 0 && test.subject) {
            return enrolledSubjects.includes(test.subject.trim().toLowerCase());
        }
        return true;
    });

    // 4. Fetch Attendance records
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            student_id: targetStudentId,
            attendance_date: { gte: start_date, lte: end_date }
        }
    });

    // 5. Merge and Group by date
    const calendarData: Record<string, any[]> = {};

    // Group Sessions
    filteredSessions.forEach(session => {
        const date = session.date;
        if (!calendarData[date]) calendarData[date] = [];

        const attendance = attendanceRecords.find(r => r.timetable_id === session.id);

        calendarData[date].push({
            id: session.id,
            type: 'class',
            subject: session.subject,
            start_time: session.start_time,
            end_time: session.end_time,
            teacher_name: session.teacher ? `${session.teacher.first_name} ${session.teacher.last_name}` : 'N/A',
            status: attendance ? attendance.status : 'unmarked',
            attendance_id: attendance?.id || null
        });
    });

    // Group Tests
    filteredTests.forEach(test => {
        const date = test.test_date as string;
        if (!calendarData[date]) calendarData[date] = [];

        const result = test.results[0]; // We filtered results by student_id above
        
        let testStatus = 'upcoming';
        if (test.status === 'completed' || test.results_published) {
            testStatus = 'completed';
            if (test.results_published) testStatus = 'result_published';
            if (result && result.was_present === false) testStatus = 'missed';
        }

        calendarData[date].push({
            id: test.id,
            type: 'test',
            test_name: test.test_name,
            subject: test.subject,
            test_type: test.test_type,
            start_time: test.start_time,
            status: testStatus,
            score: result?.marks_obtained,
            total_marks: test.total_marks
        });
    });

    // Sort items in each date by start_time
    Object.keys(calendarData).forEach(date => {
        calendarData[date].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });

    res.json({ success: true, data: calendarData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/attendance/stats
// Calculates accurate subject-wise and overall attendance based on scheduled classes vs presents
router.get('/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { student_id } = req.query as Record<string, string>;
        let targetStudentId: string | undefined = student_id;

        if (req.user!.role === 'student') {
            const student = await prisma.student.findUnique({ where: { user_id: req.user!.id } });
            targetStudentId = student?.id;
        }

        if (!targetStudentId) {
            res.status(400).json({ success: false, message: 'student_id is required' });
            return;
        }

        // 1. Get student enrollments
        const [classEnrollments, subjectEnrollments] = await Promise.all([
            prisma.studentClassEnrollment.findMany({
                where: { student_id: targetStudentId, enrollment_status: 'active' },
                select: { class_id: true }
            }),
            prisma.studentSubjectEnrollment.findMany({
                where: { student_id: targetStudentId, status: 'active' },
                select: { class_id: true, subject: true }
            })
        ]);

        const classIds = classEnrollments.map(e => e.class_id);
        const enrolledSubjectsByClass: Record<string, string[]> = {};
        subjectEnrollments.forEach(se => {
            if (!enrolledSubjectsByClass[se.class_id]) enrolledSubjectsByClass[se.class_id] = [];
            enrolledSubjectsByClass[se.class_id].push(se.subject.trim().toLowerCase());
        });

        // 2. Fetch all PAST scheduled sessions for these classes
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const pastSessions = await prisma.timetable.findMany({
            where: {
                class_id: { in: classIds },
                date: { lte: todayStr }
            },
            orderBy: { date: 'desc' }
        });

        // Filter sessions by subject enrollment
        const validPastSessions = pastSessions.filter(session => {
            // If it's today, check time
            if (session.date === todayStr) {
                const [hours, minutes] = session.start_time.split(':').map(Number);
                const sessionTime = new Date();
                sessionTime.setHours(hours, minutes, 0, 0);
                if (sessionTime > now) return false; // Future session today
            }

            const enrolledSubjects = enrolledSubjectsByClass[session.class_id] || [];
            if (enrolledSubjects.length > 0) {
                return enrolledSubjects.includes(session.subject.trim().toLowerCase());
            }
            return true;
        });

        // 3. Fetch attendance for these sessions
        const attendanceRecords = await prisma.attendance.findMany({
            where: { student_id: targetStudentId }
        });

        // 4. Calculate Stats
        const subjectStats: Record<string, { total: number; present: number }> = {};
        let totalClasses = 0;
        let totalPresent = 0;

        validPastSessions.forEach(session => {
            const sub = session.subject || 'General';
            if (!subjectStats[sub]) subjectStats[sub] = { total: 0, present: 0 };
            
            subjectStats[sub].total++;
            totalClasses++;

            const record = attendanceRecords.find(r => r.timetable_id === session.id);
            if (record && (record.status === 'present' || record.status === 'late')) {
                subjectStats[sub].present++;
                totalPresent++;
            }
        });

        const stats = Object.entries(subjectStats).map(([subject, data]) => ({
            subject,
            total: data.total,
            present: data.present,
            percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0
        }));

        res.json({
            success: true,
            data: {
                overall: {
                    total: totalClasses,
                    present: totalPresent,
                    percentage: totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0
                },
                subjects: stats
            }
        });
    } catch (error) {
        console.error('Error calculating attendance stats:', error);
        res.status(500).json({ success: false, message: 'Server error calculating stats' });
    }
});

// POST /api/attendance/mark
// Mark attendance for a specific session
router.post('/mark', authenticateToken, authorize('admin', 'teacher'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { timetable_id, date, records } = req.body;
        
        if (!timetable_id || !records || !Array.isArray(records)) {
            res.status(400).json({ success: false, message: 'timetable_id and records array required' });
            return;
        }

        const session = await prisma.timetable.findUnique({
            where: { id: timetable_id }
        });

        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }

        const savedRecords = [];
        for (const rec of records) {
            // Find existing record for this specific session
            const existing = await prisma.attendance.findFirst({
                where: {
                    student_id: rec.student_id,
                    timetable_id: timetable_id
                }
            });

            if (existing) {
                const updated = await prisma.attendance.update({
                    where: { id: existing.id },
                    data: { 
                        status: rec.status,
                        marked_by: req.user!.id,
                        attendance_date: date || session.date
                    }
                });
                savedRecords.push(updated);
            } else {
                const created = await prisma.attendance.create({
                    data: {
                        student_id: rec.student_id,
                        class_id: session.class_id,
                        timetable_id: timetable_id,
                        subject: session.subject,
                        attendance_date: date || session.date,
                        status: rec.status,
                        marked_by: req.user!.id
                    }
                });
                savedRecords.push(created);
            }
        }

        if (req.user!.role === 'teacher' || req.user!.role === 'coordinator') {
            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            for (const rec of records) {
                if (rec.status === 'present') presentCount++;
                else if (rec.status === 'absent') absentCount++;
                else if (rec.status === 'late') lateCount++;
            }

            const classInfo = await prisma.class.findUnique({
                where: { id: session.class_id },
                select: { class_name: true }
            });

            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(
                req.user!.id,
                'attendance_mark',
                null,
                JSON.stringify({
                    timetable_id,
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    total: records.length
                }),
                `Attendance for ${classInfo?.class_name || 'Class'} on ${date || session.date} (Subject: ${session.subject})`,
                req
            );
        }
 
        res.json({ success: true, message: `Attendance marked for ${savedRecords.length} students`, data: savedRecords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error marking attendance' });
    }
});

// GET /api/attendance/session/:timetable_id
// Fetches students and their attendance status for a specific session, filtered by subject enrollment
router.get('/session/:timetable_id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { timetable_id } = req.params as { timetable_id: string };
        const session = await prisma.timetable.findUnique({
            where: { id: timetable_id },
            include: { class_ref: true }
        });

        if (!session) {
            res.status(404).json({ success: false, message: 'Session not found' });
            return;
        }

        // 1. Get all students enrolled in the class
        const classEnrollments = await prisma.studentClassEnrollment.findMany({
            where: { class_id: session.class_id, enrollment_status: 'active' },
            include: { student: true }
        });

        // 2. Get students specifically enrolled in this subject (if applicable)
        const subjectEnrollments = await prisma.studentSubjectEnrollment.findMany({
            where: { 
                class_id: session.class_id, 
                subject: { equals: session.subject, mode: 'insensitive' },
                status: 'active'
            },
            select: { student_id: true }
        });

        const enrolledInSubjectIds = new Set(subjectEnrollments.map(se => se.student_id));

        // 3. Filter class students by subject enrollment
        // If there are specific subject enrollments, filter by them.
        // If no subject enrollments exist yet for this class/subject, show all class students (fallback)
        let filteredEnrollments = classEnrollments;
        if (enrolledInSubjectIds.size > 0) {
            filteredEnrollments = classEnrollments.filter(e => enrolledInSubjectIds.has(e.student_id));
        }

        const attendance = await prisma.attendance.findMany({
            where: { timetable_id }
        });

        const students = filteredEnrollments.map(e => {
            const att = attendance.find(a => a.student_id === e.student_id);
            return {
                id: e.student.id,
                first_name: e.student.first_name,
                last_name: e.student.last_name,
                PRO_ID: e.student.PRO_ID,
                status: att ? att.status : 'unmarked',
                attendance_id: att?.id || null
            };
        });

        res.json({ success: true, data: { session, students } });
    } catch (error) {
        console.error('Error fetching session students:', error);
        res.status(500).json({ success: false, message: 'Server error fetching session data' });
    }
});

export default router;

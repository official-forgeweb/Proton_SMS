/**
 * Teacher Timetable — Server Component
 */

import { requireRole } from '@/lib/sharedAuth';
import { getTeacherTimetableData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import TeacherTimetableClient from './TeacherTimetableClient';
import TeacherTimetableFallbackClient from './TeacherTimetableFallbackClient';
import prisma from '@/lib/prisma'; // Only read

export const dynamic = 'force-dynamic';

export default async function TeacherTimetablePage() {
    const session = await requireRole('teacher');

    // Calculate current Monday to Sunday to match client getWeekDates
    const getWeekDatesOnServer = (refDate: Date) => {
        const d = new Date(refDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(monday);
            dt.setDate(monday.getDate() + i);
            dates.push(dt);
        }
        return dates;
    };

    const formatDateStr = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const weekDates = getWeekDatesOnServer(new Date());
    const initialFilters = {
        start_date: formatDateStr(weekDates[0]),
        end_date: formatDateStr(weekDates[6])
    };

    if (!session) {
        return (
            <DashboardLayout requiredRole="teacher">
                <TeacherTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }

    try {
        const { timetable } = await getTeacherTimetableData(session.userId, initialFilters);
        
        // We also need the classes that this teacher is authorized to schedule for (or all active classes if permitted)
        // Let's just fetch classes where they are primary_teacher or in schedule.
        const teacherProfile = await prisma.teacher.findUnique({
            where: { user_id: session.userId }
        });

        let classes: any[] = [];
        if (teacherProfile) {
            classes = await prisma.class.findMany({
                where: {
                    status: 'ongoing',
                    OR: [
                        { primary_teacher_id: teacherProfile.id },
                        { schedule: { some: { teacher_id: teacherProfile.id } } }
                    ]
                },
                include: { schedule: { include: { teacher: true } } }
            });
        }

        return (
            <DashboardLayout requiredRole="teacher">
                <TeacherTimetableClient 
                    initialTimetable={timetable} 
                    initialClasses={classes} 
                    initialFilters={initialFilters}
                    teacherProfile={teacherProfile}
                />
            </DashboardLayout>
        );
    } catch (error) {
        console.error('[TeacherTimetable] Database query failed:', error);
        return (
            <DashboardLayout requiredRole="teacher">
                <TeacherTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }
}

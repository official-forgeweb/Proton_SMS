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

    const initialFilters = {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

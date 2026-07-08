import { requireRole } from '@/lib/sharedAuth';
import { getTimetableData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminTimetableClient from '@/app/admin/timetable/AdminTimetableClient';
import AdminTimetableFallbackClient from '@/app/admin/timetable/AdminTimetableFallbackClient';

export const dynamic = 'force-dynamic';

export default async function CoordinatorTimetablePage() {
    // Authenticate with roles allowed to view timetable
    const session = await requireRole(['coordinator', 'admin']);

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
            <DashboardLayout requiredRole="coordinator">
                <AdminTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }

    try {
        const { timetable, classes, teachers } = await getTimetableData(initialFilters);

        return (
            <DashboardLayout requiredRole="coordinator">
                <AdminTimetableClient 
                    initialTimetable={timetable} 
                    initialClasses={classes} 
                    initialTeachers={teachers} 
                    initialFilters={initialFilters} 
                />
            </DashboardLayout>
        );
    } catch (error) {
        console.error('[CoordinatorTimetable] Database query failed:', error);
        return (
            <DashboardLayout requiredRole="coordinator">
                <AdminTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }
}

/**
 * Admin Timetable — Server Component
 */

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getTimetableData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import AdminTimetableClient from './AdminTimetableClient';

export const dynamic = 'force-dynamic';

export default async function AdminTimetablePage() {
    const session = await requireRole('admin');

    // Default filters the client also uses
    const initialFilters = {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    if (!session) {
        return (
            <DashboardLayout requiredRole="admin">
                <AdminTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }

    try {
        const { timetable, classes, teachers } = await getTimetableData(initialFilters);

        return (
            <DashboardLayout requiredRole="admin">
                <AdminTimetableClient 
                    initialTimetable={timetable} 
                    initialClasses={classes} 
                    initialTeachers={teachers} 
                    initialFilters={initialFilters} 
                />
            </DashboardLayout>
        );
    } catch (error) {
        console.error('[AdminTimetable] Database query failed:', error);
        return (
            <DashboardLayout requiredRole="admin">
                <AdminTimetableFallbackClient initialFilters={initialFilters} />
            </DashboardLayout>
        );
    }
}

import AdminTimetableFallbackClient from './AdminTimetableFallbackClient';

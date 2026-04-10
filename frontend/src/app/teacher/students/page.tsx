import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/sharedAuth';
import { getTeacherStudentsData } from '@/services/dataAccess';
import DashboardLayout from '@/components/DashboardLayout';
import TeacherStudentsClient from './TeacherStudentsClient';
import TeacherStudentsFallbackClient from './TeacherStudentsFallbackClient';

export const dynamic = 'force-dynamic';

export default async function TeacherStudentsPage() {
    const session = await requireRole('teacher');

    if (!session) {
        return <TeacherStudentsFallbackClient />;
    }

    try {
        const data = await getTeacherStudentsData(session.userId);

        return <TeacherStudentsClient initialData={{ students: data.students }} />;
    } catch (error) {
        console.error('[TeacherStudents] Database query failed:', error);
        return <TeacherStudentsFallbackClient />;
    }
}

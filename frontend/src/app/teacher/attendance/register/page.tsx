import { requireRole } from '@/lib/sharedAuth';
import prisma from '@/lib/prisma';
import { getAttendanceRegisterData } from '@/services/dataAccess';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AttendanceRegisterClient from '@/app/admin/attendance/register/AttendanceRegisterClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    class_id?: string;
    month?: string;
  }>;
}

export default async function TeacherAttendanceRegisterPage({ searchParams }: PageProps) {
  const session = await requireRole('teacher');
  if (!session) redirect('/login');

  const params = await searchParams;
  const currentMonth = params.month || new Date().toISOString().split('-').slice(0, 2).join('-');
  
  // 1. Fetch only classes taught by this teacher for the selector dropdown
  const teacher = await prisma.teacher.findUnique({
    where: { user_id: session.userId }
  });

  let classes: any[] = [];
  if (teacher) {
    classes = await prisma.class.findMany({
      where: {
        OR: [
          { primary_teacher_id: teacher.id },
          { schedule: { some: { teacher_id: teacher.id } } }
        ]
      },
      orderBy: { class_name: 'asc' }
    });
  }

  const selectedClassId = params.class_id || (classes.length > 0 ? classes[0].id : undefined);

  let registerData = null;
  if (selectedClassId) {
    registerData = await getAttendanceRegisterData(selectedClassId, currentMonth);
  }

  return (
    <DashboardLayout requiredRole="teacher">
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>
              <Link href="/teacher/attendance" style={{ color: '#64748B', textDecoration: 'none' }}>Attendance</Link>
              <span>/</span>
              <span style={{ color: '#E53935' }}>Attendance Sheet Register</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B', margin: 0 }}>Attendance Register</h1>
            <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Real-time monthly attendance ledger grid with status codes, quick controls and exports.</p>
          </div>
          <Link href="/teacher/attendance" className="btn btn-secondary" style={{ textDecoration: 'none', fontWeight: 700, borderRadius: '12px' }}>
            Back to Dashboard
          </Link>
        </div>

        {classes.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>No Classes Assigned</h3>
            <p style={{ color: '#64748B', margin: '8px 0 24px' }}>There are no classes/batches assigned to you yet.</p>
            <Link href="/teacher/timetable" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.25)' }}>View Timetable</Link>
          </div>
        ) : (
          <AttendanceRegisterClient 
            classes={classes} 
            selectedClassId={selectedClassId || ''} 
            selectedMonth={currentMonth}
            registerData={registerData}
            basePath="/teacher/attendance/register"
          />
        )}
      </div>
    </DashboardLayout>
  );
}

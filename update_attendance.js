const fs = require('fs');

// ADMIN
const adminPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/students/[id]/page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');
const adminLines = adminContent.split('\n');
adminLines.splice(1100, 412, `                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                    <div className="animate-in" style={{ animationDelay: '220ms' }}>
                        <StudentAttendanceCalendar studentId={params.id as string} />
                    </div>
                )}`);
adminContent = adminLines.join('\n');
adminContent = adminContent.replace("import { useParams, useRouter } from 'next/navigation';", "import { useParams, useRouter } from 'next/navigation';\nimport StudentAttendanceCalendar from '@/components/StudentAttendanceCalendar';");
fs.writeFileSync(adminPath, adminContent);
console.log('Admin updated');

// TEACHER
const teacherPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/teacher/students/[id]/page.tsx';
let teacherContent = fs.readFileSync(teacherPath, 'utf8');
const teacherLines = teacherContent.split('\n');
teacherLines.splice(532, 119, `                {activeTab === 'attendance' && (
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animationDelay: '220ms' }}>
                        <StudentAttendanceCalendar studentId={params.id as string} />
                    </div>
                )}`);
teacherContent = teacherLines.join('\n');
teacherContent = teacherContent.replace("import { useParams, useRouter } from 'next/navigation';", "import { useParams, useRouter } from 'next/navigation';\nimport StudentAttendanceCalendar from '@/components/StudentAttendanceCalendar';");
fs.writeFileSync(teacherPath, teacherContent);
console.log('Teacher updated');

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
    FileText, ClipboardList, PenTool, Target, 
    Video, MessageSquare, Shield, UserCheck, 
    BarChart3, PlayCircle, Users, Bell 
} from 'lucide-react';

const adminTools = [
    { label: 'Materials', href: '/admin/study-materials', icon: FileText },
    { label: 'Videos', href: '/admin/video-lectures', icon: Video },
    { label: 'Tests', href: '/admin/tests', icon: ClipboardList },
    { label: 'Homework', href: '/admin/homework', icon: PenTool },
    { label: 'Demos', href: '/admin/demos', icon: Target },
    { label: 'Queries', href: '/admin/queries', icon: MessageSquare },
    { label: 'Perms', href: '/admin/permissions', icon: Shield }
];

const teacherTools = [
    { label: 'Attendance', href: '/teacher/attendance', icon: UserCheck, perm: 'attendance' },
    { label: 'Materials', href: '/teacher/study-materials', icon: FileText, perm: null },
    { label: 'Tests', href: '/teacher/tests', icon: ClipboardList, perm: 'tests' },
    { label: 'Homework', href: '/teacher/homework', icon: PenTool, perm: 'homework' },
    { label: 'Demos', href: '/teacher/demos', icon: Target, perm: 'demos' },
    { label: 'Queries', href: '/teacher/queries', icon: MessageSquare, perm: null },
    { label: 'Reports', href: '/teacher/reports', icon: BarChart3, perm: null },
];

const studentTools = [
    { label: 'Materials', href: '/student/study-materials', icon: FileText },
    { label: 'Videos', href: '/student/video-lectures', icon: PlayCircle },
    { label: 'Tests', href: '/student/tests', icon: ClipboardList },
    { label: 'Homework', href: '/student/homework', icon: PenTool },
    { label: 'Queries', href: '/student/queries', icon: MessageSquare },
    { label: 'Profile', href: '/student/profile', icon: Users }
];

const parentTools = [
    { label: 'Tests', href: '/parent/tests', icon: ClipboardList },
    { label: 'Alerts', href: '/parent/notifications', icon: Bell },
];

export default function ToolBottomBar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const permissions = user?.profile?.permissions || [];

    let tools: any[] = [];
    if (user?.role === 'admin') tools = adminTools;
    else if (user?.role === 'teacher') tools = teacherTools.filter(t => !t.perm || permissions.includes(t.perm));
    else if (user?.role === 'student') tools = studentTools;
    else if (user?.role === 'parent') tools = parentTools;

    if (tools.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: 'calc(50vw + 130px)', // Account for 260px sidebar
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: '#FFFFFF',
            border: '1px solid #F1F4F9',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflowX: 'auto',
            borderRadius: '100px', // Pill shape
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }} className="hide-scrollbar">
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#A1A5B7', marginRight: '8px', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>JUMP TO:</span>
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.href;
                return (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: isActive ? '#EEF0FF' : '#F8F9FD',
                            color: isActive ? '#4F60FF' : '#5E6278',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            boxShadow: isActive ? 'inset 0 0 0 1px rgba(79, 96, 255, 0.4)' : 'none'
                        }}
                    >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        {tool.label}
                    </Link>
                );
            })}
        </div>
    );
}

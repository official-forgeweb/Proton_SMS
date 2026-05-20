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
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(229, 57, 53, 0.12)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            borderRadius: '100px', // Pill shape
            boxShadow: '0 10px 30px rgba(229, 57, 53, 0.06), 0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} className="hide-scrollbar">
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginRight: '6px', whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>JUMP TO:</span>
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = pathname === tool.href || (tool.href !== '/teacher' && pathname.startsWith(tool.href));
                return (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isActive ? 'rgba(229, 57, 53, 0.08)' : 'rgba(248, 249, 253, 0.65)',
                            color: isActive ? '#E53935' : '#475569',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isActive ? '1px solid rgba(229, 57, 53, 0.25)' : '1px solid rgba(226, 232, 240, 0.5)',
                            boxShadow: isActive ? '0 4px 12px rgba(229, 57, 53, 0.08)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(241, 245, 249, 0.95)';
                                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                            } else {
                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                                e.currentTarget.style.background = 'rgba(229, 57, 53, 0.12)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(248, 249, 253, 0.65)';
                                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            } else {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.background = 'rgba(229, 57, 53, 0.08)';
                            }
                        }}
                    >
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        {tool.label}
                    </Link>
                );
            })}
        </div>
    );
}

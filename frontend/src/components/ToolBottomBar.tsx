import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
    FileText, ClipboardList, PenTool, Target, 
    Video, MessageSquare, Shield, UserCheck, 
    BarChart3, PlayCircle, Users, Bell, IndianRupee,
    Settings, BookOpen, Send, Clock, Terminal, Zap
} from 'lucide-react';

const adminTools = [
    { label: 'Materials', href: '/admin/study-materials', icon: FileText },
    { label: 'Videos', href: '/admin/video-lectures', icon: Video },
    { label: 'Tests', href: '/admin/tests', icon: ClipboardList },
    { label: 'Homework', href: '/admin/homework', icon: PenTool },
    { label: 'Demos', href: '/admin/demos', icon: Target },
    { label: 'Queries', href: '/admin/queries', icon: MessageSquare },
    { label: 'Fees', href: '/admin/fees', icon: IndianRupee },
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
    { label: 'Fees', href: '/student/fees', icon: IndianRupee },
    { label: 'Profile', href: '/student/profile', icon: Users }
];

const coordinatorTools = [
    { label: 'Materials', href: '/coordinator/study-materials', icon: FileText },
    { label: 'Videos', href: '/coordinator/video-lectures', icon: Video },
    { label: 'Tests', href: '/coordinator/tests', icon: ClipboardList },
    { label: 'Homework', href: '/coordinator/homework', icon: PenTool },
    { label: 'Demos', href: '/coordinator/demos', icon: Target },
    { label: 'Queries', href: '/coordinator/queries', icon: MessageSquare },
    { label: 'Fees', href: '/coordinator/fees', icon: IndianRupee },
];

const parentTools = [
    { label: 'Tests', href: '/parent/tests', icon: ClipboardList },
    { label: 'Alerts', href: '/parent/notifications', icon: Bell },
];

const whatsappTools = [
    { label: 'Dashboard', href: '/dashboard/whatsapp', icon: MessageSquare },
    { label: 'Settings', href: '/dashboard/whatsapp/settings', icon: Settings },
    { label: 'Templates', href: '/dashboard/whatsapp/templates', icon: BookOpen },
    { label: 'Send', href: '/dashboard/whatsapp/send', icon: Send },
    { label: 'Automations', href: '/dashboard/whatsapp/automations', icon: Zap },
    { label: 'Logs', href: '/dashboard/whatsapp/logs', icon: Clock },
    { label: 'Debug', href: '/dashboard/whatsapp/debug', icon: Terminal },
];

export default function ToolBottomBar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const permissions = user?.profile?.permissions || [];
    const role = user?.role as string | undefined;

    // ── WhatsApp pages get their own dedicated bottom bar ──
    const isWhatsappPage = pathname?.startsWith('/dashboard/whatsapp');
    if (isWhatsappPage) {
        return (
            <BottomBarPill
                tools={whatsappTools}
                pathname={pathname}
                accentColor="#25D366"
            />
        );
    }

    // ── Role-based tools bar (for tool sub-pages only, NOT the /operations hub) ──
    let tools: any[] = [];
    if (role === 'admin') tools = adminTools;
    else if (role === 'coordinator') tools = coordinatorTools;
    else if (role === 'teacher') tools = teacherTools.filter(t => !t.perm || permissions.includes(t.perm));
    else if (role === 'student') tools = studentTools;
    else if (role === 'parent') tools = parentTools;

    if (tools.length === 0) return null;

    // Show only on tool sub-pages (e.g. /admin/study-materials), NOT on /admin/operations itself
    const isOperationPage = pathname?.endsWith('/operations');
    const isToolPage = tools.some(t => {
        return pathname === t.href || 
            (t.href !== `/${role}` && pathname.startsWith(t.href + '/'));
    });

    if (isOperationPage || (!isToolPage)) return null;

    return (
        <BottomBarPill
            tools={tools}
            pathname={pathname}
            accentColor="#E53935"
        />
    );
}

// ── Shared pill bar renderer ──
function BottomBarPill({ tools, pathname, accentColor }: { tools: any[]; pathname: string; accentColor: string }) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${accentColor}1F`,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            borderRadius: '100px', // Pill shape
            boxShadow: `0 10px 30px ${accentColor}0F, 0 1px 3px rgba(0,0,0,0.02)`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '90vw',
        }} className="tool-bottom-bar hide-scrollbar">
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginRight: '6px', whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>JUMP TO:</span>
            {tools.map((tool: any) => {
                const Icon = tool.icon;
                // Exact match for /dashboard/whatsapp (root), prefix match for everything else
                const isActive = tool.href === '/dashboard/whatsapp'
                    ? pathname === tool.href
                    : pathname === tool.href || pathname.startsWith(tool.href + '/');
                return (
                    <Link
                        key={tool.href}
                        href={tool.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isActive ? `${accentColor}14` : 'rgba(248, 249, 253, 0.65)',
                            color: isActive ? accentColor : '#475569',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isActive ? `1px solid ${accentColor}40` : '1px solid rgba(226, 232, 240, 0.5)',
                            boxShadow: isActive ? `0 4px 12px ${accentColor}14` : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(241, 245, 249, 0.95)';
                                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                            } else {
                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                                e.currentTarget.style.background = `${accentColor}1F`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(248, 249, 253, 0.65)';
                                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.5)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            } else {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.background = `${accentColor}14`;
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

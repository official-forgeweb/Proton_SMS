'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
    Calendar, CreditCard, BarChart3, Settings, LogOut, Phone,
    UserCheck, FileText, Bell, ChevronDown, Menu, X, Target,
    Home, PenTool, Award
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: GraduationCap },
    { label: 'Teachers', href: '/admin/teachers', icon: Users },
    { label: 'Classes', href: '/admin/classes', icon: BookOpen },
    { label: 'Enquiries', href: '/admin/enquiries', icon: Phone },
    { label: 'Demo Classes', href: '/admin/demos', icon: Target },
    { label: 'Tests', href: '/admin/tests', icon: ClipboardList },
    { label: 'Homework', href: '/admin/homework', icon: PenTool },
    { label: 'Fees', href: '/admin/fees', icon: CreditCard },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const teacherNav = [
    { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { label: 'My Classes', href: '/teacher/classes', icon: BookOpen },
    { label: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
    { label: 'Tests', href: '/teacher/tests', icon: ClipboardList },
    { label: 'Homework', href: '/teacher/homework', icon: PenTool },
    { label: 'Enquiries', href: '/teacher/enquiries', icon: Phone },
    { label: 'Demo Classes', href: '/teacher/demos', icon: Target },
    { label: 'Students', href: '/teacher/students', icon: GraduationCap },
];

const studentNav = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Attendance', href: '/student/attendance', icon: Calendar },
    { label: 'Tests', href: '/student/tests', icon: ClipboardList },
    { label: 'Homework', href: '/student/homework', icon: PenTool },
    { label: 'Performance', href: '/student/performance', icon: Award },
    { label: 'Profile', href: '/student/profile', icon: Users },
];

const parentNav = [
    { label: 'Dashboard', href: '/parent', icon: LayoutDashboard },
    { label: 'My Children', href: '/parent/children', icon: GraduationCap },
    { label: 'Attendance', href: '/parent/attendance', icon: Calendar },
    { label: 'Tests', href: '/parent/tests', icon: ClipboardList },
    { label: 'Fees', href: '/parent/fees', icon: CreditCard },
    { label: 'Notifications', href: '/parent/notifications', icon: Bell },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const navItems = user.role === 'admin' ? adminNav
        : user.role === 'teacher' ? teacherNav
            : user.role === 'student' ? studentNav
                : parentNav;

    const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const userName = user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`
        : user.email;

    const initials = user.profile?.first_name
        ? `${user.profile.first_name[0]}${(user.profile.last_name || '')[0] || ''}`
        : user.email[0].toUpperCase();

    const roleColors: Record<string, string> = {
        admin: '#3B82F6',
        teacher: '#8B5CF6',
        student: '#10B981',
        parent: '#F97316',
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-white shadow-md md:hidden"
                onClick={() => setIsOpen(!isOpen)}
                style={{ border: '1px solid var(--border-primary)' }}
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'var(--gradient-primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: 'white',
                            fontWeight: 800, fontSize: '18px', fontFamily: 'Poppins'
                        }}>
                            P
                        </div>
                        <div>
                            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                Proton LMS
                            </h1>
                            <span style={{
                                fontSize: '11px', fontWeight: 600, color: roleColors[user.role],
                                textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {roleLabel} Portal
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== `/${user.role}` && pathname?.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div style={{
                    padding: '16px 16px', borderTop: '1px solid var(--border-primary)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ background: roleColors[user.role], width: '36px', height: '36px', fontSize: '14px' }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userName}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {user.profile?.PRO_ID || user.profile?.employee_id || user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
                            background: 'transparent', cursor: 'pointer', fontSize: '13px',
                            color: 'var(--error)', fontWeight: 500, width: '100%', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--error-light)'; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

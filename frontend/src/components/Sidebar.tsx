'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
    Calendar, CreditCard, BarChart3, Settings, LogOut, Phone,
    UserCheck, FileText, Bell, ChevronDown, ChevronRight, Menu, X, Target,
    Home, PenTool, Award, Library, GraduationCap as StudentIcon
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
    {
        label: 'Home',
        icon: Home,
        isParent: true,
        subItems: [
            { label: 'Admin', href: '/admin' }
        ]
    },
    {
        label: 'Students',
        icon: GraduationCap,
        isParent: true,
        subItems: [
            { label: 'All Students', href: '/admin/students' },
            { label: 'Student Details', href: '/admin/students/details' }
        ]
    },
    { label: 'Teachers', href: '/admin/teachers', icon: Users, isParent: true },
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
    const [expandedMenu, setExpandedMenu] = useState<string | null>('Home');

    // Default to admin nav if testing without login, but normally user is required.
    const navItems = user?.role === 'admin' ? adminNav
        : user?.role === 'teacher' ? teacherNav
            : user?.role === 'student' ? studentNav
                : user?.role === 'parent' ? parentNav : adminNav; 

    const toggleMenu = (label: string) => {
        if (expandedMenu === label) {
            setExpandedMenu(null);
        } else {
            setExpandedMenu(label);
        }
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

            <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ borderRight: 'none', width: '280px' }}>
                {/* Logo */}
                <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)',
                        fontWeight: 800, fontSize: '24px', fontFamily: 'Poppins'
                    }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--primary)', display: 'flex',
                            alignItems: 'center', justifyItems: 'center', padding: '0 8px', color: 'white',
                            fontSize: '18px', fontStyle: 'italic', fontWeight: 'bold'
                        }}>
                            ia
                        </div>
                        ia Academy
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isExpanded = expandedMenu === item.label;
                        
                        let isActiveParent = false;
                        if (!item.subItems) {
                             isActiveParent = pathname === item.href || (item.href !== `/${user?.role}` && pathname?.startsWith(item.href || 'XYZ'));
                        } else {
                             isActiveParent = item.subItems.some(sub => pathname === sub.href || (sub.href !== `/${user?.role}` && pathname?.startsWith(sub.href || 'XYZ')));
                        }

                        return (
                            <div key={item.label} style={{ marginBottom: '4px' }}>
                                {/* Parent Element */}
                                {item.subItems ? (
                                    <div 
                                        className="sidebar-nav-item"
                                        onClick={() => toggleMenu(item.label)}
                                        style={{ 
                                            justifyContent: 'space-between', 
                                            margin: '0', 
                                            padding: '12px 16px',
                                            color: isExpanded ? 'var(--primary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Icon size={20} strokeWidth={2} />
                                            <span>{item.label}</span>
                                        </div>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href || '#'}
                                        className="sidebar-nav-item"
                                        style={{ margin: '0', padding: '12px 16px' }}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Icon size={20} strokeWidth={2} />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                )}

                                {/* Sub Items */}
                                {item.subItems && isExpanded && (
                                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {item.subItems.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.label}
                                                    href={sub.href}
                                                    onClick={() => setIsOpen(false)}
                                                    style={{
                                                        position: 'relative',
                                                        display: 'block',
                                                        padding: '10px 16px 10px 48px',
                                                        fontSize: '14px',
                                                        color: isSubActive ? 'var(--primary)' : 'var(--text-secondary)',
                                                        background: isSubActive ? 'var(--primary-50)' : 'transparent',
                                                        borderRadius: 'var(--radius-md)',
                                                        textDecoration: 'none',
                                                        fontWeight: 500,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {isSubActive && (
                                                        <div style={{
                                                            position: 'absolute', left: '0', top: '10%', bottom: '10%',
                                                            width: '4px', background: 'var(--primary)', borderRadius: '0 max(0px, 4px) max(0px, 4px) 0'
                                                        }} />
                                                    )}
                                                    {sub.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Log Out button */}
                <div style={{ padding: '24px 16px' }}>
                     <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            background: 'transparent', cursor: 'pointer', fontSize: '14px', border: 'none',
                            color: 'var(--text-secondary)', fontWeight: 500, width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

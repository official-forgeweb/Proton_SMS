'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
    Calendar, CreditCard, BarChart3, Settings, LogOut, Phone,
    UserCheck, FileText, Bell, Menu, X, Target, Clock,
    Home, PenTool, Award, HelpCircle, MessageSquare, Zap, Shield, Video, PlayCircle
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Students', href: '/admin/students', icon: GraduationCap },
            { label: 'Teachers', href: '/admin/teachers', icon: Users },
            { label: 'Classes', href: '/admin/classes', icon: BookOpen },
            { label: 'Timetable', href: '/admin/timetable', icon: Calendar },
            { label: 'Enquiries', href: '/admin/enquiries', icon: Phone },
            { label: 'Operations', href: '/admin/operations', icon: Zap },
        ]
    },
    {
        section: 'FINANCIAL',
        items: [
            { label: 'Fees', href: '/admin/fees', icon: CreditCard },
            { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
        ]
    },
    {
        section: 'SYSTEM',
        items: [
            { label: 'Settings', href: '/admin/settings', icon: Settings },
        ]
    }
];

const teacherNavSections = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
            { label: 'My Schedule', href: '/teacher/timetable', icon: Calendar },
            { label: 'My Classes', href: '/teacher/classes', icon: BookOpen, permissionKey: 'classes' },
            { label: 'Students', href: '/teacher/students', icon: GraduationCap, permissionKey: 'students' },
            { label: 'Enquiries', href: '/teacher/enquiries', icon: Phone, permissionKey: 'enquiries' },
            { label: 'Operations', href: '/teacher/operations', icon: Zap },
        ]
    }
];

const studentNavSections = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
            { label: 'Attendance', href: '/student/attendance', icon: Calendar },
            { label: 'My Schedule', href: '/student/timetable', icon: Clock },
            { label: 'Performance', href: '/student/performance', icon: Award },
            { label: 'Operations', href: '/student/operations', icon: Zap },
        ]
    }
];

const parentNavSections = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/parent', icon: LayoutDashboard },
            { label: 'My Children', href: '/parent/children', icon: GraduationCap },
            { label: 'Attendance', href: '/parent/attendance', icon: Calendar },
            { label: 'Operations', href: '/parent/operations', icon: Zap },
        ]
    },
    {
        section: 'FINANCIAL',
        items: [
            { label: 'Fees', href: '/parent/fees', icon: CreditCard },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const teacherPermissions: string[] = user?.role === 'teacher' ? (user.profile?.permissions || []) : [];

    const navSections = user?.role === 'admin' ? adminNav
        : user?.role === 'teacher' ? teacherNavSections.map(section => ({
            ...section,
            items: section.items.filter((item: any) =>
                // Always show Dashboard (no permissionKey) and items the teacher is permitted
                !item.permissionKey || teacherPermissions.includes(item.permissionKey)
            )
        }))
            : user?.role === 'student' ? studentNavSections
                : user?.role === 'parent' ? parentNavSections : adminNav;

    const isItemActive = (item: any): boolean => {
        if (!pathname) return false;
        // Exact match
        if (pathname === item.href) return true;
        // Start match to keep active when in sub-pages (e.g. /admin/students/1)
        if (item.href && item.href !== `/${user?.role}` && pathname.startsWith(item.href)) {
            return true;
        }
        return false;
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

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`sidebar ${isOpen ? 'open' : ''}`}
                style={{
                    width: '260px',
                    background: '#10121B',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 50,
                }}
            >
                {/* Subtle dark radial glow for depth */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '300px',
                    background: 'radial-gradient(ellipse at top left, rgba(229,57,53,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0
                }} />
                {/* Logo */}
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <Link href={`/${user?.role}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img 
                            src="/image.png" 
                            alt="Proton Logo" 
                            style={{ 
                                width: '72px', 
                                height: '72px', 
                                borderRadius: '50%',
                                boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
                                backgroundColor: '#FF0000'
                            }} 
                        />
                    </Link>
                </div>

                {/* Navigation Sections */}
                <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto', overflowX: 'hidden' }} className="hide-scrollbar">
                    {navSections.map((section) => (
                        <div key={section.section} style={{ marginBottom: 0 }}>
                            {/* Section Label */}
                            <div style={{ padding: '10px 12px 4px', marginBottom: 0 }}>
                                <p style={{
                                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
                                    color: '#6B7280', textTransform: 'uppercase',
                                }}>
                                    {section.section}
                                </p>
                            </div>

                            {section.items.map((item: any) => {
                                const Icon = item.icon;
                                const isActive = isItemActive(item);

                                return (
                                    <div key={item.label} style={{ marginBottom: 0 }}>
                                        <Link
                                            href={item.href || '#'}
                                            onClick={() => setIsOpen(false)}
                                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '10px 14px', borderRadius: '12px', textDecoration: 'none',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative', zIndex: 1,
                                            }}
                                        >
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.8 }} />
                                            <span>{item.label}</span>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Upgrade Card */}
                

                {/* Sign Out */}
                <div style={{ padding: '6px 24px 16px', position: 'relative', zIndex: 1 }}>
                    <button
                        onClick={logout}
                        className="sidebar-signout-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '14px',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontWeight: 600, width: '100%',
                            padding: '12px 0', transition: 'all 0.2s',
                            borderRadius: '12px',
                        }}
                    >
                        <LogOut size={18} strokeWidth={2} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

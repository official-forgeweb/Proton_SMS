'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
    Calendar, CreditCard, BarChart3, Settings, LogOut, Phone,
    UserCheck, FileText, Bell, ChevronDown, ChevronRight, Menu, X, Target,
    Home, PenTool, Award, HelpCircle, MessageSquare, Zap
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
    {
        section: 'MENU',
        items: [
            {
                label: 'Dashboard',
                icon: LayoutDashboard,
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
            { label: 'Teachers', href: '/admin/teachers', icon: Users },
            { label: 'Classes', href: '/admin/classes', icon: BookOpen },
            { label: 'Enquiries', href: '/admin/enquiries', icon: Phone },
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
        section: 'TOOLS',
        items: [
            { label: 'Tests', href: '/admin/tests', icon: ClipboardList },
            { label: 'Homework', href: '/admin/homework', icon: PenTool },
            { label: 'Demos', href: '/admin/demos', icon: Target },
            { label: 'Settings', href: '/admin/settings', icon: Settings },
        ]
    }
];

const teacherNavSections = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
            { label: 'My Classes', href: '/teacher/classes', icon: BookOpen },
            { label: 'Students', href: '/teacher/students', icon: GraduationCap },
            { label: 'Enquiries', href: '/teacher/enquiries', icon: Phone },
        ]
    },
    {
        section: 'TOOLS',
        items: [
            { label: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
            { label: 'Tests', href: '/teacher/tests', icon: ClipboardList },
            { label: 'Homework', href: '/teacher/homework', icon: PenTool },
            { label: 'Demo Classes', href: '/teacher/demos', icon: Target },
        ]
    }
];

const studentNavSections = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
            { label: 'Attendance', href: '/student/attendance', icon: Calendar },
            { label: 'Performance', href: '/student/performance', icon: Award },
        ]
    },
    {
        section: 'TOOLS',
        items: [
            { label: 'Tests', href: '/student/tests', icon: ClipboardList },
            { label: 'Homework', href: '/student/homework', icon: PenTool },
            { label: 'Profile', href: '/student/profile', icon: Users },
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
        ]
    },
    {
        section: 'FINANCIAL',
        items: [
            { label: 'Fees', href: '/parent/fees', icon: CreditCard },
        ]
    },
    {
        section: 'TOOLS',
        items: [
            { label: 'Tests', href: '/parent/tests', icon: ClipboardList },
            { label: 'Notifications', href: '/parent/notifications', icon: Bell },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>('Dashboard');

    const navSections = user?.role === 'admin' ? adminNav
        : user?.role === 'teacher' ? teacherNavSections
            : user?.role === 'student' ? studentNavSections
                : user?.role === 'parent' ? parentNavSections : adminNav;

    const toggleMenu = (label: string) => {
        setExpandedMenu(expandedMenu === label ? null : label);
    };

    const isItemActive = (item: any): boolean => {
        if (!item.subItems) {
            return pathname === item.href || (item.href && item.href !== `/${user?.role}` && pathname?.startsWith(item.href));
        }
        return item.subItems.some((sub: any) => pathname === sub.href || (sub.href !== `/${user?.role}` && pathname?.startsWith(sub.href)));
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
                    background: '#FFFFFF',
                    borderRight: '1px solid #F0F0F5',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 50,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {/* Logo */}
                <div style={{ padding: '28px 24px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '16px', fontWeight: 800, fontStyle: 'italic',
                        boxShadow: '0 4px 10px rgba(79, 96, 255, 0.3)',
                        flexShrink: 0,
                    }}>
                        ia
                    </div>
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '20px', color: '#1A1D3B', letterSpacing: '-0.3px' }}>
                        ia Academy
                    </span>
                </div>

                {/* Navigation Sections */}
                <nav style={{ flex: 1, padding: '8px 16px' }}>
                    {navSections.map((section) => (
                        <div key={section.section} style={{ marginBottom: '8px' }}>
                            {/* Section Label */}
                            <p style={{
                                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                                color: '#A1A5B7', padding: '12px 12px 8px', textTransform: 'uppercase'
                            }}>
                                {section.section}
                            </p>

                            {section.items.map((item: any) => {
                                const Icon = item.icon;
                                const isActive = isItemActive(item);
                                const isExpanded = expandedMenu === item.label;

                                return (
                                    <div key={item.label} style={{ marginBottom: '2px' }}>
                                        {item.subItems ? (
                                            <div
                                                onClick={() => toggleMenu(item.label)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                                    background: isActive ? 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)' : 'transparent',
                                                    color: isActive ? 'white' : '#5E6278',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: isActive ? 600 : 500,
                                                    fontSize: '14px',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.background = '#F4F5F9';
                                                        e.currentTarget.style.color = '#4F60FF';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = '#5E6278';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                    <span>{item.label}</span>
                                                </div>
                                                {isExpanded
                                                    ? <ChevronDown size={14} />
                                                    : <ChevronRight size={14} />
                                                }
                                            </div>
                                        ) : (
                                            <Link
                                                href={item.href || '#'}
                                                onClick={() => setIsOpen(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                                                    background: isActive ? 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)' : 'transparent',
                                                    color: isActive ? 'white' : '#5E6278',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: isActive ? 600 : 500,
                                                    fontSize: '14px',
                                                    boxShadow: isActive ? '0 4px 12px rgba(79,96,255,0.25)' : 'none',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) {
                                                        (e.currentTarget as HTMLElement).style.background = '#F4F5F9';
                                                        (e.currentTarget as HTMLElement).style.color = '#4F60FF';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) {
                                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                        (e.currentTarget as HTMLElement).style.color = '#5E6278';
                                                    }
                                                }}
                                            >
                                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                <span>{item.label}</span>
                                            </Link>
                                        )}

                                        {/* Sub Items */}
                                        {item.subItems && isExpanded && (
                                            <div style={{ marginTop: '2px', marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {item.subItems.map((sub: any) => {
                                                    const isSubActive = pathname === sub.href;
                                                    return (
                                                        <Link
                                                            key={sub.label}
                                                            href={sub.href}
                                                            onClick={() => setIsOpen(false)}
                                                            style={{
                                                                display: 'block',
                                                                padding: '9px 12px 9px 28px',
                                                                fontSize: '13px',
                                                                fontWeight: isSubActive ? 600 : 500,
                                                                color: isSubActive ? '#4F60FF' : '#8F92A1',
                                                                background: isSubActive ? '#EEF0FF' : 'transparent',
                                                                borderRadius: '8px',
                                                                textDecoration: 'none',
                                                                transition: 'all 0.2s',
                                                                borderLeft: isSubActive ? '3px solid #4F60FF' : '3px solid transparent',
                                                            }}
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Upgrade Card */}
                <div style={{ padding: '16px', margin: '0 12px 12px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1A1D3B 0%, #2D3165 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px',
                            borderRadius: '50%', background: 'rgba(79, 96, 255, 0.25)',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-10px', left: '40px', width: '60px', height: '60px',
                            borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)',
                        }} />
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={16} fill="white" color="white" />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Upgrade Pro</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: '14px' }}>
                            Discover the benefits of an upgraded account
                        </p>
                        <button
                            style={{
                                width: '100%', padding: '9px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                border: 'none', borderRadius: '10px', color: 'white',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(79,96,255,0.4)',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            Upgrade $30
                        </button>
                    </div>
                </div>

                {/* Sign Out */}
                <div style={{ padding: '4px 28px 24px' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'transparent', cursor: 'pointer', fontSize: '14px',
                            border: 'none', color: '#5E6278', fontWeight: 500, width: '100%',
                            padding: '10px 0', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#5E6278')}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

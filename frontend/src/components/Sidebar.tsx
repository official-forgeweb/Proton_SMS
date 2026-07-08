'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen,
    Calendar, CreditCard, BarChart3, Settings, LogOut, Phone,
    X, Menu, Zap, Shield, Clock, Award, Send, Terminal, MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const adminNav = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'Students', href: '/admin/students', icon: GraduationCap },
            { label: 'Teachers', href: '/admin/teachers', icon: Users },
            { label: 'Coordinators', href: '/admin/coordinators', icon: Shield },
            { label: 'Classes', href: '/admin/classes', icon: BookOpen },
            { label: 'HET Management', href: '/admin/hets', icon: Award },
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
            { label: 'HET Management', href: '/teacher/hets', icon: Award },
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
            { label: 'HET Performance', href: '/student/hets', icon: Award },
            { label: 'Operations', href: '/student/operations', icon: Zap },
        ]
    },
    {
        section: 'FINANCIAL',
        items: [
            { label: 'Fees', href: '/student/fees', icon: CreditCard },
        ]
    }
];

const coordinatorNav = [
    {
        section: 'MENU',
        items: [
            { label: 'Dashboard', href: '/coordinator', icon: LayoutDashboard },
            { label: 'Students', href: '/coordinator/students', icon: GraduationCap },
            { label: 'Classes', href: '/coordinator/classes', icon: BookOpen },
            { label: 'HET Management', href: '/coordinator/hets', icon: Award },
            { label: 'Timetable', href: '/coordinator/timetable', icon: Calendar },
            { label: 'Enquiries', href: '/coordinator/enquiries', icon: Phone },
            { label: 'Operations', href: '/coordinator/operations', icon: Zap },
        ]
    },
    {
        section: 'FINANCIAL',
        items: [
            { label: 'Fees', href: '/coordinator/fees', icon: CreditCard },
            { label: 'Reports', href: '/coordinator/reports', icon: BarChart3 },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    
    // Global layout reactive states
    const { 
        isSidebarOpen, 
        isSidebarCollapsed, 
        setSidebarOpen, 
        setSidebarCollapsed 
    } = useLayoutStore();

    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasInitializedMobile, setHasInitializedMobile] = useState(false);

    // Track window sizes dynamically
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;
            setIsMobile(mobile);
            setIsTablet(tablet);
            setHasInitializedMobile(true);
            
            // Set collapsed state automatically based on size
            if (mobile) {
                setSidebarCollapsed(false);
            } else if (tablet) {
                setSidebarCollapsed(true);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarCollapsed]);



    // Handle Escape key closure on mobile drawer mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobile) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, setSidebarOpen]);

    const teacherPermissions: string[] = user?.role === 'teacher' ? (user.profile?.permissions || []) : [];

    const navSections = user?.role === 'admin' ? adminNav
        : user?.role === 'coordinator' ? coordinatorNav
        : user?.role === 'teacher' ? teacherNavSections.map(section => ({
            ...section,
            items: section.items.filter((item: any) =>
                !item.permissionKey || teacherPermissions.includes(item.permissionKey)
            )
        }))
            : user?.role === 'student' ? studentNavSections : adminNav;

    const isItemActive = (item: any): boolean => {
        if (!pathname) return false;
        if (pathname === item.href) return true;
        
        // Base dashboard paths must match exactly to prevent sibling pages from highlighting them
        const basePaths = ['/dashboard/whatsapp', '/admin', '/coordinator', '/teacher', '/student'];
        if (item.href && basePaths.includes(item.href)) {
            return pathname === item.href;
        }

        if (item.href && item.href !== `/${user?.role}` && pathname.startsWith(item.href)) {
            return true;
        }

        if (item.label === 'Operations') {
            const operationRoutes = ['/study-materials', '/video-lectures', '/tests', '/homework', '/demos', '/queries', '/permissions', '/whatsapp'];
            if (operationRoutes.some(route => pathname.includes(route))) {
                return true;
            }
        }
        return false;
    };

    // Calculate collapse logic
    const isCurrentlyCollapsed = !isMobile && (isSidebarCollapsed || (isTablet && !isHovered));
    const sidebarWidth = isMobile ? '260px' : (isCurrentlyCollapsed ? '70px' : '260px');

    return (
        <>
            {/* Backdrop overlay for Mobile Drawer */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(16, 18, 27, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 45,
                        transition: 'opacity 0.25s ease',
                    }}
                />
            )}

            <aside
                onMouseEnter={() => !isMobile && setIsHovered(true)}
                onMouseLeave={() => !isMobile && setIsHovered(false)}
                className={`sidebar ${isMobile && isSidebarOpen ? 'open' : ''}`}
                style={{
                    width: sidebarWidth,
                    background: '#10121B',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100dvh',
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

                {/* Logo Section */}
                <div 
                    className="sidebar-logo-container"
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        position: 'relative', 
                        zIndex: 1,
                        transition: 'all 0.2s ease',
                        padding: isCurrentlyCollapsed ? '16px 0' : undefined,
                    }}
                >
                    <Link href={`/${user?.role}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <img 
                            src="/image.png" 
                            alt="Proton Logo" 
                            style={{ 
                                width: isCurrentlyCollapsed ? '40px' : '64px', 
                                height: isCurrentlyCollapsed ? '40px' : '64px', 
                                borderRadius: '50%',
                                boxShadow: '0 4px 16px rgba(229,57,53,0.3)',
                                backgroundColor: '#FF0000',
                                transition: 'all 0.2s ease',
                            }} 
                        />
                    </Link>
                </div>

                {/* Navigation Sections */}
                <nav 
                    style={{ 
                        flex: 1, 
                        padding: isCurrentlyCollapsed ? '0 8px' : '0 16px', 
                        overflowY: 'auto', 
                        overflowX: 'hidden',
                        transition: 'padding 0.2s'
                    }} 
                    className="hide-scrollbar"
                >
                    {navSections.map((section) => (
                        <div key={section.section} style={{ marginBottom: '16px' }}>
                            {/* Section Label (Hide in collapsed mode) */}
                            {!isCurrentlyCollapsed ? (
                                <div style={{ padding: '12px 12px 6px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{
                                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
                                        color: '#6B7280', textTransform: 'uppercase',
                                    }}>
                                        {section.section}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 8px 6px' }} />
                            )}

                            {section.items.map((item: any) => {
                                const Icon = item.icon;
                                const isActive = isItemActive(item);

                                return (
                                    <div key={item.label} style={{ marginBottom: '4px' }}>
                                        <Link
                                            href={item.href || '#'}
                                            onClick={() => isMobile && setSidebarOpen(false)}
                                            title={isCurrentlyCollapsed ? item.label : undefined}
                                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                            style={{
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: isCurrentlyCollapsed ? 'center' : 'flex-start',
                                                gap: isCurrentlyCollapsed ? '0' : '12px',
                                                padding: '10px 14px', 
                                                borderRadius: '12px', 
                                                textDecoration: 'none',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative', 
                                                zIndex: 1,
                                            }}
                                        >
                                            <Icon 
                                                size={18} 
                                                strokeWidth={isActive ? 2.5 : 2} 
                                                style={{ 
                                                    opacity: isActive ? 1 : 0.8,
                                                    flexShrink: 0
                                                }} 
                                            />
                                            {!isCurrentlyCollapsed && (
                                                <span style={{ transition: 'opacity 0.2s' }}>{item.label}</span>
                                            )}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Sign Out Section */}
                <div 
                    className="sidebar-signout-container"
                    style={{ 
                        position: 'relative', 
                        zIndex: 1,
                        padding: isCurrentlyCollapsed ? '6px 8px 16px' : undefined,
                    }}
                >
                    <button
                        onClick={logout}
                        title={isCurrentlyCollapsed ? 'Sign Out' : undefined}
                        className="sidebar-signout-btn"
                        style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: isCurrentlyCollapsed ? '0' : '12px', 
                            background: 'rgba(255,255,255,0.05)', 
                            cursor: 'pointer', 
                            fontSize: '14px',
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: '#9CA3AF', 
                            fontWeight: 600, 
                            width: '100%',
                            padding: '12px 0', 
                            transition: 'all 0.2s',
                            borderRadius: '12px',
                        }}
                    >
                        <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
                        {!isCurrentlyCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}


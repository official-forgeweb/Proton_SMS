'use client';
import { useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/Sidebar';
import { useLayoutStore } from '@/stores/layoutStore';
import { Search, Bell, WifiOff, RefreshCw, X, Check, GraduationCap, UserCheck, BookOpen, FileText, HelpCircle, Award, User, Menu } from 'lucide-react';
import api from '@/lib/api';
import ToolBottomBar from '@/components/ToolBottomBar';

interface DashboardLayoutProps {
    children: ReactNode;
    requiredRole?: string | string[];
}

let isFirstLoad = true;

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, serverError, checkAuth } = useAuthStore();
    const [retrying, setRetrying] = useState(false);
    const [mounted, setMounted] = useState(!isFirstLoad);

    // Global layout reactive states
    const { isSidebarOpen, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useLayoutStore();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Track window resize for sidebar responsive layouts
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;
            setIsMobile(mobile);
            setIsTablet(tablet);
            
            // Sync collapses
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

    useEffect(() => {
        setMounted(true);
        isFirstLoad = false;
    }, []);
    


    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside search dropdown listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search query debouncer
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data.data || []);
                setShowSearchDropdown(true);
            } catch (error) {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const getSearchIcon = (type: string) => {
        switch (type) {
            case 'student': return GraduationCap;
            case 'teacher': return UserCheck;
            case 'class': return BookOpen;
            case 'enquiry': return FileText;
            case 'query': return HelpCircle;
            case 'homework': return FileText;
            case 'test': return Award;
            case 'material': return BookOpen;
            default: return User;
        }
    };

    const getSearchIconBg = (type: string) => {
        switch (type) {
            case 'student': return 'rgba(16, 185, 129, 0.08)';
            case 'teacher': return 'rgba(59, 130, 246, 0.08)';
            case 'class': return 'rgba(139, 92, 246, 0.08)';
            case 'enquiry': return 'rgba(245, 158, 11, 0.08)';
            case 'query': return 'rgba(239, 68, 68, 0.08)';
            case 'homework': return 'rgba(236, 72, 153, 0.08)';
            case 'test': return 'rgba(244, 63, 94, 0.08)';
            case 'material': return 'rgba(20, 184, 166, 0.08)';
            default: return 'rgba(161, 165, 183, 0.08)';
        }
    };

    const getSearchIconColor = (type: string) => {
        switch (type) {
            case 'student': return '#10B981';
            case 'teacher': return '#3B82F6';
            case 'class': return '#8B5CF6';
            case 'enquiry': return '#F59E0B';
            case 'query': return '#EF4444';
            case 'homework': return '#EC4899';
            case 'test': return '#F43F5E';
            case 'material': return '#20B2AA';
            default: return '#A1A5B7';
        }
    };

    const getSearchBadgeBg = (type: string) => getSearchIconBg(type);
    const getSearchBadgeColor = (type: string) => getSearchIconColor(type);

    useEffect(() => {
        checkAuth();
        console.log("COMPUTED_LAYOUT:", 
            document.querySelector(".main-layout-root")?.clientWidth, 
            document.querySelector(".main-content")?.clientWidth, 
            document.querySelector(".page-body")?.clientWidth, 
            document.querySelector(".page-body")?.scrollWidth,
            window.getComputedStyle(document.querySelector(".main-content") || document.documentElement).marginLeft
        );
    }, []);



    // Auto-retry when server error is detected
    useEffect(() => {
        if (!serverError) return;
        const interval = setInterval(() => {
            checkAuth();
        }, 10000); // retry every 10 seconds
        return () => clearInterval(interval);
    }, [serverError]);

    useEffect(() => {
        if (!mounted) return;
        if (!isLoading && !serverError) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (requiredRole) {
                const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                if (!allowedRoles.includes(user?.role || '')) {
                    router.push(`/${user?.role}`);
                }
            }
        }
    }, [mounted, isLoading, isAuthenticated, user, requiredRole, serverError]);

    const handleRetry = useCallback(async () => {
        setRetrying(true);
        await checkAuth();
        setRetrying(false);
    }, [checkAuth]);

    if (!mounted) {
        return <div style={{ minHeight: '100vh', background: '#F8F9FD' }} />;
    }

    if (isLoading) {
        return (
            <div 
                suppressHydrationWarning
                style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#F8F9FD', flexDirection: 'column',
                position: 'relative', overflow: 'hidden', zIndex: 9999
            }}>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin-slow {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse-soft {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(0.95); opacity: 0.8; }
                    }
                    @keyframes loader-progress {
                        0% { left: -100%; right: 100%; }
                        50% { left: 0%; right: 0%; }
                        100% { left: 100%; right: -100%; }
                    }
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes dot-blink {
                        0% { opacity: 0.2; }
                        20% { opacity: 1; }
                        100% { opacity: 0.2; }
                    }
                    
                    .premium-backdrop {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: radial-gradient(circle at 50% -20%, rgba(229, 57, 53, 0.08) 0%, rgba(248, 249, 253, 1) 60%);
                        z-index: 0;
                    }
                    .loader-logo-container {
                        position: relative;
                        width: 90px; height: 90px;
                        display: flex; align-items: center; justify-content: center;
                        margin-bottom: 36px;
                        z-index: 10;
                        animation: pulse-soft 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    }
                    .loader-ring {
                        position: absolute;
                        top: -12px; left: -12px; right: -12px; bottom: -12px;
                        border-radius: 50%;
                        border: 2px dashed rgba(229, 57, 53, 0.25);
                        animation: spin-slow 15s linear infinite;
                    }
                    .loader-ring-inner {
                        position: absolute;
                        top: -4px; left: -4px; right: -4px; bottom: -4px;
                        border-radius: 50%;
                        border: 2px solid transparent;
                        border-top-color: #E53935;
                        border-right-color: rgba(229, 57, 53, 0.3);
                        animation: spin-slow 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
                    }
                    .logo-cube {
                        width: 64px; height: 64px;
                        background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
                        border-radius: 18px;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 16px 32px rgba(229, 57, 53, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3);
                    }
                    .text-container {
                        z-index: 10;
                        text-align: center;
                        animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .loading-bar-track {
                        width: 220px; height: 4px;
                        background: rgba(229, 57, 53, 0.08);
                        border-radius: 4px;
                        margin: 28px auto 0;
                        overflow: hidden;
                        position: relative;
                    }
                    .loading-bar-fill {
                        position: absolute;
                        top: 0; bottom: 0;
                        background: linear-gradient(90deg, #E53935, #FF5252);
                        border-radius: 4px;
                        animation: loader-progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                        width: 50%;
                    }
                `}} />
                
                <div className="premium-backdrop" suppressHydrationWarning />

                <div className="loader-logo-container">
                    <div className="loader-ring" />
                    <div className="loader-ring-inner" />
                    <div className="logo-cube">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>

                <div className="text-container">
                    <h2 style={{ 
                        fontSize: '32px', fontWeight: 850, color: '#1A1D3B', 
                        margin: '0 0 8px 0', letterSpacing: '-0.03em',
                        fontFamily: 'SF Pro Display, Inter, sans-serif'
                    }}>
                        Proton LMS
                    </h2>
                    <p style={{ 
                        color: '#5E6278', fontSize: '16px', fontWeight: 600, margin: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px'
                    }}>
                        Preparing your workspace
                        <span style={{ display: 'inline-flex', width: '24px', textAlign: 'left' }}>
                            <span style={{ animation: 'dot-blink 1.4s infinite both' }}>.</span>
                            <span style={{ animation: 'dot-blink 1.4s infinite both 0.2s' }}>.</span>
                            <span style={{ animation: 'dot-blink 1.4s infinite both 0.4s' }}>.</span>
                        </span>
                    </p>
                    <div className="loading-bar-track">
                        <div className="loading-bar-fill" />
                    </div>
                </div>
            </div>
        );
    }

    // Server error + no cached user → show connection error page, NOT login
    if (serverError && !isAuthenticated) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#F4F5F9',
            }}>
                <div style={{
                    textAlign: 'center', maxWidth: '420px', padding: '48px 32px',
                    background: '#FFFFFF', borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    border: '1px solid #F0F0F5',
                }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <WifiOff size={32} color="#F97316" />
                    </div>
                    <h2 style={{
                        fontSize: '22px', fontWeight: 800, color: '#1A1D3B',
                        fontFamily: 'Poppins, sans-serif', marginBottom: '12px',
                    }}>
                        Connecting to Server
                    </h2>
                    <p style={{
                        fontSize: '15px', color: '#5E6278', lineHeight: 1.7,
                        marginBottom: '32px', fontWeight: 500,
                    }}>
                        Having trouble reaching the server. This may take a few moments.
                        Please stay on this page — we'll reconnect automatically.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div className="spinner" style={{
                            width: '20px', height: '20px',
                            borderWidth: '2px',
                        }} />
                        <span style={{ fontSize: '14px', color: '#A1A5B7', fontWeight: 600 }}>
                            Retrying automatically...
                        </span>
                    </div>
                    <button
                        onClick={handleRetry}
                        disabled={retrying}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '12px 28px', borderRadius: '14px',
                            background: retrying ? '#F4F5F9' : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            color: retrying ? '#A1A5B7' : '#FFFFFF',
                            fontWeight: 700, fontSize: '14px', border: 'none',
                            cursor: retrying ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: retrying ? 'none' : '0 4px 12px rgba(229,57,53,0.25)',
                        }}
                    >
                        <RefreshCw size={16} style={{
                            animation: retrying ? 'spin 1s linear infinite' : 'none',
                        }} />
                        {retrying ? 'Retrying...' : 'Retry Now'}
                    </button>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    const userName = user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`
        : user.email;

    const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const avatarImgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=E53935&color=fff`;

    const currentSidebarWidth = isMobile ? '0px' : (isSidebarCollapsed ? '70px' : '260px');

    return (
        <div 
            className="main-layout-root" 
            suppressHydrationWarning 
            style={{ 
                display: 'flex', 
                height: '100vh', 
                width: '100vw', 
                overflow: 'hidden',
                '--sidebar-width': currentSidebarWidth
            } as any}
        >
            <style dangerouslySetInnerHTML={{__html: `
                .search-result-item:hover {
                    background-color: #F8F9FD !important;
                }
                .header-action-btn {
                    transition: all 0.2s ease-in-out !important;
                }
                .header-action-btn:hover {
                    border-color: #E53935 !important;
                    background-color: #FFF5F5 !important;
                    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.08) !important;
                }
                .header-action-btn:hover .icon-default {
                    color: #E53935 !important;
                }
            `}} />
            <Sidebar />
            <main 
                className="main-content" 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    marginLeft: currentSidebarWidth,
                    width: `calc(100vw - ${currentSidebarWidth})`,
                    minWidth: `calc(100vw - ${currentSidebarWidth})`,
                    maxWidth: `calc(100vw - ${currentSidebarWidth})`
                }}
            >
                {/* Server error banner - shown when user is authenticated but server is down */}
                {serverError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        padding: '10px 24px', background: '#FFF4E5',
                        borderBottom: '1px solid #FBBF24',
                        fontSize: '13px', fontWeight: 600, color: '#92400E',
                    }}>
                        <WifiOff size={16} />
                        <span>Server connection interrupted — reconnecting automatically. Some data may be stale.</span>
                        <button
                            onClick={handleRetry}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px',
                                background: '#F97316', color: '#FFFFFF',
                                fontWeight: 700, fontSize: '12px', border: 'none', cursor: 'pointer',
                            }}
                        >
                            <RefreshCw size={12} style={{
                                animation: retrying ? 'spin 1s linear infinite' : 'none',
                            }} />
                            Retry
                        </button>
                    </div>
                )}

                {/* Top Header */}
                <header className="dashboard-header" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#FFFFFF',
                    position: 'sticky', top: 0, zIndex: 30,
                    borderBottom: '1px solid #EEEEF5',
                }}>
                    {/* Sidebar Toggle for Mobile/Tablet */}
                    {(isMobile || isTablet) && (
                        <button
                            onClick={toggleSidebar}
                            className="header-action-btn"
                            style={{
                                border: '1px solid #EEEEF5',
                                background: '#FFFFFF',
                                padding: '8px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#5E6278',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                transition: 'all 0.2s',
                                width: '40px',
                                height: '40px',
                                flexShrink: 0,
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 35
                            }}
                        >
                            <Menu size={18} className="icon-default" />
                        </button>
                    )}

                    {/* Search Bar */}
                    <div className="dashboard-header-search" style={{ position: 'relative' }} ref={searchContainerRef}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#FFFFFF',
                            borderRadius: '50px',
                            padding: '10px 20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            border: searchQuery && showSearchDropdown ? '1px solid #E53935' : '1px solid #EEEEF5',
                            gap: '10px',
                            transition: 'border-color 0.2s',
                        }}>
                            <Search size={16} color="#A1A5B7" strokeWidth={2.5} />
                            <input
                                placeholder="Search here..."
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchDropdown(true);
                                }}
                                onFocus={() => {
                                    if (searchQuery.trim()) {
                                        setShowSearchDropdown(true);
                                    }
                                }}
                                style={{
                                    border: 'none', background: 'transparent', outline: 'none',
                                    flex: 1, fontSize: '14px', color: '#1A1D3B',
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowSearchDropdown(false);
                                    }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '4px', color: '#A1A5B7', display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showSearchDropdown && searchQuery.trim() && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: '8px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(238, 238, 245, 0.9)',
                                boxShadow: '0 12px 32px rgba(26, 29, 59, 0.12)',
                                zIndex: 100,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '350px',
                            }}>
                                <div style={{ overflowY: 'auto', padding: '8px 0' }}>
                                    {searchResults.length > 0 ? (
                                        searchResults.map((result, idx) => {
                                            const Icon = getSearchIcon(result.type);
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        router.push(result.href);
                                                        setShowSearchDropdown(false);
                                                        setSearchQuery('');
                                                    }}
                                                    style={{
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s',
                                                        borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid #F8F9FD'
                                                    }}
                                                    className="search-result-item"
                                                >
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: getSearchIconBg(result.type),
                                                        color: getSearchIconColor(result.type),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1D3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {result.title}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: '#A1A5B7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {result.subtitle}
                                                        </span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '9px', textTransform: 'uppercase', fontWeight: 800,
                                                        color: getSearchBadgeColor(result.type),
                                                        background: getSearchBadgeBg(result.type),
                                                        padding: '2px 8px', borderRadius: '12px', flexShrink: 0
                                                    }}>
                                                        {result.type}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#A1A5B7' }}>
                                            <p style={{ margin: 0, fontSize: '13px' }}>No matches found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="dashboard-header-actions" style={{ display: 'flex', alignItems: 'center' }}>


                        {/* User Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <img
                                src={avatarImgUrl}
                                alt={userName}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    border: '2px solid #EEEEF5',
                                }}
                            />
                            <div className="dashboard-user-text" style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', lineHeight: 1.2 }}>
                                    {userName}
                                </p>
                                <p style={{ fontSize: '12px', color: '#A1A5B7', fontWeight: 500 }}>
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="page-body" style={{ flex: 1, background: '#F4F5F9', overflowY: 'auto' }}>
                    <div key={pathname} className="animate-page-entry" style={{ width: '100%', height: '100%' }}>
                        {children}
                    </div>
                </div>
                <ToolBottomBar />
            </main>


        </div>
    );
}

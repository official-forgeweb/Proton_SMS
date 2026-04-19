'use client';
import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/Sidebar';
import { Search, Bell, MessageSquare, WifiOff, RefreshCw } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
    requiredRole?: string;
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, serverError, checkAuth } = useAuthStore();
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        checkAuth();
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
        if (!isLoading && !serverError) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (requiredRole && user?.role !== requiredRole) {
                router.push(`/${user?.role}`);
            }
        }
    }, [isLoading, isAuthenticated, user, requiredRole, serverError]);

    const handleRetry = useCallback(async () => {
        setRetrying(true);
        await checkAuth();
        setRetrying(false);
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div style={{
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
                
                <div className="premium-backdrop" />

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

    return (
        <div className="bg-mesh" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Sidebar />
            <main style={{
                marginLeft: '260px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                width: 'calc(100vw - 260px)',
                minWidth: 'calc(100vw - 260px)',
                maxWidth: 'calc(100vw - 260px)',
            }}>
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
                <header style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 32px', background: '#FFFFFF',
                    position: 'sticky', top: 0, zIndex: 30,
                    borderBottom: '1px solid #EEEEF5',
                }}>
                    {/* Search Bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', background: '#FFFFFF',
                        borderRadius: '50px', padding: '10px 20px', width: '340px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EEEEF5',
                        gap: '10px',
                    }}>
                        <Search size={16} color="#A1A5B7" strokeWidth={2.5} />
                        <input
                            placeholder="Search here..."
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                flex: 1, fontSize: '14px', color: '#1A1D3B',
                            }}
                        />
                    </div>

                    {/* Right Side Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Notification bell */}
                        <button className="header-action-btn" style={{
                            background: '#FFFFFF', border: '1px solid #EEEEF5', cursor: 'pointer',
                            position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}>
                            <Bell size={18} className="icon-default" />
                            <span style={{
                                position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px',
                                background: '#EF4444', borderRadius: '50%', border: '2px solid white',
                            }} />
                        </button>

                        {/* Message */}
                        <button className="header-action-btn" style={{
                            background: '#FFFFFF', border: '1px solid #EEEEF5', cursor: 'pointer',
                            width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}>
                            <MessageSquare size={18} className="icon-default" />
                        </button>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '28px', background: '#E4E6EF' }} />

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
                            <div style={{ textAlign: 'left' }}>
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
                <div style={{ flex: 1, padding: '0 32px 32px', background: '#F4F5F9' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

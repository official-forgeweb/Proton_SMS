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
                minHeight: '100vh', background: '#F4F5F9', flexDirection: 'column',
                position: 'relative', overflow: 'hidden'
            }}>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes pulseGlow {
                        0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4); transform: scale(0.98); }
                        70% { box-shadow: 0 0 0 20px rgba(229, 57, 53, 0); transform: scale(1); }
                        100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); transform: scale(0.98); }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -1000px 0; }
                        100% { background-position: 1000px 0; }
                    }
                    .premium-loader-icon {
                        animation: pulseGlow 2s infinite ease-in-out, float 3s infinite ease-in-out;
                    }
                    .loading-text {
                        background: linear-gradient(90deg, #1A1D3B 0%, #E53935 50%, #1A1D3B 100%);
                        background-size: 200% auto;
                        color: transparent;
                        -webkit-background-clip: text;
                        background-clip: text;
                        animation: shimmer 2s linear infinite;
                    }
                `}} />
                
                <div style={{
                    width: '300px', height: '300px', position: 'absolute',
                    background: 'radial-gradient(circle, rgba(229,57,53,0.05) 0%, transparent 70%)',
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ textAlign: 'center', zIndex: 10 }} className="premium-loader-icon">
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', boxShadow: '0 12px 32px rgba(229, 57, 53, 0.3)'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                    <h2 className="loading-text" style={{ 
                        fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0',
                        fontFamily: 'Poppins, sans-serif'
                    }}>
                        Proton LMS
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: '#E53935', borderTopColor: 'transparent' }} />
                        <p style={{ color: '#5E6278', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                            Loading workspace...
                        </p>
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
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#F4F5F9' }}>
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
                    padding: '16px 32px', background: '#F4F5F9',
                    position: 'sticky', top: 0, zIndex: 30,
                    borderBottom: '1px solid rgba(228, 230, 239, 0.4)',
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
                        <button style={{
                            background: '#FFFFFF', border: '1px solid #EEEEF5', cursor: 'pointer',
                            position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#E53935';
                                (e.currentTarget as HTMLElement).style.background = '#FFF5F5';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#EEEEF5';
                                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                            }}
                        >
                            <Bell size={18} color="#5E6278" />
                            <span style={{
                                position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px',
                                background: '#EF4444', borderRadius: '50%', border: '2px solid white',
                            }} />
                        </button>

                        {/* Message */}
                        <button style={{
                            background: '#FFFFFF', border: '1px solid #EEEEF5', cursor: 'pointer',
                            width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#E53935';
                                (e.currentTarget as HTMLElement).style.background = '#FFF5F5';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = '#EEEEF5';
                                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                            }}
                        >
                            <MessageSquare size={18} color="#5E6278" />
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

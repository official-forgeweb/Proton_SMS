'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/Sidebar';
import { Search, Bell, MessageSquare } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
    requiredRole?: string;
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (requiredRole && user?.role !== requiredRole) {
                router.push(`/${user?.role}`);
            }
        }
    }, [isLoading, isAuthenticated, user, requiredRole]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#F4F5F9',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#A1A5B7', fontSize: '14px' }}>Loading...</p>
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
                {/* Top Header */}
                <header style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 32px', background: 'rgba(244, 245, 249, 0.8)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
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

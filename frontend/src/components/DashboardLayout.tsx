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
                minHeight: '100vh', background: 'var(--bg-secondary)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    const userName = user.profile?.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`
        : user.email;

    const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const avatarImgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff`;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '24px 32px', background: 'var(--bg-secondary)', borderBottom: 'none'
                }}>
                    <div style={{ 
                        display: 'flex', alignItems: 'center', background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-full)', padding: '10px 24px', width: '400px',
                        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-primary)'
                    }}>
                        <input 
                            placeholder="What do you want to find?"
                            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}
                        />
                        <Search size={18} color="var(--primary)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}>
                            <Bell size={20} color="var(--text-secondary)" />
                            <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }}></span>
                        </button>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <MessageSquare size={20} color="var(--text-secondary)" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={avatarImgUrl} alt={userName} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{userName}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{roleLabel}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <div style={{ flex: 1, padding: '0 32px 32px', background: 'var(--bg-secondary)' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}

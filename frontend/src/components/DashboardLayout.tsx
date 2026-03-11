'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/Sidebar';

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

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

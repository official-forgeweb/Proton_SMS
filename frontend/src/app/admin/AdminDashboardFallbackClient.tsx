'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AdminDashboardClient from './AdminDashboardClient';
import type { AdminDashboardData } from '@/services/dataAccess';
import { Activity } from 'lucide-react';

/**
 * Fallback: fetches dashboard data from the Express API (client-side)
 * when server-side data fetching isn't available (e.g., no cookie yet).
 */
export default function AdminDashboardFallbackClient() {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard/admin');
                setData(res.data.data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (isLoading) {
        return (
            <>
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                `}} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                    </div>
                    <p style={{ color: '#1A1D3B', fontSize: '16px', fontWeight: 600, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', fontFamily: 'Poppins, sans-serif' }}>
                        Preparing your dashboard...
                    </p>
                </div>
            </>
        );
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <Activity size={40} color="#A1A5B7" style={{ opacity: 0.5 }} />
                <p style={{ color: '#5E6278', fontSize: '16px', fontWeight: 600 }}>
                    Unable to load dashboard data. Please try again.
                </p>
            </div>
        );
    }

    return <AdminDashboardClient data={data} />;
}

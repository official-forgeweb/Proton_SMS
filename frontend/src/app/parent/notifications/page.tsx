'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import DashboardLayout from '@/components/DashboardLayout';
import { Bell, CheckCircle } from 'lucide-react';

export default function ParentNotificationsPage() {
    return (
        <DashboardLayout requiredRole="parent">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Notifications & Alerts</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        System updates, teacher notices, and institutional circulars.
                    </p>
                </div>
            </div>

            <div className="page-body">
                <div className="empty-state card">
                    <Bell size={48} />
                    <h3>No New Notifications</h3>
                    <p>There are currently no new institutional announcements or circulars.</p>

                    <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                        <CheckCircle size={16} /> <span>You are all caught up!</span>
                    </div>
                </div>
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}


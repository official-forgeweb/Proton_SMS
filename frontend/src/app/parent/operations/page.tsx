'use client';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { 
    ClipboardList, Bell, Zap 
} from 'lucide-react';

const parentTools = [
    { label: 'Evaluation Tests', desc: 'Track your child\'s test scores', href: '/parent/tests', icon: ClipboardList, color: '#F97316', bg: '#FFF4E5' },
    { label: 'Automated Alerts', desc: 'Manage SMS & Email signals', href: '/parent/notifications', icon: Bell, color: '#4F60FF', bg: '#EEF0FF' },
];

export default function ParentOperationsPage() {
    return (
        <DashboardLayout requiredRole="parent">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={28} color="#10B981" /> Operations & Alerts
                    </h1>
                    <p style={{ fontSize: '15px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        Review analytical tests and configure system broadcast alerts.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {parentTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <Link 
                                href={tool.href} 
                                key={tool.label}
                                className="hover-lift"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    background: '#FFFFFF', padding: '24px', borderRadius: '20px',
                                    border: '1px solid #F0F0F5', textDecoration: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <div style={{ 
                                    width: '56px', height: '56px', borderRadius: '14px', 
                                    background: tool.bg, color: tool.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Icon size={26} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1A1D3B' }}>
                                        {tool.label}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>
                                        {tool.desc}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}

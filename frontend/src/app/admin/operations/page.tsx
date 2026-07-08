'use client';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { 
    FileText, ClipboardList, PenTool, Target, 
    Video, MessageSquare, Settings, Shield, Zap,
    BookOpen, Send, Clock, Terminal, Award
} from 'lucide-react';

const adminTools = [
    { label: 'Study Materials', desc: 'Manage PDF notes & assets', href: '/admin/study-materials', icon: FileText, color: '#4F60FF', bg: '#EEF0FF' },
    { label: 'Video Lectures', desc: 'Manage recorded video classes', href: '/admin/video-lectures', icon: Video, color: '#E53935', bg: '#FFEBEE' },
    { label: 'Tests', desc: 'Create and monitor online tests', href: '/admin/tests', icon: ClipboardList, color: '#F97316', bg: '#FFF4E5' },
    { label: 'HETs', desc: 'Daily learning & homework tests', href: '/admin/hets', icon: Award, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Homework', desc: 'Assignment tracking & grading', href: '/admin/homework', icon: PenTool, color: '#8B5CF6', bg: '#F3E8FF' },
    { label: 'Demos', desc: 'Schedule trial/demo classes', href: '/admin/demos', icon: Target, color: '#EC4899', bg: '#FCE7F3' },
    { label: 'Student Queries', desc: 'Resolve doubts and queries', href: '/admin/queries', icon: MessageSquare, color: '#14B8A6', bg: '#E6FFFA' },
    { label: 'Access Control', desc: 'Manage roles and permissions', href: '${basePath}/permissions', icon: Shield, color: '#1A1D3B', bg: '#E2E8F0' },
];

const whatsappTools = [
    { label: 'Dashboard', desc: 'Analytics & delivery status', href: '/dashboard/whatsapp', icon: MessageSquare, color: '#25D366', bg: '#E8F5E9' },
    { label: 'Settings', desc: 'API keys & Webhook setup', href: '/dashboard/whatsapp/settings', icon: Settings, color: '#4F60FF', bg: '#EEF0FF' },
    { label: 'Templates', desc: 'Manage WhatsApp templates', href: '/dashboard/whatsapp/templates', icon: BookOpen, color: '#F97316', bg: '#FFF4E5' },
    { label: 'Send Message', desc: 'Broadcast test/custom text', href: '/dashboard/whatsapp/send', icon: Send, color: '#E53935', bg: '#FFEBEE' },
    { label: 'Automations', desc: 'Trigger rules & schedules', href: '/dashboard/whatsapp/automations', icon: Zap, color: '#8B5CF6', bg: '#F3E8FF' },
    { label: 'Message Logs', desc: 'Audit sent message history', href: '/dashboard/whatsapp/logs', icon: Clock, color: '#EC4899', bg: '#FCE7F3' },
    { label: 'Debug & Tools', desc: 'Health checks & validators', href: '/dashboard/whatsapp/debug', icon: Terminal, color: '#1A1D3B', bg: '#E2E8F0' },
];

export default function AdminOperationsPage() {
    const pathname = usePathname();
    const basePath = pathname.startsWith('/coordinator') ? '/coordinator' : '/admin';
    const requiredRole = pathname.startsWith('/coordinator') ? 'coordinator' : 'admin';
    return (
        <DashboardLayout requiredRole={requiredRole}>
            <div style={{ paddingBottom: '120px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={28} color="#E53935" /> Core Operations
                    </h1>
                    <p style={{ fontSize: '15px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        Command center for all administrative tools, configurations, and core platform operations.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px',
                    marginBottom: '48px'
                }}>
                    {adminTools.map((tool) => {
                        const Icon = tool.icon;
                        const href = tool.href.startsWith('/admin') 
                            ? tool.href.replace('/admin', basePath) 
                            : tool.href;
                        return (
                            <Link 
                                href={href} 
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

                {/* WhatsApp Section */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '32px', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MessageSquare size={24} color="#25D366" /> WhatsApp Business Integration
                    </h2>
                    <p style={{ fontSize: '14px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        Configure API settings, manage templates, design automated schedules, and view message transmission diagnostics.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {whatsappTools.map((tool) => {
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

'use client';
import DashboardLayout from '@/components/DashboardLayout';
import ToolBottomBar from '@/components/ToolBottomBar';
import Link from 'next/link';
import { 
    FileText, ClipboardList, PenTool, Target, 
    Video, MessageSquare, Shield, Zap 
} from 'lucide-react';

const coordinatorTools = [
    { label: 'Study Materials', desc: 'Manage PDF notes & assets', href: '/coordinator/study-materials', icon: FileText, color: '#4F60FF', bg: '#EEF0FF' },
    { label: 'Video Lectures', desc: 'Manage recorded video classes', href: '/coordinator/video-lectures', icon: Video, color: '#E53935', bg: '#FFEBEE' },
    { label: 'Tests', desc: 'Create and monitor online tests', href: '/coordinator/tests', icon: ClipboardList, color: '#F97316', bg: '#FFF4E5' },
    { label: 'Homework', desc: 'Assignment tracking & grading', href: '/coordinator/homework', icon: PenTool, color: '#8B5CF6', bg: '#F3E8FF' },
    { label: 'Demos', desc: 'Schedule trial/demo classes', href: '/coordinator/demos', icon: Target, color: '#EC4899', bg: '#FCE7F3' },
    { label: 'Student Queries', desc: 'Resolve doubts and queries', href: '/coordinator/queries', icon: MessageSquare, color: '#14B8A6', bg: '#E6FFFA' },
];

export default function CoordinatorOperationsPage() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ paddingBottom: '120px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={28} color="#E53935" /> Coordinator Operations
                    </h1>
                    <p style={{ fontSize: '15px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        Command center for all coordinator tools, configurations, and core platform operations.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {coordinatorTools.map((tool) => {
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
            <ToolBottomBar />
        </DashboardLayout>
    );
}

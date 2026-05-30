'use client';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { 
    FileText, ClipboardList, PenTool, PlayCircle, 
    MessageSquare, Users, Zap, ArrowUpRight 
} from 'lucide-react';

const studentTools = [
    { label: 'Study Materials', desc: 'Download notes and lecture PDFs', href: '/student/study-materials', icon: FileText, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
    { label: 'Video Lectures', desc: 'Watch pre-recorded subject videos', href: '/student/video-lectures', icon: PlayCircle, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
    { label: 'Online Tests', desc: 'Attempt and review batch exams', href: '/student/tests', icon: ClipboardList, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
    { label: 'Homework', desc: 'Submit and view homework scores', href: '/student/homework', icon: PenTool, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
    { label: 'Ask Queries', desc: 'Clear academic and support doubts', href: '/student/queries', icon: MessageSquare, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
    { label: 'My Profile', desc: 'View settings and personal profile', href: '/student/profile', icon: Users, color: '#E53935', bg: 'rgba(229, 57, 53, 0.06)' },
];

export default function StudentOperationsPage() {
    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>
                        <Zap size={32} color="#E53935" fill="#E53935" style={{ filter: 'drop-shadow(0 2px 8px rgba(229, 57, 53, 0.3))' }} /> Academic Lounge
                    </h1>
                    <p style={{ fontSize: '16px', color: '#5E6278', marginTop: '8px', fontWeight: 500 }}>
                        All your learning resources, daily assignments, queries, and performance trackers consolidated in one place.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '24px' 
                }}>
                    {studentTools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <Link 
                                href={tool.href} 
                                key={tool.label}
                                className="glass-card"
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    background: 'rgba(255, 255, 255, 0.9)', 
                                    padding: '28px', 
                                    borderRadius: '24px',
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    backdropFilter: 'blur(16px)',
                                    textDecoration: 'none',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.borderColor = 'rgba(229, 57, 53, 0.25)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(229, 57, 53, 0.06)';
                                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                                    if (arrow) arrow.style.transform = 'translate(2px, -2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.02)';
                                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                                    if (arrow) arrow.style.transform = 'translate(0, 0)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ 
                                        width: '60px', 
                                        height: '60px', 
                                        borderRadius: '18px', 
                                        background: tool.bg, 
                                        color: tool.color,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0
                                    }}>
                                        <Icon size={28} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                            {tool.label}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#8F92A1', fontWeight: 500, lineHeight: 1.4 }}>
                                            {tool.desc}
                                        </p>
                                    </div>
                                </div>
                                <div className="arrow-icon" style={{
                                    color: '#A1A5B7',
                                    transition: 'transform 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '12px'
                                }}>
                                    <ArrowUpRight size={18} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}

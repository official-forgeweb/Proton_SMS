'use client';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { 
    FileText, ClipboardList, PenTool, PlayCircle, 
    MessageSquare, Users, Zap 
} from 'lucide-react';

const studentTools = [
    { label: 'Study Materials', desc: 'Download notes and PDFs', href: '/student/study-materials', icon: FileText, color: '#4F60FF', bg: '#EEF0FF' },
    { label: 'Video Lectures', desc: 'Watch recorded sessions', href: '/student/video-lectures', icon: PlayCircle, color: '#E53935', bg: '#FFEBEE' },
    { label: 'Online Tests', desc: 'Attempt exams seamlessly', href: '/student/tests', icon: ClipboardList, color: '#F97316', bg: '#FFF4E5' },
    { label: 'Homework', desc: 'Submit daily assignments', href: '/student/homework', icon: PenTool, color: '#8B5CF6', bg: '#F3E8FF' },
    { label: 'Ask Queries', desc: 'Clear your academic doubts', href: '/student/queries', icon: MessageSquare, color: '#14B8A6', bg: '#E6FFFA' },
    { label: 'My Profile', desc: 'View settings and identity', href: '/student/profile', icon: Users, color: '#64748B', bg: '#F1F5F9' },
];

export default function StudentOperationsPage() {
    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={28} color="#F97316" /> Academic Lounge
                    </h1>
                    <p style={{ fontSize: '15px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        All your learning materials, assignments, and tests in one place.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {studentTools.map((tool) => {
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

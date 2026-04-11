'use client';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { 
    FileText, ClipboardList, PenTool, Target, 
    MessageSquare, UserCheck, BarChart3, Zap 
} from 'lucide-react';

export default function TeacherOperationsPage() {
    const { user } = useAuthStore();
    const permissions = user?.profile?.permissions || [];

    const teacherTools = [
        { label: 'Attendance', desc: 'Mark student attendance daily', href: '/teacher/attendance', icon: UserCheck, color: '#10B981', bg: '#D1FAE5', perm: 'attendance' },
        { label: 'Study Materials', desc: 'Upload PDF resources safely', href: '/teacher/study-materials', icon: FileText, color: '#4F60FF', bg: '#EEF0FF', perm: null }, // no perm required
        { label: 'Tests', desc: 'Grade and create exams', href: '/teacher/tests', icon: ClipboardList, color: '#F97316', bg: '#FFF4E5', perm: 'tests' },
        { label: 'Homework', desc: 'Manage assignments', href: '/teacher/homework', icon: PenTool, color: '#8B5CF6', bg: '#F3E8FF', perm: 'homework' },
        { label: 'Demo Classes', desc: 'Track trial students', href: '/teacher/demos', icon: Target, color: '#EC4899', bg: '#FCE7F3', perm: 'demos' },
        { label: 'Student Queries', desc: 'Answer academic doubts', href: '/teacher/queries', icon: MessageSquare, color: '#14B8A6', bg: '#E6FFFA', perm: null },
        { label: 'Reports', desc: 'View analytics and performance', href: '/teacher/reports', icon: BarChart3, color: '#64748B', bg: '#F1F5F9', perm: null },
    ];

    const filteredTools = teacherTools.filter(t => !t.perm || permissions.includes(t.perm));

    return (
        <DashboardLayout requiredRole="teacher">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={28} color="#4F60FF" /> Teaching Operations
                    </h1>
                    <p style={{ fontSize: '15px', color: '#5E6278', marginTop: '6px', fontWeight: 500 }}>
                        Your central hub for academic tools, grading, and material management.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {filteredTools.map((tool) => {
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

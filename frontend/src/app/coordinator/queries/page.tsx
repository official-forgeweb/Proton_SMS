'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import DashboardLayout from '@/components/DashboardLayout';
import StudentProfileEnquiries from '@/components/StudentProfileEnquiries';
import { MessageSquare } from 'lucide-react';

export default function CoordinatorQueriesPage() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', background: '#F8FAFC', borderRadius: '24px', paddingBottom: '120px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.25)' }}>
                                <MessageSquare size={20} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Student Support CRM
                            </h1>
                        </div>
                        <p style={{ color: '#5E6278', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                            Review, monitor, and resolve support requests logged by students.
                        </p>
                    </div>
                </div>

                {/* CRM Dashboard */}
                <StudentProfileEnquiries role="coordinator" />
            </div>
            <ToolBottomBar />
        </DashboardLayout>
    );
}

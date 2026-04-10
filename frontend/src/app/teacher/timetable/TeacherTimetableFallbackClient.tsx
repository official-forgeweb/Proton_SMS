'use client';
import { Calendar, AlertTriangle } from 'lucide-react';

interface Props {
  initialFilters: { start_date: string; end_date: string };
}

export default function TeacherTimetableFallbackClient({ initialFilters }: Props) {
    return (
        <>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>My Schedule</h1>
                        <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>Manage your upcoming classes.</p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div style={{ padding: '40px', textAlign: 'center', background: '#FFF5F5', borderRadius: '20px', border: '1px solid #FEE2E2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <AlertTriangle size={48} color="#E53935" />
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>Connection Issue</h3>
                    <p style={{ color: '#5E6278', maxWidth: '400px', margin: 0 }}>
                        We could not load your full schedule right now due to a network or database issue. Please try refreshing the page.
                    </p>
                </div>
            </div>
        </>
    );
}

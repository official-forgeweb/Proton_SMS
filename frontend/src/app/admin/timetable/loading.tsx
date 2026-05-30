import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '100px', height: '40px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '10px' }} />
                    </div>
                </div>

                {/* Calendar View Skeleton */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    {/* Days of week header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
                        ))}
                    </div>
                    {/* Time slots rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2, 3, 4, 5].map(row => (
                            <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
                                {[1, 2, 3, 4, 5, 6, 7].map(col => (
                                    <div key={col} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

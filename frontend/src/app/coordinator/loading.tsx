import DashboardLayout from '@/components/DashboardLayout';

export default function CoordinatorDashboardLoading() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div>
                    <div className="skeleton" style={{ width: '280px', height: '34px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '200px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                </div>

                {/* Funnel Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '70px', height: '10px', borderRadius: '4px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '50px', height: '24px', borderRadius: '8px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '6px', marginBottom: '20px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '220px', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>

                {/* Recent Items */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    <div className="skeleton" style={{ width: '180px', height: '18px', borderRadius: '8px', marginBottom: '20px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '10px' }} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

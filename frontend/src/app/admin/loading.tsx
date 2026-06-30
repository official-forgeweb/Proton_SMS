import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboardLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="dashboard-client-container">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '300px', height: '36px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '220px', height: '16px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ width: '120px', height: '40px', borderRadius: '12px' }} />
                        ))}
                    </div>
                </div>

                {/* Stats Grid (8 cards) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '18px' }}>
                            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px' }} />
                                <div className="skeleton" style={{ width: '100px', height: '26px', borderRadius: '8px', marginTop: '8px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics Charts Grid */}
                <div>
                    <div className="skeleton" style={{ width: '200px', height: '22px', borderRadius: '8px', marginBottom: '16px' }} />
                    <div className="dashboard-grid-2col">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                                <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: '6px', marginBottom: '16px' }} />
                                <div className="skeleton" style={{ width: '100%', height: '240px', borderRadius: '12px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity & Alerts */}
                <div className="dashboard-grid-2col">
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '200px', height: '18px', borderRadius: '8px', marginBottom: '20px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

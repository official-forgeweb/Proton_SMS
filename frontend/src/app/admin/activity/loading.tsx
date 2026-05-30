import DashboardLayout from '@/components/DashboardLayout';

export default function AdminActivityLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '0 8px 32px 8px' }}>
                {/* Header with back button */}
                <div style={{ padding: '24px 0 32px 0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '14px' }} />
                    <div>
                        <div className="skeleton" style={{ width: '120px', height: '22px', borderRadius: '20px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '280px', height: '28px', borderRadius: '10px', marginBottom: '6px' }} />
                        <div className="skeleton" style={{ width: '420px', height: '14px', borderRadius: '8px' }} />
                    </div>
                </div>

                {/* Search + Filter bar */}
                <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', marginBottom: '28px', border: '1px solid #F0F0F5' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="skeleton" style={{ flex: 1, minWidth: '280px', height: '48px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '200px', height: '48px', borderRadius: '12px' }} />
                    </div>
                </div>

                {/* Timeline log cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '8px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '240px', height: '12px', borderRadius: '6px', marginBottom: '10px' }} />
                                <div className="skeleton" style={{ width: '320px', height: '14px', borderRadius: '8px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '140px', height: '12px', borderRadius: '6px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

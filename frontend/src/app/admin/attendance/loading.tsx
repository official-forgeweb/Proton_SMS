import DashboardLayout from '@/components/DashboardLayout';

export default function AdminAttendanceLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '300px', height: '32px', borderRadius: '10px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '380px', height: '16px', borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '210px', height: '44px', borderRadius: '12px' }} />
                </div>

                {/* Filters bar */}
                <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '20px', border: '1px solid #F0F0F5', display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', alignItems: 'center' }}>
                    <div className="skeleton" style={{ flex: 1, minWidth: '300px', height: '44px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '150px', height: '44px', borderRadius: '10px' }} />
                </div>

                {/* Session cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #F0F0F5', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                                <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '20px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '180px', height: '18px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '200px', height: '14px', borderRadius: '8px', marginTop: '4px' }} />
                            <div style={{ borderTop: '1px solid #F0F0F5', paddingTop: '16px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '8px' }} />
                                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', background: '#f7f8fc', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '10px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '300px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '260px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '14px' }} />
                    </div>
                </div>

                {/* Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

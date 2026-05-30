import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="student">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '160px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '180px', height: '42px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '42px', borderRadius: '12px' }} />
                    </div>
                </div>

                {/* Main Content Box */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    {/* Search and Filters Bar */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div className="skeleton" style={{ width: '240px', height: '44px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '44px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '44px', borderRadius: '10px' }} />
                    </div>

                    {/* Table Skeleton */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '6px' }} />
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="skeleton" style={{ width: '100%', height: '54px', borderRadius: '10px' }} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

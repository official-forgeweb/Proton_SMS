import DashboardLayout from '@/components/DashboardLayout';

export default function AdminFeesLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '12px' }} />
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px', marginBottom: '10px' }} />
                            <div className="skeleton" style={{ width: '120px', height: '28px', borderRadius: '8px' }} />
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="skeleton" style={{ flex: 1, maxWidth: '300px', height: '44px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
                </div>

                {/* Table */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 100px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #F0F0F5' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '6px' }} />
                        ))}
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 100px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #FAFAFA' }}>
                            {[1, 2, 3, 4, 5, 6].map(j => (
                                <div key={j} className="skeleton" style={{ height: '16px', borderRadius: '6px' }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

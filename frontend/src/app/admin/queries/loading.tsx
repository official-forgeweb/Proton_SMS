import DashboardLayout from '@/components/DashboardLayout';

export default function AdminQueriesLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="bg-mesh" style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '240px', height: '28px', borderRadius: '10px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '380px', height: '15px', borderRadius: '8px' }} />
                    </div>
                </div>

                {/* CRM content skeleton */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', padding: '24px' }}>
                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '10px' }} />
                        ))}
                    </div>
                    {/* Search bar */}
                    <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '42px', borderRadius: '12px', marginBottom: '20px' }} />
                    {/* Query rows */}
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ padding: '16px', borderBottom: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: '8px', marginBottom: '6px' }} />
                                <div className="skeleton" style={{ width: '300px', height: '12px', borderRadius: '6px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '6px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

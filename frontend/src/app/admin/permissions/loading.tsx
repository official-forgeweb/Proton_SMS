import DashboardLayout from '@/components/DashboardLayout';

export default function AdminPermissionsLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <div className="skeleton" style={{ width: '220px', height: '24px', borderRadius: '10px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '380px', height: '14px', borderRadius: '8px' }} />
                </div>
            </div>

            <div className="page-body">
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', padding: '24px' }}>
                    {/* Search bar */}
                    <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '42px', borderRadius: '10px', marginBottom: '24px' }} />

                    {/* Teacher permission cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ border: '1px solid #F0F0F5', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Teacher header */}
                                <div style={{ padding: '16px 20px', background: '#F8F9FD', borderBottom: '1px solid #F0F0F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div>
                                            <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: '8px', marginBottom: '4px' }} />
                                            <div className="skeleton" style={{ width: '180px', height: '13px', borderRadius: '6px' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
                                        <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
                                        <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '10px' }} />
                                    </div>
                                </div>
                                {/* Permissions grid */}
                                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                    {[1, 2, 3, 4, 5, 6].map(j => (
                                        <div key={j} className="skeleton" style={{ height: '44px', borderRadius: '8px' }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

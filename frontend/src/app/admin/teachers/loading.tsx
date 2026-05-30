import DashboardLayout from '@/components/DashboardLayout';

export default function AdminTeachersLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '12px' }} />
                </div>

                {/* Search */}
                <div className="skeleton" style={{ maxWidth: '400px', height: '44px', borderRadius: '12px' }} />

                {/* Table */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #F0F0F5' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '6px' }} />
                        ))}
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #FAFAFA' }}>
                            {[1, 2, 3, 4, 5].map(j => (
                                <div key={j} className="skeleton" style={{ height: '16px', borderRadius: '6px' }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

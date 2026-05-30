import DashboardLayout from '@/components/DashboardLayout';

export default function AdminStudentsLoading() {
    return (
        <DashboardLayout requiredRole={['admin', 'coordinator']}>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '12px' }} />
                </div>

                {/* Filters Bar */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="skeleton" style={{ flex: 1, maxWidth: '400px', height: '44px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '120px', height: '44px', borderRadius: '12px' }} />
                </div>

                {/* Table */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    {/* Header row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 100px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #F0F0F5' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '14px', borderRadius: '6px' }} />
                        ))}
                    </div>
                    {/* Data rows */}
                    {Array.from({ length: 10 }).map((_, i) => (
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

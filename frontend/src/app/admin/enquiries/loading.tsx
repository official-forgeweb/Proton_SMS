import DashboardLayout from '@/components/DashboardLayout';

export default function AdminEnquiriesLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '12px' }} />
                </div>

                {/* Funnel Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px', border: '1px solid #F0F0F5', textAlign: 'center' as const }}>
                            <div className="skeleton" style={{ width: '70px', height: '10px', borderRadius: '4px', margin: '0 auto 10px' }} />
                            <div className="skeleton" style={{ width: '50px', height: '28px', borderRadius: '8px', margin: '0 auto' }} />
                        </div>
                    ))}
                </div>

                {/* Pipeline Kanban Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(col => (
                        <div key={col} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
                            <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '8px' }} />
                            {[1, 2, 3].map(card => (
                                <div key={card} style={{ background: '#FAFBFD', borderRadius: '14px', padding: '16px', border: '1px solid #EEEEF5', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                                    <div className="skeleton" style={{ width: '80%', height: '14px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '60%', height: '12px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '40%', height: '12px', borderRadius: '6px' }} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

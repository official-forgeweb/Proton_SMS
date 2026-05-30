import DashboardLayout from '@/components/DashboardLayout';

export default function CoordinatorQueriesLoading() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '140px', height: '42px', borderRadius: '12px' }} />
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px', marginBottom: '12px' }} />
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: '52px', borderRadius: '10px', marginBottom: '8px' }} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

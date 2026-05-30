import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                <div className="skeleton" style={{ width: '220px', height: '34px', borderRadius: '10px' }} />
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                            <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <div className="skeleton" style={{ width: '140px', height: '46px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '46px', borderRadius: '12px' }} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

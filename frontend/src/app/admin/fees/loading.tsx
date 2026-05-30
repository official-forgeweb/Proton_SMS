import DashboardLayout from '@/components/DashboardLayout';

export default function FeesLoading() {
    return (
        <DashboardLayout requiredRole={['admin', 'coordinator']}>
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px', marginTop: '8px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '12px' }} />
                </div>
                <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: '54px', borderRadius: '10px' }} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

import DashboardLayout from '@/components/DashboardLayout';

export default function ClassesLoading() {
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="skeleton" style={{ width: '100px', height: '20px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '6px' }} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <div className="skeleton" style={{ flex: 1, height: '36px', borderRadius: '10px' }} />
                                <div className="skeleton" style={{ flex: 1, height: '36px', borderRadius: '10px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

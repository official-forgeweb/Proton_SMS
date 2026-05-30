import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="skeleton" style={{ width: '180px', height: '32px', borderRadius: '10px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '8px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '6px' }} />
                        {[1, 2, 3].map(i => (<div key={i} className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '8px' }} />))}
                    </div>
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '8px' }} />
                        {[1, 2, 3, 4, 5].map(i => (<div key={i} className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

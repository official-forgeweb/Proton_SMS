import DashboardLayout from '@/components/DashboardLayout';

export default function CoordinatorEnquiryDetailLoading() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '10px' }} />
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '140px', height: '16px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '220px', height: '16px', borderRadius: '6px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

import DashboardLayout from '@/components/DashboardLayout';

export default function CoordinatorEnquiryRemarkLoading() {
    return (
        <DashboardLayout requiredRole="coordinator">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '10px' }} />
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '46px', borderRadius: '12px', marginTop: '12px' }} />
                </div>
            </div>
        </DashboardLayout>
    );
}

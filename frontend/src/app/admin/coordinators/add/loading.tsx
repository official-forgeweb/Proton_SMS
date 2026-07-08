import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#F4F5F9', minHeight: 'calc(100vh - 100px)' }}>
                {/* Breadcrumb skeleton */}
                <div style={{ width: '100%', maxWidth: '1100px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="skeleton" style={{ width: '14px', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '2px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px' }} />
                        <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '2px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '12px', borderRadius: '6px' }} />
                    </div>
                </div>

                {/* Main card skeleton */}
                <div style={{ width: '100%', maxWidth: '1100px', background: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #F0F0F5', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                    {/* Header skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F0F5', paddingBottom: '20px', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
                            <div>
                                <div className="skeleton" style={{ width: '200px', height: '22px', borderRadius: '8px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '280px', height: '14px', borderRadius: '6px' }} />
                            </div>
                        </div>
                        <div className="skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
                    </div>

                    {/* Personal Information Section */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '160px', height: '18px', borderRadius: '8px' }} />
                        </div>
                        {/* Full Name - full width */}
                        <div style={{ marginBottom: '24px' }}>
                            <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
                        </div>
                        {/* Two column fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i}>
                                    <div className="skeleton" style={{ width: '110px', height: '12px', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account Settings Section */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                            <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                            <div className="skeleton" style={{ width: '140px', height: '18px', borderRadius: '8px' }} />
                        </div>
                        <div style={{ maxWidth: '50%' }}>
                            <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '6px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
                        </div>
                    </div>

                    {/* Footer action buttons skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #F0F0F5', paddingTop: '16px', marginTop: '32px' }}>
                        <div className="skeleton" style={{ width: '90px', height: '44px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '10px' }} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

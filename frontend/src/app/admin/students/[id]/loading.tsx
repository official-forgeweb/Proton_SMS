import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                {/* Back button and title */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '10px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {/* Left Column Profile info card */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div className="skeleton" style={{ width: '96px', height: '96px', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <div className="skeleton" style={{ width: '160px', height: '20px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '6px' }} />
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#F0F0F5', margin: '8px 0' }} />
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '6px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column details list */}
                    <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="skeleton" style={{ width: '150px', height: '18px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '10px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

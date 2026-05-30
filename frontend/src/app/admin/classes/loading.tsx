import DashboardLayout from '@/components/DashboardLayout';

export default function AdminClassesLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '12px' }} />
                </div>

                {/* Class cohort cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '8px' }} />
                                <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '20px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '100%', height: '1px' }} />
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px', marginBottom: '6px' }} />
                                    <div className="skeleton" style={{ width: '40px', height: '18px', borderRadius: '6px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px', marginBottom: '6px' }} />
                                    <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '6px' }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '10px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

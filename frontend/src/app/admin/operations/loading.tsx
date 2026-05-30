import DashboardLayout from '@/components/DashboardLayout';

export default function AdminOperationsLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '120px' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div className="skeleton" style={{ width: '260px', height: '28px', borderRadius: '10px', marginBottom: '10px' }} />
                    <div className="skeleton" style={{ width: '440px', height: '15px', borderRadius: '8px' }} />
                </div>

                {/* Tool cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '130px', height: '16px', borderRadius: '8px', marginBottom: '6px' }} />
                                <div className="skeleton" style={{ width: '180px', height: '13px', borderRadius: '6px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

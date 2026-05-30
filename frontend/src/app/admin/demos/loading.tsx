import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDemosLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <div className="skeleton" style={{ width: '200px', height: '24px', borderRadius: '10px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '340px', height: '14px', borderRadius: '8px' }} />
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #F0F0F5', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px', marginBottom: '6px' }} />
                                    <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '8px' }} />
                                </div>
                                <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="skeleton" style={{ width: '140px', height: '13px', borderRadius: '6px' }} />
                                <div className="skeleton" style={{ width: '100px', height: '13px', borderRadius: '6px' }} />
                                <div className="skeleton" style={{ width: '180px', height: '13px', borderRadius: '6px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '10px', marginTop: '16px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

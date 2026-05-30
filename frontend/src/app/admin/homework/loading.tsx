import DashboardLayout from '@/components/DashboardLayout';

export default function AdminHomeworkLoading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '260px', height: '24px', borderRadius: '10px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '280px', height: '13px', borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '170px', height: '42px', borderRadius: '12px' }} />
                </div>

                {/* Table card */}
                <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0F0F5', overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{ background: '#F8F9FD', padding: '13px 16px' }}>
                        <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '8px' }} />
                    </div>
                    {/* Table rows */}
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ flex: 2 }}>
                                <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '8px', marginBottom: '4px' }} />
                                <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '6px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '50px', flex: 1 }} />
                            <div className="skeleton" style={{ width: '100px', height: '13px', borderRadius: '6px', flex: 1 }} />
                            <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '50px', flex: 1 }} />
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="skeleton" style={{ width: '80px', height: '6px', borderRadius: '50px' }} />
                                <div className="skeleton" style={{ width: '30px', height: '12px', borderRadius: '6px' }} />
                            </div>
                            <div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: '8px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

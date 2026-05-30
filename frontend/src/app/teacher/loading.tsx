import DashboardLayout from '@/components/DashboardLayout';

export default function TeacherDashboardLoading() {
    return (
        <DashboardLayout requiredRole="teacher">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div>
                    <div className="skeleton" style={{ width: '260px', height: '34px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '40px', height: '22px', borderRadius: '6px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Today's Timetable */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    <div className="skeleton" style={{ width: '200px', height: '18px', borderRadius: '8px', marginBottom: '20px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', borderRadius: '14px', background: '#FAFBFD', border: '1px solid #EEEEF5' }}>
                                <div className="skeleton" style={{ width: '60px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '6px', marginBottom: '6px' }} />
                                    <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '6px' }} />
                                </div>
                                <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '150px', height: '14px', borderRadius: '6px', marginBottom: '16px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

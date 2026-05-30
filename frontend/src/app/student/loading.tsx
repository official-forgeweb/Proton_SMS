import DashboardLayout from '@/components/DashboardLayout';

export default function StudentDashboardLoading() {
    return (
        <DashboardLayout requiredRole="student">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1400px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header */}
                <div>
                    <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                </div>

                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #F0F0F5', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: '70px', height: '10px', borderRadius: '4px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '50px', height: '22px', borderRadius: '6px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Performance & Attendance Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '6px', marginBottom: '16px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>

                {/* Recent Tests & Homework */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '8px', marginBottom: '16px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="skeleton" style={{ width: '100%', height: '52px', borderRadius: '12px' }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Classes & Fee */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                            <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '8px', marginBottom: '16px' }} />
                            <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

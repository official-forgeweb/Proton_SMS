import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', margin: '0 auto', maxWidth: '1600px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header: Back Link + Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '130px', height: '14px', borderRadius: '4px', marginBottom: '14px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '22px', borderRadius: '20px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '380px', height: '34px', borderRadius: '10px', marginBottom: '10px' }} />
                        <div className="skeleton" style={{ width: '300px', height: '14px', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '44px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
                    </div>
                </div>

                {/* KPI Cards Row (4 cards) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ background: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', height: '98px' }}>
                            <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '16px' }} />
                            <div>
                                <div className="skeleton" style={{ width: '120px', height: '13px', borderRadius: '6px', marginBottom: '8px' }} />
                                <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '8px' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Two Column Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '32px', alignItems: 'start' }}>
                    {/* Left Column (Batch Specs) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' }}>
                            <div className="skeleton" style={{ width: '160px', height: '18px', borderRadius: '8px', marginBottom: '24px' }} />
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                                    <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '6px' }} />
                                </div>
                            ))}
                        </div>

                        {/* Timetable config list skeleton */}
                        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' }}>
                            <div className="skeleton" style={{ width: '130px', height: '16px', borderRadius: '8px', marginBottom: '20px' }} />
                            {[1, 2].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className="skeleton" style={{ width: '12px', height: '12px', borderRadius: '50%' }} />
                                    <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '10px' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (Tabs + Roster list) */}
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0' }}>
                        {/* Tab Headers */}
                        <div style={{ display: 'flex', gap: '28px', borderBottom: '2px solid #F1F5F9', paddingBottom: '12px', marginBottom: '24px' }}>
                            <div className="skeleton" style={{ width: '180px', height: '16px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '6px' }} />
                            <div className="skeleton" style={{ width: '180px', height: '16px', borderRadius: '6px' }} />
                        </div>

                        {/* Search bar inside list */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div className="skeleton" style={{ width: '280px', height: '40px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '140px', height: '14px', borderRadius: '6px' }} />
                        </div>

                        {/* Students list rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: '100%',
                                        height: '56px',
                                        borderRadius: '12px',
                                        opacity: 1 - i * 0.12,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

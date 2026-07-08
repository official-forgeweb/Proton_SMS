import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header — Title + Export Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '240px', height: '34px', borderRadius: '10px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '300px', height: '14px', borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton" style={{ width: '200px', height: '48px', borderRadius: '14px' }} />
                </div>

                {/* Charts Grid — 2x2 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {[
                        { color: 'rgba(139, 92, 246, 0.1)', label: 170 },
                        { color: 'rgba(16, 185, 129, 0.1)', label: 190 },
                        { color: 'rgba(59, 130, 246, 0.1)', label: 180 },
                        { color: 'rgba(245, 158, 11, 0.1)', label: 170 },
                    ].map((chart, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: 'rgba(255, 255, 255, 0.88)',
                                border: '1px solid rgba(255, 255, 255, 0.7)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                borderRadius: '24px',
                                padding: '28px',
                            }}
                        >
                            {/* Chart header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                                <div className="skeleton" style={{ width: `${chart.label}px`, height: '18px', borderRadius: '8px' }} />
                            </div>
                            {/* Chart area placeholder */}
                            <div style={{ height: '260px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 20px' }}>
                                {idx % 2 === 0 ? (
                                    /* Pie chart placeholder */
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <div className="skeleton" style={{ width: '180px', height: '180px', borderRadius: '50%' }} />
                                    </div>
                                ) : (
                                    /* Bar chart placeholder */
                                    <>
                                        {[65, 85, 50, 90, 70, 55].map((h, i) => (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <div className="skeleton" style={{ width: '100%', height: `${h}%`, borderRadius: '6px 6px 0 0', minHeight: '40px' }} />
                                                <div className="skeleton" style={{ width: '32px', height: '10px', borderRadius: '4px' }} />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detailed Data Exports Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '180px', height: '22px', borderRadius: '8px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.88)',
                                    border: '1px solid rgba(255, 255, 255, 0.7)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                    borderRadius: '24px',
                                    padding: '28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div className="skeleton" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '24px' }} />
                                <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '8px', marginBottom: '10px' }} />
                                <div className="skeleton" style={{ width: '100%', height: '12px', borderRadius: '6px', marginBottom: '6px' }} />
                                <div className="skeleton" style={{ width: '80%', height: '12px', borderRadius: '6px', marginBottom: '28px' }} />
                                <div style={{ borderTop: '1px solid #F0F0F5', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px' }} />
                                    <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

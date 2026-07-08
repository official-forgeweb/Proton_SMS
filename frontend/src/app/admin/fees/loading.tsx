import DashboardLayout from '@/components/DashboardLayout';

export default function FeesLoading() {
    return (
        <DashboardLayout requiredRole={['admin', 'coordinator']}>
            <div style={{ padding: '32px', width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                            <div className="skeleton" style={{ width: '240px', height: '34px', borderRadius: '10px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '280px', height: '14px', borderRadius: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '180px', height: '44px', borderRadius: '14px' }} />
                    </div>
                </div>

                {/* Stats Section — 4 cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {/* Stat Card 1 (Collected - green/emerald theme) */}
                    <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '24px', padding: '24px', opacity: 0.85 }}>
                        <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px', opacity: 0.5, marginBottom: '12px' }} />
                        <div className="skeleton" style={{ width: '180px', height: '36px', borderRadius: '10px', opacity: 0.6, marginBottom: '16px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '22px', borderRadius: '50px', opacity: 0.5 }} />
                    </div>

                    {/* Stat Card 2 (Pending - red/rose theme) */}
                    <div style={{ background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', borderRadius: '24px', padding: '24px', opacity: 0.85 }}>
                        <div className="skeleton" style={{ width: '110px', height: '14px', borderRadius: '6px', opacity: 0.5, marginBottom: '12px' }} />
                        <div className="skeleton" style={{ width: '165px', height: '36px', borderRadius: '10px', opacity: 0.6, marginBottom: '16px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '22px', borderRadius: '50px', opacity: 0.5 }} />
                    </div>

                    {/* Stat Card 3 (Fully paid accounts) */}
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 8px 32px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '144px' }}>
                        <div>
                            <div className="skeleton" style={{ width: '140px', height: '13px', borderRadius: '6px', marginBottom: '14px' }} />
                            <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '110px', height: '24px', borderRadius: '50px' }} />
                    </div>

                    {/* Stat Card 4 (Defaulters) */}
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 8px 32px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '144px' }}>
                        <div>
                            <div className="skeleton" style={{ width: '130px', height: '13px', borderRadius: '6px', marginBottom: '14px' }} />
                            <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '8px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '50px' }} />
                    </div>
                </div>

                {/* Table Section */}
                <div style={{ background: '#FFFFFF', borderRadius: '28px', padding: '20px', border: '1px solid #F0F0F5', boxShadow: '0 12px 40px rgba(0,0,0,0.03)' }}>
                    {/* Subheader */}
                    <div style={{ padding: '8px 12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', marginBottom: '12px' }}>
                        <div>
                            <div className="skeleton" style={{ width: '220px', height: '22px', borderRadius: '8px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ width: '280px', height: '13px', borderRadius: '6px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '280px', height: '42px', borderRadius: '14px' }} />
                    </div>

                    {/* Segment Filters Row */}
                    <div style={{ display: 'flex', gap: '8px', padding: '8px 12px 20px', borderBottom: '1px solid #F1F5F9', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {[130, 100, 90, 140, 100, 160].map((w, idx) => (
                            <div key={idx} className="skeleton" style={{ width: `${w}px`, height: '36px', borderRadius: '10px' }} />
                        ))}
                    </div>

                    {/* Table Rows skeleton */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div
                                key={i}
                                className="skeleton"
                                style={{
                                    width: '100%',
                                    height: '56px',
                                    borderRadius: '12px',
                                    opacity: 1 - i * 0.1,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

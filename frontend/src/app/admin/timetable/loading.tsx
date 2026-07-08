import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ padding: '32px', width: '100%', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header — Title + Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div className="skeleton" style={{ width: '280px', height: '36px', borderRadius: '10px' }} />
                        <div className="skeleton" style={{ width: '260px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        <div className="skeleton" style={{ width: '200px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '150px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '150px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '130px', height: '44px', borderRadius: '14px' }} />
                    </div>
                </div>

                {/* Filter Bar */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px 20px', border: '1px solid #F0F0F5', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '10px' }} />
                    <div style={{ flex: 1 }} />
                    <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '10px' }} />
                </div>

                {/* Week Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '220px', height: '24px', borderRadius: '8px' }} />
                    <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                </div>

                {/* Timetable Grid — Days of Week Header + Time Slots */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                    {/* Day columns header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '6px', margin: '0 auto 6px' }} />
                                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto' }} />
                            </div>
                        ))}
                    </div>

                    {/* Time slot rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                        {Array.from({ length: 35 }).map((_, i) => (
                            <div
                                key={i}
                                className="skeleton"
                                style={{
                                    height: i % 7 < 5 ? '90px' : '70px',
                                    borderRadius: '14px',
                                    opacity: i % 7 >= 5 ? 0.5 : 1,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Today's Schedule Summary */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1px solid #F0F0F5' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                        <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '160px', height: '18px', borderRadius: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ width: '220px', height: '70px', borderRadius: '14px' }} />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

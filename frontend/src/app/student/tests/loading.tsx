import DashboardLayout from '@/components/DashboardLayout';

export default function Loading() {
    return (
        <DashboardLayout requiredRole="student">
            <div style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px', background: '#f7f8fc', display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-pulse">
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <div className="skeleton" style={{ width: '240px', height: '32px', borderRadius: '10px' }} />
                    <div className="skeleton" style={{ width: '400px', height: '14px', borderRadius: '8px', marginTop: '10px' }} />
                </div>

                {/* Stats Skeletons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '96px', borderRadius: '20px', background: '#FFFFFF', border: '1px solid rgba(226, 232, 240, 0.8)' }} />
                    ))}
                </div>

                {/* Grid Skeletons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', width: '100%' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ 
                            height: '280px', 
                            borderRadius: '24px', 
                            border: '1px solid rgba(226, 232, 240, 0.8)', 
                            background: 'rgba(255,255,255,0.6)'
                        }} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

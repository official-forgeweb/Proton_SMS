'use client';

interface PageSkeletonProps {
    type?: 'dashboard' | 'table' | 'form';
}

export default function PageSkeleton({ type = 'table' }: PageSkeletonProps) {
    const pulseStyle = {
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmerPulse 1.5s infinite linear',
        borderRadius: '8px'
    };

    const shimmerKeyframes = `
        @keyframes shimmerPulse {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '24px', position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: shimmerKeyframes }} />

            {/* Common Header Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ ...pulseStyle, width: '280px', height: '28px' }} />
                    <div style={{ ...pulseStyle, width: '180px', height: '14px' }} />
                </div>
                <div style={{ ...pulseStyle, width: '120px', height: '40px', borderRadius: '10px' }} />
            </div>

            {type === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Stat Cards Skeleton */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ ...pulseStyle, width: '44px', height: '44px', borderRadius: '10px' }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ ...pulseStyle, width: '60px', height: '10px' }} />
                                    <div style={{ ...pulseStyle, width: '90px', height: '22px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Grid Skeletons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', height: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ ...pulseStyle, width: '150px', height: '14px' }} />
                            <div style={{ ...pulseStyle, width: '100%', height: '100%', borderRadius: '10px' }} />
                        </div>
                        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', height: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ ...pulseStyle, width: '120px', height: '14px' }} />
                            {[1, 2, 3, 4].map(j => (
                                <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ ...pulseStyle, width: '32px', height: '32px', borderRadius: '50%' }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ ...pulseStyle, width: '100%', height: '10px' }} />
                                        <div style={{ ...pulseStyle, width: '40px', height: '8px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {type === 'table' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Table Filters Skeleton */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FFFFFF', borderRadius: '12px', padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                        <div style={{ ...pulseStyle, width: '200px', height: '36px', borderRadius: '8px' }} />
                        <div style={{ ...pulseStyle, width: '120px', height: '36px', borderRadius: '8px' }} />
                        <div style={{ ...pulseStyle, width: '120px', height: '36px', borderRadius: '8px' }} />
                    </div>
                    {/* Table Grid Skeleton */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ background: '#F8FAFC', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '20px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ ...pulseStyle, width: '100px', height: '12px' }} />
                            ))}
                        </div>
                        <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[1, 2, 3, 4, 5, 6].map(j => (
                                <div key={j} style={{ padding: '12px 0', borderBottom: j < 6 ? '1px solid #F1F5F9' : 'none', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ ...pulseStyle, width: '120px', height: '14px' }} />
                                    <div style={{ ...pulseStyle, width: '80px', height: '12px' }} />
                                    <div style={{ ...pulseStyle, width: '140px', height: '14px' }} />
                                    <div style={{ ...pulseStyle, width: '100px', height: '14px' }} />
                                    <div style={{ ...pulseStyle, width: '40px', height: '12px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {type === 'form' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Collapsible Card Block 1 */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ ...pulseStyle, width: '140px', height: '16px' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ ...pulseStyle, width: '80px', height: '10px' }} />
                                    <div style={{ ...pulseStyle, width: '100%', height: '42px', borderRadius: '8px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Collapsible Card Block 2 */}
                    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ ...pulseStyle, width: '160px', height: '16px' }} />
                        <div style={{ ...pulseStyle, width: '100%', height: '120px', borderRadius: '10px' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

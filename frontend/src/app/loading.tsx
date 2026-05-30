export default function Loading() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8F9FD', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #F0F0F5', borderTopColor: '#E53935', borderRadius: '50%', animation: 'spin 1s infinite linear' }} />
            <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Loading system...</div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
}

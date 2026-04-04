'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, serverError, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !serverError) {
      if (isAuthenticated && user) {
        router.push(`/${user.role}`);
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, serverError]);

  return (
    <div className="bg-mesh" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column',
        position: 'relative', overflow: 'hidden'
    }}>
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulseWhite {
                0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4); transform: scale(0.98); }
                70% { box-shadow: 0 0 0 20px rgba(229, 57, 53, 0); transform: scale(1); }
                100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); transform: scale(0.98); }
            }
            @keyframes floatWhite {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
            }
            @keyframes shimmerSplash {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            @keyframes loadProgress {
                0% { width: 0%; opacity: 0; }
                20% { width: 30%; opacity: 1; }
                50% { width: 60%; }
                80% { width: 85%; }
                100% { width: 100%; opacity: 1; }
            }
            .splash-loader-icon {
                animation: pulseWhite 2s infinite ease-in-out, floatWhite 3s infinite ease-in-out;
            }
            .loading-splash-text {
                background: linear-gradient(90deg, #FFFFFF 0%, #E53935 50%, #FFFFFF 100%);
                background-size: 200% auto;
                color: transparent;
                -webkit-background-clip: text;
                background-clip: text;
                animation: shimmerSplash 2s linear infinite;
            }
            .glass-panel-splash {
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(24px);
                border: 1px solid rgba(255, 255, 255, 0.8);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.02);
                padding: 40px;
                border-radius: 24px;
            }
        `}} />
        
        {/* Glow rings */}
        <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
        }}>
            <div style={{
                position: 'absolute', width: '800px', height: '800px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(229,57,53,0.06) 0%, transparent 60%)',
                top: '-300px', right: '-200px', filter: 'blur(40px)'
            }} />
        </div>

        <div className="glass-panel-splash" style={{ textAlign: 'center', zIndex: 10, position: 'relative', width: '360px' }}>
            <div className="splash-loader-icon" style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', boxShadow: '0 12px 32px rgba(229, 57, 53, 0.3)'
            }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
            </div>
            
            <h2 className="loading-splash-text" style={{ 
                fontSize: '26px', fontWeight: 800, margin: '0 0 32px 0',
                fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em',
                background: 'none', color: '#0F172A', WebkitTextFillColor: '#0F172A'
            }}>
                Proton LMS
            </h2>
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>
                        INITIALIZING SYSTEM...
                    </p>
                    <span style={{ color: '#E53935', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>•••</span>
                </div>
                
                {/* Custom advanced progress bar */}
                <div style={{ 
                    width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', 
                    borderRadius: '100px', overflow: 'hidden', position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%',
                        background: 'linear-gradient(90deg, #B71C1C 0%, #E53935 100%)',
                        borderRadius: '100px', animation: 'loadProgress 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                    }} />
                </div>
            </div>
        </div>
    </div>
  );
}

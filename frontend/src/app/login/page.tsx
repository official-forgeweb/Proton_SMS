'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, GraduationCap, Mail, Lock, Hash, ArrowRight, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [loginMethod, setLoginMethod] = useState<'email' | 'proId'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [proId, setProId] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (loginMethod === 'proId') {
                await login('', password, proId);
            } else {
                await login(email, password);
            }
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            toast.success('Welcome back!');
            setTimeout(() => router.push(`/${user.role}`), 500);
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" suppressHydrationWarning>
            <Toaster position="top-center"
                toastOptions={{
                    style: { background: '#FFFFFF', color: '#1E293B', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }
                }}
            />

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
                @keyframes gradient-pulse { 0% { opacity: 0.45; } 100% { opacity: 0.75; } }
                
                .login-container {
                    display: flex;
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                    background: #FAFAFC;
                    font-family: 'Inter', sans-serif;
                }
                
                .login-left {
                    width: 55%;
                    height: 100vh;
                    background: #080A10;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 64px;
                    color: #FFFFFF;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .login-right {
                    width: 45%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: #FFFFFF;
                    position: relative;
                    padding: 40px;
                }
                
                .glow-blob-1 {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(229, 57, 53, 0.15) 0%, transparent 70%);
                    top: -200px;
                    left: -100px;
                    filter: blur(40px);
                    animation: gradient-pulse 6s infinite alternate;
                    pointer-events: none;
                }
                
                .glow-blob-2 {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
                    bottom: -200px;
                    right: -100px;
                    filter: blur(40px);
                    animation: gradient-pulse 8s infinite alternate-reverse;
                    pointer-events: none;
                }
                
                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 32px 32px;
                    pointer-events: none;
                }
                
                .glass-mockup {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.45);
                    width: 100%;
                    max-width: 440px;
                    margin-top: 32px;
                    transform: perspective(1000px) rotateX(8deg) rotateY(-4deg) rotateZ(1deg);
                    animation: float 6s ease-in-out infinite;
                }
                
                .login-form-wrapper {
                    width: 100%;
                    max-width: 380px;
                    display: flex;
                    flex-direction: column;
                }
                
                .login-input-group {
                    position: relative;
                    margin-bottom: 20px;
                }
                
                .login-input {
                    width: 100%;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    color: #1E293B;
                    padding: 14px 16px 14px 44px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 500;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .login-input:focus {
                    background: #FFFFFF;
                    border-color: #E53935;
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08);
                }
                
                .login-input::placeholder {
                    color: #94A3B8;
                }
                
                .method-toggle-container {
                    display: flex;
                    gap: 6px;
                    background: #F1F5F9;
                    padding: 4px;
                    border-radius: 12px;
                    margin-bottom: 28px;
                    border: 1px solid #E2E8F0;
                }
                
                .method-toggle-btn {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #64748B;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                
                .method-toggle-btn.active {
                    background: #FFFFFF;
                    color: #1E293B;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
                }
                
                .login-btn {
                    background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    width: 100%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 8px 24px rgba(229, 57, 53, 0.25);
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(229, 57, 53, 0.35);
                }
                
                .login-btn:active {
                    transform: translateY(0);
                }
                
                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                @media (max-width: 768px) {
                    .login-left {
                        display: none !important;
                    }
                    .login-right {
                        width: 100% !important;
                        padding: 24px;
                    }
                }
            `}} />

            {/* Left branding panel */}
            <div className="login-left">
                <div className="glow-blob-1" />
                <div className="glow-blob-2" />
                <div className="grid-overlay" />

                {/* Header branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 5 }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(229,57,53,0.3)'
                    }}>
                        <GraduationCap size={20} color="white" />
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Proton SMS</span>
                </div>

                {/* Taglines */}
                <div style={{ position: 'relative', zIndex: 5, margin: 'auto 0' }}>
                    <h1 style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', maxWidth: '480px' }}>
                        Manage Your Institute Smarter
                    </h1>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '16px', maxWidth: '440px', lineHeight: 1.5 }}>
                        Modern ERP for Coaching & Institutes. Track Students, Fees, Attendance & Operations in real-time.
                    </p>

                    {/* Cyber glass dashboard skeleton mockup */}
                    <div className="glass-mockup">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }} />
                            <div style={{ width: '60px', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ width: '20px', height: '20px', background: 'rgba(229, 57, 53, 0.2)', borderRadius: '6px', marginBottom: '8px' }} />
                                <div style={{ width: '50%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '6px' }} />
                                <div style={{ width: '70%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }} />
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ width: '20px', height: '20px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '6px', marginBottom: '8px' }} />
                                <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '6px' }} />
                                <div style={{ width: '80%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }} />
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '90%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />
                    </div>
                </div>

                {/* Footer terms */}
                <div suppressHydrationWarning style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 5, fontWeight: 500 }}>
                    © {new Date().getFullYear()} Proton LMS. Enterprise Grade Institute Management.
                </div>
            </div>

            {/* Right form panel */}
            <div className="login-right">
                <div className="login-form-wrapper">
                    
                    {/* Centered graduation logo cap */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                            boxShadow: '0 8px 20px rgba(229,57,53,0.2)', border: '1px solid rgba(255,255,255,0.5)'
                        }}>
                            <GraduationCap size={28} color="white" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', margin: 0 }}>
                            Sign in to Proton SMS
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px', fontWeight: 500, textAlign: 'center' }}>
                            Enter your credentials to access your administrative workspace
                        </p>
                    </div>

                    {/* Method toggler */}
                    <div className="method-toggle-container">
                        <button suppressHydrationWarning className={"method-toggle-btn " + (loginMethod === 'email' ? 'active' : '')} onClick={() => setLoginMethod('email')}>
                            <Mail size={15} /> Email Workspace
                        </button>
                        <button suppressHydrationWarning className={"method-toggle-btn " + (loginMethod === 'proId' ? 'active' : '')} onClick={() => setLoginMethod('proId')}>
                            <Hash size={15} /> PRO Identity
                        </button>
                    </div>

                    {/* Input form */}
                    <form suppressHydrationWarning onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                        {loginMethod === 'email' ? (
                            <div className="login-input-group">
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                                <input
                                    suppressHydrationWarning
                                    type="email" className="login-input" placeholder="e.g., admin@proton.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required
                                />
                            </div>
                        ) : (
                            <div className="login-input-group">
                                <Hash size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                                <input
                                    suppressHydrationWarning
                                    type="text" className="login-input" placeholder="e.g., PRO102 or EMP203"
                                    value={proId} onChange={(e) => setProId(e.target.value)} required
                                />
                            </div>
                        )}

                        <div className="login-input-group" style={{ marginBottom: '14px' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                            <input
                                suppressHydrationWarning
                                type={showPassword ? 'text' : 'password'} className="login-input" placeholder="Enter security password"
                                value={password} onChange={(e) => setPassword(e.target.value)} required
                            />
                            <button
                                suppressHydrationWarning
                                type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <a href="#" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
                               onMouseEnter={e => e.currentTarget.style.color = '#E53935'}
                               onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
                                Forgot password?
                            </a>
                        </div>

                        <button suppressHydrationWarning type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? (
                                <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : (
                                <>Sign In to Workspace <ArrowRight size={16} strokeWidth={2.5} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                        <p style={{ color: '#94A3B8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 500, margin: 0 }}>
                            <ShieldCheck size={14} color="#10B981" /> Encrypted end-to-end user session
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

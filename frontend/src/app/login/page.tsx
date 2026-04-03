'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, GraduationCap, Mail, Lock, Hash, ArrowRight } from 'lucide-react';
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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0B0F19',
            backgroundImage: `
                radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%)
            `,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>
            <Toaster position="top-center"
                toastOptions={{
                    style: { background: '#1E293B', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }
                }}
            />

            {/* Premium Background Elements */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '800px', height: '800px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(229,57,53,0.08) 0%, transparent 60%)',
                    top: '-300px', right: '-200px', filter: 'blur(40px)', animation: 'pulse 10s infinite alternate'
                }} />
                <div style={{
                    position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 60%)',
                    bottom: '-200px', left: '-100px', filter: 'blur(40px)', animation: 'pulse 8s infinite alternate-reverse'
                }} />
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 1; transform: scale(1.1); } }
                @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
                .glass-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .login-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                    padding: 14px 16px 14px 44px;
                    border-radius: 12px;
                    font-size: 15px;
                    transition: all 0.3s ease;
                }
                .login-input:focus {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: #E53935;
                    outline: none;
                    box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.1);
                }
                .login-input::placeholder { color: #64748B; }
                
                .method-btn {
                    flex: 1; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 600;
                    color: #94A3B8; background: transparent; border: 1px solid transparent; cursor: pointer;
                    transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .method-btn.active {
                    background: rgba(229, 57, 53, 0.1); color: #E53935; border-color: rgba(229, 57, 53, 0.2);
                }
                .method-btn:hover:not(.active) { color: white; background: rgba(255,255,255,0.05); }

                .login-button {
                    background: linear-gradient(135deg, #E53935 0%, #B71C1C 100%);
                    color: white; border: none; padding: 16px; border-radius: 12px;
                    font-size: 15px; font-weight: 700; width: 100%; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 25px -4px rgba(229, 57, 53, 0.4);
                }
                .login-button:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -4px rgba(229, 57, 53, 0.5); }
                .login-button:active { transform: translateY(0); }
                .login-button:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
            `}} />

            <div className="glass-card animate-fade-in" style={{
                width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '48px 40px',
                position: 'relative', zIndex: 10, margin: '20px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'float 6s ease-in-out infinite' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
                        boxShadow: '0 12px 24px -6px rgba(229,57,53,0.5)', border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <GraduationCap size={32} color="white" strokeWidth={2.5} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        Proton LMS
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '15px' }}>
                        Sign in to access your workspace
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px', marginBottom: '32px' }}>
                    <button className={"method-btn " + (loginMethod === 'email' ? 'active' : '')} onClick={() => setLoginMethod('email')}>
                        <Mail size={16} /> Email
                    </button>
                    <button className={"method-btn " + (loginMethod === 'proId' ? 'active' : '')} onClick={() => setLoginMethod('proId')}>
                        <Hash size={16} /> User ID
                    </button>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loginMethod === 'email' ? (
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                            <input
                                type="email" className="login-input" placeholder="alice@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                            />
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <Hash size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                            <input
                                type="text" className="login-input" placeholder="e.g., PRO123 or EMP456"
                                value={proId} onChange={(e) => setProId(e.target.value)} required
                            />
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                            type={showPassword ? 'text' : 'password'} className="login-input" placeholder="Enter your password"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                        />
                        <button
                            type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px',
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                        <a href="#" style={{ color: '#94A3B8', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                           onMouseEnter={e => e.currentTarget.style.color = 'white'}
                           onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>
                            Forgot password?
                        </a>
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading} style={{ marginTop: '8px' }}>
                        {isLoading ? (
                            <div style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <>Sign In <ArrowRight size={18} strokeWidth={2.5} /></>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <p style={{ color: '#64748B', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Lock size={12} /> Secure 256-bit encryption
                    </p>
                </div>
            </div>
        </div>
    );
}

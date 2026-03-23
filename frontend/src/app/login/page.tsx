'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, GraduationCap, Mail, Lock, Hash, ArrowRight, Sparkles } from 'lucide-react';
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

    const quickLogin = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await login(email, pass);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            toast.success(`Logged in as ${user.role}`);
            setTimeout(() => router.push(`/${user.role}`), 500);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #1E3A5F 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <Toaster position="top-center" />

            {/* Animated background elements */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(229,57,53,0.15) 0%, transparent 70%)',
                    top: '-200px', right: '-100px',
                }} />
                <div style={{
                    position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(198,40,40,0.1) 0%, transparent 70%)',
                    bottom: '-100px', right: '-100px',
                }} />
                <div style={{
                    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                    top: '20%', right: '20%',
                }} />
                {/* Grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }} />
            </div>

            {/* Left side - Branding */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '60px', position: 'relative', zIndex: 1,
            }} className="hidden md:flex">
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: '#E53935', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(229,57,53,0.3)',
                        }}>
                            <GraduationCap size={28} strokeWidth={2} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                Proton LMS
                            </h1>
                            <p style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
                                Learning Management System
                            </p>
                        </div>
                    </div>

                    <h2 style={{
                        fontSize: '48px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1,
                        fontFamily: 'Poppins', maxWidth: '500px', marginBottom: '24px', letterSpacing: '-1px'
                    }}>
                        Empowering<br />
                        <span style={{ color: '#E53935' }}>Education</span> Through<br />
                        Technology
                    </h2>

                    <p style={{
                        color: '#A1A5B7', fontSize: '16px', lineHeight: 1.6,
                        maxWidth: '440px', marginBottom: '60px',
                    }}>
                        Complete student lifecycle management from enquiry to enrollment,
                        with real-time analytics and seamless academic operations.
                    </p>

                    <div style={{ display: 'flex', gap: '48px' }}>
                        {[
                            { label: 'Students', value: '450+' },
                            { label: 'Teachers', value: '35+' },
                            { label: 'Classes', value: '42+' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>{stat.value}</div>
                                <div style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, marginTop: '4px' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div style={{
                width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '40px', position: 'relative', zIndex: 1,
            }} className="animate-slide-in-right md:w-auto w-full md:max-w-[480px]">
                <div style={{
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                    borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.2)',
                }}>
                    {/* Mobile logo */}
                    <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-primary)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                        }}>
                            <GraduationCap size={24} color="white" />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Proton LMS</h2>
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Welcome Back
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Sign in to continue to your dashboard
                        </p>
                    </div>

                    {/* Login Method Tabs */}
                    <div className="tabs" style={{ marginBottom: '24px', width: '100%' }}>
                        <button
                            className={`tab ${loginMethod === 'email' ? 'active' : ''}`}
                            onClick={() => setLoginMethod('email')}
                            style={{ flex: 1 }}
                        >
                            <Mail size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Email Login
                        </button>
                        <button
                            className={`tab ${loginMethod === 'proId' ? 'active' : ''}`}
                            onClick={() => setLoginMethod('proId')}
                            style={{ flex: 1 }}
                        >
                            <Hash size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Student / Teacher ID
                        </button>
                    </div>

                    <form onSubmit={handleLogin}>
                        {loginMethod === 'email' ? (
                            <div className="input-group" style={{ marginBottom: '16px' }}>
                                <label>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-tertiary)'
                                    }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ paddingLeft: '38px' }}
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="input-group" style={{ marginBottom: '16px' }}>
                                <label>Your ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={16} style={{
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                        color: 'var(--text-tertiary)'
                                    }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g., PRO... or EMP..."
                                        value={proId}
                                        onChange={(e) => setProId(e.target.value)}
                                        style={{ paddingLeft: '38px' }}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{
                                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--text-tertiary)'
                                }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                                        padding: '4px',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                            style={{
                                width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600,
                                borderRadius: '12px', position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {isLoading ? (
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Login - Demo Credentials */}
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
                        <p style={{
                            fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center',
                            marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}>
                            <Sparkles size={12} /> Demo Quick Access <Sparkles size={12} />
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { role: 'Admin', email: 'admin@protoncoaching.com', pass: 'Admin@123', color: '#3B82F6', bg: '#DBEAFE' },
                                { role: 'Teacher', email: 'amit@protoncoaching.com', pass: 'Teacher@123', color: '#8B5CF6', bg: '#EDE9FE' },
                                { role: 'Student', email: 'rahul.sharma@email.com', pass: 'Student@123', color: '#10B981', bg: '#D1FAE5' },
                                { role: 'Parent', email: 'parent.sharma@email.com', pass: 'Parent@123', color: '#F97316', bg: '#FFEDD5' },
                            ].map((demo) => (
                                <button
                                    key={demo.role}
                                    onClick={() => quickLogin(demo.email, demo.pass)}
                                    disabled={isLoading}
                                    style={{
                                        padding: '10px', borderRadius: '10px', border: 'none',
                                        background: demo.bg, color: demo.color, fontWeight: 600,
                                        fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                    onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.03)'; }}
                                    onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                                >
                                    {demo.role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

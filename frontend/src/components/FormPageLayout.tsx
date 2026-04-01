'use client';
import { ReactNode } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface FormPageLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    backHref: string;
    backLabel?: string;
    requiredRole: 'admin' | 'teacher' | 'student' | 'parent';
    icon?: ReactNode;
    accentColor?: string;
    maxWidth?: string;
}

export default function FormPageLayout({
    children,
    title,
    subtitle,
    backHref,
    backLabel = 'Back',
    requiredRole,
    icon,
    accentColor = '#E53935',
    maxWidth = '800px',
}: FormPageLayoutProps) {
    const router = useRouter();

    const customStyles = `
        @keyframes meshGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes headerIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .page-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            position: relative;
            overflow: hidden;
            background: #F4F5F9;
        }

        .premium-mesh {
            position: absolute;
            top: -50%; left: -50%; right: -50%; bottom: -50%;
            z-index: 0;
            background: 
                radial-gradient(circle at 10% 20%, hsla(355, 100%, 93%, 0.4) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, hsla(210, 100%, 90%, 0.4) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, hsla(180, 100%, 95%, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 10%, hsla(280, 100%, 95%, 0.3) 0%, transparent 40%);
            background-size: 200% 200%;
            animation: meshGradient 20s ease infinite;
            filter: blur(80px);
            opacity: 0.7;
        }

        .noise-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            opacity: 0.02;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .form-central-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: ${maxWidth};
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 
                0 40px 120px -20px rgba(26, 29, 59, 0.12),
                0 0 0 1px rgba(226, 232, 240, 0.4);
            padding: 60px;
            animation: slideUpFade 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .form-input {
            width: 100%;
            padding: 16px 20px;
            background: #F8F9FD;
            border: 1.5px solid #E2E8F0;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 500;
            color: #1A1D3B;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
        }

        .form-input:focus {
            border-color: ${accentColor};
            background: #FFFFFF;
            box-shadow: 0 0 0 4px ${accentColor}18;
            transform: translateY(-2px);
        }

        .form-label {
            font-size: 11px;
            font-weight: 800;
            color: #5E6278;
            margin-bottom: 12px;
            display: block;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            font-family: 'Poppins', sans-serif;
        }

        .form-section {
            background: rgba(248, 249, 253, 0.4);
            border: 1px solid #F1F2F7;
            padding: 32px;
            border-radius: 24px;
            margin-bottom: 32px;
            transition: all 0.3s ease;
        }
        .form-section:hover {
            background: rgba(248, 249, 253, 0.8);
            border-color: #E2E8F0;
        }

        .form-section-title {
            font-size: 17px;
            font-weight: 700;
            color: #1A1D3B;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .btn-submit {
            padding: 16px 40px;
            background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%);
            color: white;
            border: none;
            border-radius: 18px;
            font-weight: 800;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 30px -5px ${accentColor}40;
        }

        .btn-submit:hover:not(:disabled) {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 40px -5px ${accentColor}60;
        }

        .btn-cancel {
            padding: 16px 40px;
            background: #FFFFFF;
            color: #5E6278;
            border: 1.5px solid #E2E8F0;
            border-radius: 18px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-cancel:hover {
            background: #F8F9FD;
            color: #1A1D3B;
            border-color: #CBD5E1;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin-top: 40px;
            padding-top: 32px;
            border-top: 1.5px solid #F1F2F7;
        }

        .form-actions-left {
            display: flex;
            justify-content: flex-start;
            gap: 20px;
            margin-top: 40px;
            padding-top: 32px;
            border-top: 1.5px solid #F1F2F7;
        }

        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            width: 100%; padding: 16px 20px; background: #F8F9FD; border: 1.5px solid #E2E8F0; 
            border-radius: 16px; font-size: 15px; color: #1A1D3B; outline: none; transition: all 0.3s;
        }
        .react-datepicker__input-container input:focus {
            border-color: ${accentColor}; background: #FFF; box-shadow: 0 0 0 4px ${accentColor}18;
        }
    `;

    return (
        <DashboardLayout requiredRole={requiredRole}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            <div className="page-container">
                <div className="premium-mesh" />
                <div className="noise-overlay" />

                <div className="form-central-card">
                    {/* Back Button */}
                    <div style={{ position: 'absolute', top: '40px', left: '60px' }}>
                        <button
                            onClick={() => router.push(backHref)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'white', border: '1px solid #E2E8F0', 
                                cursor: 'pointer', color: '#5E6278', fontSize: '12px', fontWeight: 800,
                                padding: '10px 18px', borderRadius: '14px', transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = accentColor;
                                e.currentTarget.style.borderColor = accentColor;
                                e.currentTarget.style.transform = 'translateX(-5px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = '#5E6278';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <ArrowLeft size={16} strokeWidth={3} /> {backLabel.toUpperCase()}
                        </button>
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '56px', animation: 'headerIn 0.8s ease' }}>
                        {icon && (
                            <div style={{
                                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}E6 100%)`,
                                width: '72px', height: '72px', borderRadius: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', margin: '0 auto 28px',
                                boxShadow: `0 20px 40px ${accentColor}30`,
                            }}>
                                {icon}
                            </div>
                        )}
                        <h1 style={{
                            fontSize: '36px', fontWeight: 900, color: '#1A1D3B',
                            fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.04em', margin: 0,
                            lineHeight: 1
                        }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p style={{ 
                                fontSize: '17px', color: '#5E6278', fontWeight: 500, 
                                marginTop: '16px', maxWidth: '540px', margin: '16px auto 0',
                                lineHeight: 1.6
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ position: 'relative' }}>
                        {children}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

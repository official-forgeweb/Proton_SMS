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
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .form-page-animate {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.1) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%);
        }
        .form-input {
            padding: 12px 16px;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            font-size: 14px;
            background: #F8F9FD;
            color: #1A1D3B;
            outline: none;
            width: 100%;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .form-input:focus {
            border-color: ${accentColor};
            background: #FFFFFF;
            box-shadow: 0 0 0 4px ${accentColor}12;
        }
        .form-label {
            font-size: 13px;
            font-weight: 700;
            color: #1A1D3B;
            display: block;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .form-section {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 20px;
            padding: 28px;
            margin-bottom: 24px;
        }
        .form-section-title {
            font-size: 16px;
            font-weight: 800;
            color: #1A1D3B;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Poppins', sans-serif;
        }
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 16px;
            margin-top: 8px;
        }
        .btn-cancel {
            padding: 12px 28px;
            background: #FFFFFF;
            color: #1A1D3B;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .btn-cancel:hover {
            background: #F8F9FD;
        }
        .btn-submit {
            padding: 12px 28px;
            background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 800;
            font-size: 15px;
            cursor: pointer;
            box-shadow: 0 8px 20px -6px ${accentColor}66;
            transition: all 0.2s;
        }
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px -6px ${accentColor}80;
        }
        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px;
            font-size: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%;
            font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus {
            border-color: ${accentColor}; background: #FFF;
        }
    `;

    return (
        <DashboardLayout requiredRole={requiredRole}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>

                {/* Header */}
                <div className="form-page-animate" style={{ marginBottom: '32px' }}>
                    <button
                        onClick={() => router.push(backHref)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#5E6278', fontSize: '14px', fontWeight: 600,
                            padding: '8px 0', marginBottom: '16px', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                        onMouseLeave={e => (e.currentTarget.style.color = '#5E6278')}
                    >
                        <ArrowLeft size={18} /> {backLabel}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {icon && (
                            <div style={{
                                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                                width: '40px', height: '40px', borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', boxShadow: `0 4px 12px ${accentColor}50`,
                            }}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 style={{
                                fontSize: '28px', fontWeight: 800, color: '#1A1D3B',
                                fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0,
                            }}>
                                {title}
                            </h1>
                            {subtitle && (
                                <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, marginTop: '4px' }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="form-page-animate" style={{ maxWidth, animationDelay: '100ms' }}>
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}

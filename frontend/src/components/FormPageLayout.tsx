'use client';
import { ReactNode } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';

interface FormPageLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    backHref: string;
    backLabel?: string;
    requiredRole: string | string[];
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
    maxWidth = '1300px',
}: FormPageLayoutProps) {
    const router = useRouter();

    const customStyles = `
        @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .page-container {
            position: relative;
            width: 100%;
            min-height: calc(100vh - 100px);
            padding: 24px 24px 40px 24px;
            background: var(--bg-secondary, #F4F5F9);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .premium-mesh {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 0;
            background: 
                radial-gradient(circle at 10% 10%, rgba(229, 57, 53, 0.03) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(26, 29, 59, 0.02) 0%, transparent 40%);
            pointer-events: none;
        }

        .form-central-card {
            position: relative;
            z-index: 10;
            width: 100%;
            background: #FFFFFF;
            border-radius: var(--radius-lg, 20px);
            border: 1px solid var(--border-primary, #F0F0F5);
            box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.04));
            padding: 32px;
            margin: 0 auto;
            animation: slideUpFade 0.35s var(--ease-premium, cubic-bezier(0.16, 1, 0.3, 1)) forwards;
            display: flex;
            flex-direction: column;
        }

        /* Responsive Form Inputs */
        .form-input {
            width: 100%;
            height: 46px;
            padding: 0 16px;
            background: #FFFFFF;
            border: 1.5px solid var(--border-secondary, #E4E6EF);
            border-radius: var(--radius-sm, 10px);
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #1A1D3B);
            transition: all 0.15s ease;
            outline: none;
        }

        .form-input:focus {
            border-color: #E53935;
            box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
        }

        .form-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-secondary, #5E6278);
            margin-bottom: 8px;
            display: block;
            letter-spacing: 0.02em;
        }

        /* Form Actions Sticky Bar */
        .form-actions-sticky {
            position: sticky;
            bottom: 0px;
            left: -32px;
            right: -32px;
            margin: 32px -32px -32px -32px;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--border-primary, #F0F0F5);
            padding: 20px 32px;
            border-bottom-left-radius: var(--radius-lg, 20px);
            border-bottom-right-radius: var(--radius-lg, 20px);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            z-index: 100;
        }

        .btn-submit {
            height: 44px;
            padding: 0 24px;
            background: var(--gradient-primary, linear-gradient(135deg, #E53935 0%, #C62828 100%));
            color: white;
            border: none;
            border-radius: var(--radius-sm, 10px);
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
        }

        .btn-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(229, 57, 53, 0.3);
        }
        
        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            box-shadow: none;
        }

        .btn-cancel {
            height: 44px;
            padding: 0 24px;
            background: #FFFFFF;
            color: var(--text-secondary, #5E6278);
            border: 1.5px solid var(--border-secondary, #E4E6EF);
            border-radius: var(--radius-sm, 10px);
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn-cancel:hover {
            background: var(--bg-secondary, #F4F5F9);
            color: var(--text-primary, #1A1D3B);
            border-color: var(--border-secondary, #E4E6EF);
        }

        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            width: 100%; height: 46px; padding: 0 16px; background: #FFFFFF; border: 1.5px solid var(--border-secondary, #E4E6EF); 
            border-radius: var(--radius-sm, 10px); font-size: 14px; color: var(--text-primary, #1A1D3B); outline: none; transition: all 0.15s;
            font-weight: 500;
        }
        .react-datepicker__input-container input:focus {
            border-color: #E53935; box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
        }

        @media (max-width: 768px) {
            .page-container {
                padding: 16px 12px 40px 12px;
            }
            .form-central-card {
                padding: 20px 16px;
                border-radius: var(--radius-md, 14px);
            }
            .form-actions-sticky {
                bottom: -16px;
                left: -16px;
                right: -16px;
                margin: 24px -16px -16px -16px;
                padding: 12px 16px;
                border-bottom-left-radius: var(--radius-md, 14px);
                border-bottom-right-radius: var(--radius-md, 14px);
            }
        }
    `;

    // Deduce Breadcrumb labels
    const getBreadcrumbs = () => {
        const pathSegments = backHref.split('/').filter(Boolean);
        const homeRole = requiredRole === 'coordinator' ? 'coordinator' : 'admin';
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-tertiary, #A1A5B7)', fontWeight: 600 }}>
                <Home size={14} style={{ cursor: 'pointer' }} onClick={() => router.push(`/${homeRole}`)} />
                <ChevronRight size={12} />
                <span style={{ cursor: 'pointer', textTransform: 'capitalize' }} onClick={() => router.push(backHref)}>
                    {backLabel || pathSegments[pathSegments.length - 1] || 'Dashboard'}
                </span>
                <ChevronRight size={12} />
                <span style={{ color: '#E53935', fontWeight: 700 }}>{title}</span>
            </div>
        );
    };

    return (
        <DashboardLayout requiredRole={requiredRole}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            
            <div className="page-container" style={{ '--accentColor': accentColor } as React.CSSProperties}>
                <div className="premium-mesh" />

                <div style={{ width: '100%', maxWidth, display: 'flex', flexDirection: 'column' }}>
                    {getBreadcrumbs()}

                    <div className="form-central-card">
                        {/* Header Details */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary, #F0F0F5)', paddingBottom: '20px', marginBottom: '28px' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                {icon && (
                                    <div style={{
                                        background: 'rgba(229, 57, 53, 0.05)',
                                        width: '42px', height: '42px', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#E53935',
                                    }}>
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    <h1 style={{
                                        fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #1A1D3B)',
                                        fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0,
                                        lineHeight: 1.2
                                    }}>
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p style={{ 
                                            fontSize: '13px', color: 'var(--text-secondary, #5E6278)', fontWeight: 500, 
                                            margin: '4px 0 0 0', lineHeight: 1.4
                                        }}>
                                             {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => router.push(backHref)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'white', border: '1.5px solid var(--border-secondary, #E4E6EF)', 
                                    cursor: 'pointer', color: 'var(--text-secondary, #5E6278)', fontSize: '13px', fontWeight: 700,
                                    padding: '8px 14px', borderRadius: '8px', transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E4E6EF'; }}
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                        </div>

                        {/* Form Content Body */}
                        <div style={{ position: 'relative', flex: 1 }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

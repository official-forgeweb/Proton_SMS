'use client';
import { ReactNode } from 'react';

interface SectionCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
}

export default function SectionCard({
    title,
    description,
    icon,
    children
}: SectionCardProps) {
    return (
        <div className="form-section" style={{ overflow: 'visible', background: '#FFFFFF', border: '1px solid #F0F0F5', padding: '28px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #F8FAFC', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {icon && <span style={{ color: '#E53935', display: 'flex', alignItems: 'center' }}>{icon}</span>}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', margin: 0, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em' }}>
                            {title}
                        </h3>
                        {description && (
                            <p style={{ fontSize: '12px', color: '#5E6278', margin: '4px 0 0 0', fontWeight: 500 }}>
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                {children}
            </div>
        </div>
    );
}

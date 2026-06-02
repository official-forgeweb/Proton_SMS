'use client';
import { ReactNode } from 'react';

interface ResponsiveCardProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export default function ResponsiveCard({ children, className = '', style = {}, onClick }: ResponsiveCardProps) {
    return (
        <div
            onClick={onClick}
            className={`responsive-card ${onClick ? 'clickable' : ''} ${className}`}
            style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(228, 230, 239, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '100%',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                ...style
            }}
        >
            <style jsx>{`
                .responsive-card.clickable:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
                    border-color: rgba(229, 57, 53, 0.2);
                }
                @media (max-width: 768px) {
                    .responsive-card {
                        padding: 16px !important;
                        border-radius: 16px !important;
                    }
                }
            `}</style>
            {children}
        </div>
    );
}

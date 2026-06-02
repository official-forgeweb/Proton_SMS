'use client';
import { ReactNode } from 'react';

interface ResponsivePageContainerProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export default function ResponsivePageContainer({ children, className = '', style = {} }: ResponsivePageContainerProps) {
    return (
        <div
            className={`responsive-page-container ${className}`}
            style={{
                width: '100%',
                maxWidth: '100%',
                margin: '0 auto',
                padding: '24px',
                boxSizing: 'border-box',
                ...style
            }}
        >
            <style jsx global>{`
                @media (max-width: 768px) {
                    .responsive-page-container {
                        padding: 16px 12px !important;
                    }
                }
                @media (max-width: 480px) {
                    .responsive-page-container {
                        padding: 12px 8px !important;
                    }
                }
            `}</style>
            {children}
        </div>
    );
}

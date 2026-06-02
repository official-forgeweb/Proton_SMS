'use client';
import { ReactNode } from 'react';

interface ResponsiveFilterBarProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export default function ResponsiveFilterBar({ children, className = '', style = {} }: ResponsiveFilterBarProps) {
    return (
        <div
            className={`responsive-filter-bar ${className}`}
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                ...style
            }}
        >
            <style jsx global>{`
                .responsive-filter-bar {
                    flex-direction: row;
                }
                .responsive-filter-bar > * {
                    flex: 1 1 auto;
                    min-width: 160px;
                }
                @media (max-width: 768px) {
                    .responsive-filter-bar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 12px !important;
                    }
                    .responsive-filter-bar > * {
                        width: 100% !important;
                        min-width: 100% !important;
                    }
                }
            `}</style>
            {children}
        </div>
    );
}

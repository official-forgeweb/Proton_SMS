'use client';
import { ReactNode } from 'react';

interface ResponsiveGridProps {
    children: ReactNode;
    desktopCols?: number; // columns on desktop (>=1024px)
    tabletCols?: number;  // columns on tablet (768px - 1024px)
    mobileCols?: number;  // columns on mobile (<768px)
    gap?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export default function ResponsiveGrid({
    children,
    desktopCols = 4,
    tabletCols = 2,
    mobileCols = 1,
    gap = '20px',
    className = '',
    style = {}
}: ResponsiveGridProps) {
    const formatGap = typeof gap === 'number' ? `${gap}px` : gap;

    return (
        <div
            className={`responsive-grid ${className}`}
            style={{
                display: 'grid',
                gap: formatGap,
                width: '100%',
                ...style
            }}
        >
            <style jsx>{`
                .responsive-grid {
                    grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr));
                }
                @media (max-width: 1024px) {
                    .responsive-grid {
                        grid-template-columns: repeat(${tabletCols}, minmax(0, 1fr)) !important;
                        gap: 16px !important;
                    }
                }
                @media (max-width: 768px) {
                    .responsive-grid {
                        grid-template-columns: repeat(${mobileCols}, minmax(0, 1fr)) !important;
                        gap: 12px !important;
                    }
                }
            `}</style>
            {children}
        </div>
    );
}

'use client';
import { ReactNode } from 'react';

interface FormGridProps {
    children: ReactNode;
    columns?: 1 | 2 | 3;
    gap?: string;
}

export default function FormGrid({
    children,
    columns = 2,
    gap = '24px'
}: FormGridProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: columns === 1 ? '1fr' : columns === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap,
            width: '100%'
        }} className="form-grid-layout">
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 768px) {
                    .form-grid-layout {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                }
            `}} />
            {children}
        </div>
    );
}

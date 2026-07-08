'use client';
import { ReactNode } from 'react';

interface FormActionsProps {
    children: ReactNode;
}

export default function FormActions({ children }: FormActionsProps) {
    return (
        <div className="form-actions-sticky">
            {children}
        </div>
    );
}

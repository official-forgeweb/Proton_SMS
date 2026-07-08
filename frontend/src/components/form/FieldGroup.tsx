'use client';
import { ReactNode } from 'react';

interface FieldGroupProps {
    label?: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: ReactNode;
}

export default function FieldGroup({
    label,
    required = false,
    error,
    helperText,
    children
}: FieldGroupProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '4px' }}>
            {label && (
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    {required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
            )}
            <div style={{ position: 'relative', width: '100%' }}>
                {children}
            </div>
            {error && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', marginTop: '6px', display: 'block' }}>
                    {error}
                </span>
            )}
            {helperText && !error && (
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {helperText}
                </span>
            )}
        </div>
    );
}

'use client';
import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            confirmBtnRef.current?.focus();
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const colors = {
        danger: { bg: '#FEF2F2', border: '#FEE2E2', icon: '#EF4444', btn: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', shadow: 'rgba(239,68,68,0.3)' },
        warning: { bg: '#FFFBEB', border: '#FEF3C7', icon: '#D97706', btn: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', shadow: 'rgba(245,158,11,0.3)' },
        info: { bg: '#EFF6FF', border: '#DBEAFE', icon: '#3B82F6', btn: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', shadow: 'rgba(59,130,246,0.3)' },
    }[variant];

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
                animation: 'confirmOverlayIn 0.2s ease'
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes confirmOverlayIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes confirmModalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}} />

            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                animation: 'confirmModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 24px 0',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '14px',
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <AlertTriangle size={20} color={colors.icon} />
                        </div>
                        <div>
                            <h3 style={{
                                fontSize: '17px', fontWeight: 800, color: '#1A1D3B',
                                margin: 0, fontFamily: 'Poppins, Inter, sans-serif'
                            }}>
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#A1A5B7', padding: '4px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1A1D3B'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A1A5B7'; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Message */}
                <div style={{ padding: '16px 24px 24px' }}>
                    <p style={{
                        fontSize: '14px', color: '#64748B', lineHeight: 1.6,
                        margin: 0, fontWeight: 500
                    }}>
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div style={{
                    padding: '16px 24px 24px',
                    display: 'flex', gap: '12px', justifyContent: 'flex-end',
                    borderTop: '1px solid #F1F5F9'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', borderRadius: '12px',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            color: '#64748B', fontSize: '13.5px', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            padding: '10px 24px', borderRadius: '12px',
                            background: colors.btn, border: 'none',
                            color: '#FFFFFF', fontSize: '13.5px', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: `0 4px 14px ${colors.shadow}`
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${colors.shadow}`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${colors.shadow}`; }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

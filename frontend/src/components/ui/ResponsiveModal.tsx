'use client';
import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type?: 'small' | 'large'; // small converts to bottom sheet, large converts to full screen on mobile
    children: ReactNode;
    footer?: ReactNode;
}

export default function ResponsiveModal({
    isOpen,
    onClose,
    title,
    type = 'small',
    children,
    footer
}: ResponsiveModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Escape key listener for closing modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return (
        <>
            {/* Dark blur backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(16, 18, 27, 0.4)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 100,
                    animation: 'fadeIn 0.2s ease forwards'
                }}
            />

            {/* Modal Box */}
            <div
                className={`responsive-modal-box modal-${type}`}
                style={{
                    position: 'fixed',
                    background: '#FFFFFF',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 24px 64px rgba(26, 29, 59, 0.16)'
                }}
            >
                {/* Modal Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #EEEEF5',
                    flexShrink: 0
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#1A1D3B',
                        margin: 0
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F8F9FD',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#A1A5B7',
                            transition: 'all 0.2s',
                            width: '32px',
                            height: '32px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#E53935';
                            e.currentTarget.style.backgroundColor = '#FFEBEE';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#A1A5B7';
                            e.currentTarget.style.backgroundColor = '#F8F9FD';
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Content */}
                <div 
                    className="hide-scrollbar"
                    style={{
                        padding: '24px',
                        overflowY: 'auto',
                        flex: 1
                    }}
                >
                    {children}
                </div>

                {/* Modal Footer */}
                {footer && (
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #EEEEF5',
                        background: '#F8F9FD',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '12px',
                        flexShrink: 0
                    }}>
                        {footer}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { transform: translate(-50%, -40%) scale(0.95); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }

                @keyframes bottomSheetUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                @keyframes fullScreenFade {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* Desktop/Tablet Rules (Default Centered) */
                .responsive-modal-box {
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 24px;
                    max-height: 90vh;
                    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .modal-small {
                    width: 480px;
                    max-width: 95vw;
                }
                .modal-large {
                    width: 720px;
                    max-width: 95vw;
                }

                /* Mobile Viewport Rules (< 768px) */
                @media (max-width: 768px) {
                    /* Small Modal -> Bottom Sheet */
                    .responsive-modal-box.modal-small {
                        top: auto !important;
                        left: 0 !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        transform: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        max-height: 80vh !important;
                        border-radius: 24px 24px 0 0 !important;
                        animation: bottomSheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                    }

                    /* Large Modal -> Full Screen overlay */
                    .responsive-modal-box.modal-large {
                        top: 0 !important;
                        left: 0 !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        transform: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 100% !important;
                        max-height: 100% !important;
                        border-radius: 0 !important;
                        animation: fullScreenFade 0.25s ease-out forwards !important;
                    }
                }
            `}</style>
        </>
    );
}

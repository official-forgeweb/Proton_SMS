import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(26, 29, 59, 0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 24px 48px rgba(26, 29, 59, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInUp 0.3s ease',
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '22px 28px',
                    borderBottom: '1px solid #F0F0F5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h2 style={{
                        fontSize: '18px', fontWeight: 700,
                        color: '#1A1D3B', fontFamily: 'Poppins, sans-serif',
                    }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F4F5F9', border: 'none', cursor: 'pointer',
                            color: '#A1A5B7', width: '32px', height: '32px',
                            borderRadius: '8px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                            (e.currentTarget as HTMLElement).style.color = '#EF4444';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = '#F4F5F9';
                            (e.currentTarget as HTMLElement).style.color = '#A1A5B7';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '24px 28px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

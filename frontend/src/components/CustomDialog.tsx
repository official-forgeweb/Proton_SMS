import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

interface CustomDialogProps {
    title: string;
    message: string;
    onResolve: (result: boolean) => void;
    isConfirm: boolean;
}

export default function CustomDialog({ title, message, onResolve, isConfirm }: CustomDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = (result: boolean) => {
        setIsVisible(false);
        setTimeout(() => onResolve(result), 300); // Wait for transition
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isVisible ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0)', backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
            transition: 'all 0.3s ease',
            padding: '20px'
        }}>
            <div style={{
                background: '#FFFFFF', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden',
                boxShadow: isVisible ? '0 24px 48px rgba(0,0,0,0.2)' : '0 12px 24px rgba(0,0,0,0.1)',
                transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                opacity: isVisible ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ 
                        flexShrink: 0, width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isConfirm ? '#FEF2F2' : '#EEF0FF', color: isConfirm ? '#EF4444' : '#4F60FF'
                    }}>
                        {isConfirm ? <AlertCircle size={28} /> : <Info size={28} />}
                    </div>
                    <div style={{ flex: 1, pt: '4px' }}>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#1A1D3B' }}>{title}</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#5E6278', lineHeight: 1.5, fontWeight: 500 }}>
                            {message}
                        </p>
                    </div>
                </div>
                <div style={{ padding: '16px 24px', background: '#F8F9FD', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {isConfirm && (
                        <button onClick={() => handleClose(false)} style={{ 
                            padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFFFFF', 
                            color: '#5E6278', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                        }}>
                            Cancel
                        </button>
                    )}
                    <button onClick={() => handleClose(true)} style={{ 
                        padding: '10px 24px', borderRadius: '12px', border: 'none', 
                        background: isConfirm ? '#EF4444' : '#4F60FF', color: '#FFFFFF', 
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: isConfirm ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(79,96,255,0.3)'
                    }}>
                        {isConfirm ? 'Confirm' : 'Okay'}
                    </button>
                </div>
            </div>
        </div>
    );
}

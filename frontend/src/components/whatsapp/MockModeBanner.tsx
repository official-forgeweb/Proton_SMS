'use client';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface MockModeBannerProps {
  show: boolean;
}

export default function MockModeBanner({ show }: MockModeBannerProps) {
  if (!show) return null;

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 20px',
        background: '#FFFDF5',
        border: '1px solid #FCD34D',
        borderRadius: '14px',
        color: '#B45309',
        fontSize: '13px',
        fontWeight: 500,
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
        <span>
          <strong>Mock Mode Active</strong> — Messages are logged to the database but will NOT actually be sent. 
          Configure WhatsApp credentials in Settings to go live.
        </span>
      </div>
      <Link 
        href="/dashboard/whatsapp/settings" 
        style={{
          padding: '6px 12px',
          background: '#F59E0B',
          color: '#FFFFFF',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 700,
          textDecoration: 'none',
          flexShrink: 0,
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
          textAlign: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#D97706'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#F59E0B'; }}
      >
        Go to Settings
      </Link>
    </div>
  );
}

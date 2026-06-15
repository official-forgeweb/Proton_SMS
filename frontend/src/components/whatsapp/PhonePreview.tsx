'use client';
import React, { ReactNode } from 'react';
import { Phone, Video, MoreVertical, ChevronLeft, Wifi, Battery, Signal } from 'lucide-react';

interface PhonePreviewProps {
  children: ReactNode;
  title?: string;
}

export default function PhonePreview({ children, title = 'Proton LMS' }: PhonePreviewProps) {
  return (
    <div style={{
      position: 'relative',
      margin: '0 auto',
      width: '320px',
      height: '580px',
      background: '#020617',
      borderRadius: '40px',
      border: '12px solid #1E293B',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      outline: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '112px',
        height: '20px',
        background: '#1E293B',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ width: '8px', height: '8px', background: '#020617', borderRadius: '50%', marginRight: '8px' }} />
        <span style={{ width: '40px', height: '4px', background: '#334155', borderRadius: '9999px' }} />
      </div>

      {/* Status Bar */}
      <div style={{
        height: '24px',
        background: '#1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontSize: '10px',
        color: '#94A3B8',
        fontWeight: 700,
        zIndex: 20,
      }}>
        <span>9:41 AM</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Signal size={10} />
          <Wifi size={10} />
          <Battery size={10} />
        </div>
      </div>

      {/* WhatsApp Chat Header */}
      <div style={{
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#F1F5F9',
        position: 'relative',
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ChevronLeft size={18} style={{ color: '#94A3B8', cursor: 'pointer' }} />
          {/* Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: '#FFFFFF',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          }}>
            P
          </div>
          {/* Contact Name */}
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{title}</span>
            <span style={{ fontSize: '9px', color: '#4ADE80', fontWeight: 500, lineHeight: 1 }}>online</span>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
          <Video size={14} style={{ cursor: 'pointer' }} />
          <Phone size={13} style={{ cursor: 'pointer' }} />
          <MoreVertical size={14} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Chat Background Area */}
      <div
        style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
          background: '#0b141a',
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(229,57,53,0.02) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(255,165,0,0.02) 0%, transparent 60%)`,
        }}
      >
        {/* Subtle wallpaper pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundRepeat: 'repeat',
          opacity: 0.02,
          pointerEvents: 'none',
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundSize: '200px',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', position: 'relative', zIndex: 10 }}>
          {/* Date Indicator */}
          <div style={{
            alignSelf: 'center',
            background: '#334155',
            border: '1px solid #475569',
            color: '#94A3B8',
            fontSize: '9px',
            padding: '2px 10px',
            borderRadius: '6px',
            margin: '8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}>
            Today
          </div>
          {children}
        </div>
      </div>

      {/* Chat Footer/Keyboard Mockup */}
      <div style={{
        background: '#1E293B',
        borderTop: '1px solid #334155',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
        zIndex: 20,
      }}>
        <div style={{
          flex: 1,
          background: '#020617',
          border: '1px solid #334155',
          borderRadius: '9999px',
          padding: '6px 12px',
          fontSize: '11px',
          color: '#64748B',
        }}>
          Type a message...
        </div>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
          🎤
        </div>
      </div>
    </div>
  );
}

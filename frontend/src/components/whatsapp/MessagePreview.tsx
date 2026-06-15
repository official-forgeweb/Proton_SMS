'use client';
import { Check, CheckCheck } from 'lucide-react';
import React from 'react';

interface ButtonConfig {
  type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
  text: string;
  phoneNumber?: string;
  url?: string;
}

interface MessagePreviewProps {
  bodyText: string;
  headerType?: string;
  headerContent?: string;
  footerText?: string;
  buttons?: ButtonConfig[] | any;
  variables?: string[];
  status?: string;
  time?: string;
  direction?: 'OUTGOING' | 'INCOMING';
}

// Function to format text (handles *bold*, _italic_, ```mono```, and line breaks)
export function formatWhatsAppText(text: string, variables: string[] = []) {
  if (!text) return '';

  let formatted = text;

  // Replace variables {{1}}, {{2}}, etc.
  variables.forEach((val, i) => {
    const placeholder = `{{${i + 1}}}`;
    formatted = formatted.replaceAll(placeholder, val || `[Variable ${i + 1}]`);
  });

  // Split into paragraphs/lines to preserve line breaks
  const lines = formatted.split('\n');

  return lines.map((line, lineIdx) => {
    // Simple parser for markdown
    const tokenRegex = /(\`\`\`[^\`]+\`\`\`|\*[^*]+\*|_[^_]+_)/g;
    const parts = line.split(tokenRegex);

    const lineElements = parts.map((part, partIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        return (
          <code key={`${lineIdx}-${partIdx}`} style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace', color: '#FFB8D1' }}>
            {part.slice(3, -3)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={`${lineIdx}-${partIdx}`} style={{ fontWeight: 800 }}>{part.slice(1, -1)}</strong>;
      }
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={`${lineIdx}-${partIdx}`} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });

    return (
      <React.Fragment key={lineIdx}>
        {lineElements}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function MessagePreview({
  bodyText,
  headerType = 'NONE',
  headerContent = '',
  footerText = '',
  buttons = [],
  variables = [],
  status = 'SENT',
  time = '10:00 AM',
  direction = 'OUTGOING',
}: MessagePreviewProps) {
  const isOutgoing = direction === 'OUTGOING';

  // Parse buttons if they come as string/JSON
  let parsedButtons: ButtonConfig[] = [];
  if (buttons) {
    if (typeof buttons === 'string') {
      try { parsedButtons = JSON.parse(buttons); } catch (e) { parsedButtons = []; }
    } else if (Array.isArray(buttons)) {
      parsedButtons = buttons;
    }
  }

  // Determine tick styling based on status
  const renderTicks = () => {
    const normStatus = status.toUpperCase();
    if (normStatus === 'PENDING') {
      return <span style={{ fontSize: '10px', color: '#94A3B8' }}>🕒</span>;
    }
    if (normStatus === 'SENT' || normStatus === 'MOCK') {
      return <Check size={14} style={{ color: '#94A3B8' }} />;
    }
    if (normStatus === 'DELIVERED') {
      return <CheckCheck size={14} style={{ color: '#94A3B8' }} />;
    }
    if (normStatus === 'READ') {
      return <CheckCheck size={14} style={{ color: '#38BDF8' }} />;
    }
    if (normStatus === 'FAILED') {
      return <span style={{ color: '#EF4444', fontSize: '12px' }}>⚠️</span>;
    }
    return null;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '85%',
      alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
      marginLeft: isOutgoing ? 'auto' : undefined,
      marginRight: isOutgoing ? undefined : 'auto',
      marginBottom: '12px',
    }}>
      {/* Message bubble - intentionally dark/WhatsApp themed */}
      <div style={{
        borderRadius: '16px',
        borderTopRightRadius: isOutgoing ? '2px' : '16px',
        borderTopLeftRadius: isOutgoing ? '16px' : '2px',
        padding: '10px 14px',
        fontSize: '13px',
        position: 'relative',
        background: isOutgoing ? '#128C7E' : '#2D3748',
        color: '#F1F5F9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        border: isOutgoing ? 'none' : '1px solid #4A5568',
      }}>
        {/* Header content */}
        {headerType && headerType !== 'NONE' && (
          <div style={{ marginBottom: '8px', borderRadius: '6px', overflow: 'hidden', maxWidth: '100%' }}>
            {headerType === 'TEXT' && headerContent && (
              <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', color: '#E2E8F0' }}>
                {headerContent}
              </div>
            )}
            {headerType === 'IMAGE' && (
              <img
                src={headerContent || '/api/placeholder/400/200'}
                alt="Header"
                style={{ width: '100%', height: '128px', objectFit: 'cover', borderRadius: '6px', background: '#1A202C', border: '1px solid rgba(255,255,255,0.1)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&auto=format&fit=crop';
                }}
              />
            )}
            {headerType === 'VIDEO' && (
              <div style={{ width: '100%', height: '128px', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                📹 Video Attachment Preview
              </div>
            )}
            {headerType === 'DOCUMENT' && (
              <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#CBD5E1' }}>
                📄 Document Attachment
              </div>
            )}
          </div>
        )}

        {/* Body content */}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, paddingRight: '32px' }}>
          {formatWhatsAppText(bodyText, variables)}
        </div>

        {/* Footer content */}
        {footerText && (
          <div style={{ fontSize: '11px', color: 'rgba(203,213,225,0.6)', marginTop: '4px', fontStyle: 'italic' }}>
            {footerText}
          </div>
        )}

        {/* Time and Status ticks */}
        <div style={{ position: 'absolute', bottom: '4px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(203,213,225,0.6)' }}>{time}</span>
          {isOutgoing && renderTicks()}
        </div>
      </div>

      {/* Buttons rendering */}
      {parsedButtons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', width: '100%' }}>
          {parsedButtons.map((btn, index) => (
            <div
              key={index}
              style={{
                background: '#2D3748',
                color: '#F1F5F9',
                padding: '8px 12px',
                borderRadius: '10px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid #4A5568',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transition: 'background 0.15s',
              }}
            >
              {btn.type === 'URL' && <span>🔗</span>}
              {btn.type === 'PHONE_NUMBER' && <span>📞</span>}
              <span>{btn.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

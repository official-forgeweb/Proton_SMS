'use client';
import React, { useState } from 'react';
import { X, Calendar, User, Phone, Play, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface LogItem {
  id: string;
  phone: string;
  recipient_name: string | null;
  recipient_type: string;
  status: string;
  direction: string;
  created_at: string;
  template: { name: string } | null;
  variables: any;
  error_code: string | null;
  error_message: string | null;
  meta_message_id: string | null;
  raw_request: any;
  raw_response: any;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  cost_estimation?: number;
  triggered_by?: string;
  automation_type?: string | null;
}

interface LogDetailModalProps {
  log: LogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResend: (log: LogItem) => void;
  isResending: boolean;
}

export default function LogDetailModal({
  log,
  isOpen,
  onClose,
  onResend,
  isResending,
}: LogDetailModalProps) {
  const [showReq, setShowReq] = useState(false);
  const [showRes, setShowRes] = useState(false);

  if (!isOpen || !log) return null;

  const date = new Date(log.created_at);
  const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

  // Parse variables
  let variablesList: string[] = [];
  if (log.variables) {
    if (typeof log.variables === 'string') {
      try {
        variablesList = JSON.parse(log.variables);
      } catch (e) {
        variablesList = [log.variables];
      }
    } else if (Array.isArray(log.variables)) {
      variablesList = log.variables;
    } else if (typeof log.variables === 'object') {
      variablesList = Object.entries(log.variables).map(([k, v]) => `${k}: ${v}`);
    }
  }

  const isFailed = log.status.toUpperCase() === 'FAILED';

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    padding: '16px',
    borderRadius: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'block',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '640px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Message Log Detail
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ID: {log.id}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-tertiary)',
              padding: '6px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Status and Resend bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...sectionStyle,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Current Status:</span>
              <StatusBadge status={log.status} />
            </div>
            {isFailed && (
              <button
                onClick={() => onResend(log)}
                disabled={isResending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: 'var(--error)',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isResending ? 'not-allowed' : 'pointer',
                  opacity: isResending ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <RotateCcw size={13} className={isResending ? 'animate-spin' : ''} />
                Resend Message
              </button>
            )}
          </div>

          {/* Grid Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Recipient Details */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Recipient Details</span>
              <div style={rowStyle}>
                <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.recipient_name || 'Custom Contact'}</span>
                <span style={{ fontSize: '10px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{log.recipient_type}</span>
              </div>
              <div style={rowStyle}>
                <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span>{log.phone}</span>
              </div>
            </div>

            {/* Transmission Details */}
            <div style={sectionStyle}>
              <span style={labelStyle}>Transmission</span>
              <div style={rowStyle}>
                <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span>{timeString}</span>
              </div>
              <div style={rowStyle}>
                <Play size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span>Triggered By: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{log.triggered_by || 'MANUAL'}</strong></span>
                {log.automation_type && (
                  <span style={{ fontSize: '9px', background: 'var(--info-light)', color: 'var(--info)', padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>{log.automation_type}</span>
                )}
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Template & Variables</h4>
            <div style={sectionStyle}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Template: <span style={{ color: 'var(--error)' }}>{log.template?.name || 'Free text / Custom Message'}</span>
              </div>
              {variablesList.length > 0 ? (
                <div>
                  <span style={{ ...labelStyle, marginBottom: '6px' }}>Variables sent:</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {variablesList.map((val, i) => (
                      <div key={i} style={{
                        fontSize: '12px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{`{{${i + 1}}}`}</span>
                        <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', marginLeft: '8px' }} title={val}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No variables sent in this message.</span>
              )}
            </div>
          </div>

          {/* Error Details */}
          {log.error_code && (
            <div style={{
              border: '1px solid #FECACA',
              background: 'var(--error-light)',
              padding: '16px',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '10px', color: 'var(--error)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Error Details</span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--error)' }}>Error Code: {log.error_code}</div>
              <p style={{ fontSize: '12px', color: '#991B1B', lineHeight: 1.5, margin: '4px 0 0' }}>{log.error_message}</p>
            </div>
          )}

          {/* Collapsible JSON blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Request API */}
            <div style={{ border: '1px solid var(--border-primary)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowReq(!showReq)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>Raw HTTP Request Payload</span>
                {showReq ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showReq && (
                <pre style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: 'var(--info)',
                  overflowX: 'auto',
                  borderTop: '1px solid var(--border-primary)',
                  maxHeight: '160px',
                  margin: 0,
                }}>
                  {JSON.stringify(log.raw_request || {}, null, 2)}
                </pre>
              )}
            </div>

            {/* Response API */}
            <div style={{ border: '1px solid var(--border-primary)', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowRes(!showRes)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>Raw Meta API Response Payload</span>
                {showRes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showRes && (
                <pre style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: 'var(--info)',
                  overflowX: 'auto',
                  borderTop: '1px solid var(--border-primary)',
                  maxHeight: '160px',
                  margin: 0,
                }}>
                  {JSON.stringify(log.raw_response || {}, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

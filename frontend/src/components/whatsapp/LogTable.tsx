'use client';
import React from 'react';
import { Eye, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
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
  error_code: string | null;
  error_message: string | null;
  meta_message_id: string | null;
}

interface LogTableProps {
  logs: LogItem[];
  onViewDetails: (log: LogItem) => void;
  onResend: (log: LogItem) => void;
  isResending: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function LogTable({
  logs,
  onViewDetails,
  onResend,
  isResending,
  currentPage,
  totalPages,
  onPageChange,
}: LogTableProps) {
  const thStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-primary)',
    background: 'var(--bg-tertiary)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-light)',
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Recipient</th>
              <th style={thStyle}>Type / Direction</th>
              <th style={thStyle}>Template</th>
              <th style={thStyle}>Mode / Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '48px 18px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  No logs found matching selected filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const date = new Date(log.created_at);
                const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isFailed = log.status.toUpperCase() === 'FAILED';
                const isMock = log.status.toUpperCase() === 'MOCK' || (!log.meta_message_id?.startsWith('wamid.'));

                return (
                  <tr
                    key={log.id}
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => onViewDetails(log)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {timeString}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {log.recipient_name || 'Custom Number'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {log.phone}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {log.recipient_type}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          {log.direction === 'OUTGOING' ? '↗️ Out' : '↙️ In'}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {log.template?.name || <em style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 400 }}>Free text</em>}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.03em',
                          background: isMock ? 'var(--warning-light)' : 'var(--success-light)',
                          color: isMock ? '#92400E' : '#065F46',
                        }}>
                          {isMock ? 'MOCK' : 'LIVE'}
                        </span>
                        <StatusBadge status={log.status} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => onViewDetails(log)}
                          title="View Details"
                          style={{
                            padding: '6px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Eye size={14} />
                        </button>
                        {isFailed && (
                          <button
                            onClick={() => onResend(log)}
                            disabled={isResending === log.id}
                            title="Resend Message"
                            style={{
                              padding: '6px',
                              background: 'var(--error-light)',
                              border: '1px solid #FECACA',
                              color: 'var(--error)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                              opacity: isResending === log.id ? 0.5 : 1,
                            }}
                          >
                            <RotateCcw size={14} className={isResending === log.id ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '14px 18px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            <ArrowLeft size={14} />
            Previous
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Page <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{totalPages}</strong>
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            Next
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface ConnectionStatusProps {
  status: 'CONNECTED' | 'MOCK' | 'DISCONNECTED' | string;
  isActive: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function ConnectionStatus({
  status,
  isActive,
  onRefresh,
  isRefreshing = false,
}: ConnectionStatusProps) {
  let headerText = 'System Disconnected';
  let descText = 'Real-time API integrations are currently disabled. Please review credentials.';
  let icon = <WifiOff size={22} style={{ color: 'var(--error)' }} className={status !== 'DISCONNECTED' ? 'animate-pulse' : ''} />;
  let borderColor = 'rgba(239, 68, 68, 0.2)';

  if (!isActive) {
    headerText = 'Module Inactive';
    descText = 'The WhatsApp integration is turned off. Toggle it active in Settings.';
    icon = <WifiOff size={22} style={{ color: 'var(--text-tertiary)' }} />;
    borderColor = 'var(--border-primary)';
  } else if (status === 'MOCK') {
    headerText = 'Mock Routing Active';
    descText = 'Messages are simulated and logged in the database without hitting Meta Graph APIs.';
    icon = <Wifi size={22} style={{ color: 'var(--warning)' }} className="animate-pulse" />;
    borderColor = 'rgba(245, 158, 11, 0.2)';
  } else if (status === 'CONNECTED') {
    headerText = 'WhatsApp API Live';
    descText = 'Direct integration with Meta Graph Cloud API is healthy and fully operational.';
    icon = <Wifi size={22} style={{ color: 'var(--success)' }} />;
    borderColor = 'rgba(16, 185, 129, 0.2)';
  }

  return (
    <div 
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }} 
      className="hover-lift"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '10px',
            background: '#FAFAFC',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              {headerText}
            </h4>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Connection Health
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <StatusBadge status={status} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Refresh connection status"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '16px 0 0 0', lineHeight: 1.5 }}>
        {descText}
      </p>
    </div>
  );
}

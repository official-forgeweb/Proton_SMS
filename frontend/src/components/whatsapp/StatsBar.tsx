'use client';
import React from 'react';

interface StatsBarProps {
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    mock: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const readPercent = stats.sent + stats.mock > 0 ? (stats.read / (stats.sent + stats.mock)) * 100 : 0;
  const deliveryPercent = stats.sent + stats.mock > 0 ? ((stats.delivered + stats.read) / (stats.sent + stats.mock)) * 100 : 0;

  const items = [
    { label: 'Total Logged', value: stats.total, badge: '100%', color: 'var(--text-primary)', badgeBg: 'var(--bg-tertiary)', badgeColor: 'var(--text-secondary)' },
    { label: 'Mock Mode', value: stats.mock, badge: 'MOCK', color: 'var(--warning)', badgeBg: 'var(--warning-light)', badgeColor: '#92400E' },
    { label: 'Sent (Live)', value: stats.sent, badge: 'LIVE', color: 'var(--success)', badgeBg: 'var(--success-light)', badgeColor: '#065F46' },
    { label: 'Delivered', value: stats.delivered, badge: `${deliveryPercent.toFixed(0)}%`, color: 'var(--info)', badgeBg: 'var(--info-light)', badgeColor: '#1E40AF' },
    { label: 'Read Rate', value: stats.read, badge: `${readPercent.toFixed(0)}%`, color: '#0EA5E9', badgeBg: '#F0F9FF', badgeColor: '#0C4A6E' },
    { label: 'Failed', value: stats.failed, badge: `${stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(0) : 0}%`, color: 'var(--error)', badgeBg: 'var(--error-light)', badgeColor: '#991B1B' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: item.color }}>{item.value}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, background: item.badgeBg, color: item.badgeColor, padding: '2px 6px', borderRadius: '4px' }}>{item.badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

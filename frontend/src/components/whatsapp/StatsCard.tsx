'use client';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  color?: 'red' | 'orange' | 'green' | 'blue' | 'gray';
  extraInfo?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  subtext,
  color = 'blue',
  extraInfo,
}: StatsCardProps) {
  return (
    <div 
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        minHeight: '130px'
      }} 
      className="hover-lift"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <div style={{
          padding: '8px',
          borderRadius: '12px',
          background: color === 'red' ? 'rgba(239, 68, 68, 0.08)' :
                      color === 'orange' ? 'rgba(245, 158, 11, 0.08)' :
                      color === 'green' ? 'rgba(16, 185, 129, 0.08)' :
                      color === 'blue' ? 'rgba(59, 130, 246, 0.08)' :
                      'rgba(161, 165, 183, 0.08)',
          color: color === 'red' ? 'var(--error)' :
                 color === 'orange' ? 'var(--warning)' :
                 color === 'green' ? 'var(--success)' :
                 color === 'blue' ? 'var(--info)' :
                 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
          {value}
        </h3>
        {subtext && (
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0 0', fontWeight: 500 }}>
            {subtext}
          </p>
        )}
      </div>

      {extraInfo && (
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '8px', 
          borderTop: '1px solid var(--border-primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: '10px', 
          color: 'var(--text-tertiary)', 
          fontWeight: 700 
        }}>
          <span>Breakdown</span>
          <span style={{ color: 'var(--text-secondary)' }}>{extraInfo}</span>
        </div>
      )}
    </div>
  );
}

'use client';
import React from 'react';

interface DailyLimitProgressProps {
  counter: number;
  limit: number;
}

export default function DailyLimitProgress({ counter = 0, limit = 250 }: DailyLimitProgressProps) {
  const percentage = Math.min(100, Math.max(0, (counter / limit) * 100));

  let fillBg = 'var(--gradient-primary)'; // default brand red gradient
  if (percentage >= 85) {
    fillBg = 'var(--gradient-error)';
  } else if (percentage >= 60) {
    fillBg = 'var(--gradient-warning)';
  }

  return (
    <div 
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '130px'
      }}
      className="hover-lift"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Message Limit</span>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: '2px' }}>Resets daily at midnight</span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
          {counter} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>/ {limit} used</span>
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="progress-bar" style={{ height: '10px', padding: '1px', background: 'var(--bg-tertiary)' }}>
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%`, background: fillBg }}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '12px', 
        fontSize: '10px', 
        color: 'var(--text-tertiary)', 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        <span>0%</span>
        <span style={{ color: 'var(--text-secondary)' }}>{percentage.toFixed(0)}% Consumed</span>
        <span>100%</span>
      </div>
    </div>
  );
}

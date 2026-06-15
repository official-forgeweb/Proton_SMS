'use client';
import React from 'react';

interface VariableInputProps {
  descriptions: string[] | any;
  value: string[];
  onChange: (val: string[]) => void;
}

export default function VariableInput({ descriptions = [], value = [], onChange }: VariableInputProps) {
  // Parse descriptions if it comes as string/JSON
  let parsedDesc: string[] = [];
  if (descriptions) {
    if (typeof descriptions === 'string') {
      try {
        parsedDesc = JSON.parse(descriptions);
      } catch (e) {
        parsedDesc = [];
      }
    } else if (Array.isArray(descriptions)) {
      parsedDesc = descriptions;
    }
  }

  if (parsedDesc.length === 0) {
    return (
      <div style={{
        fontSize: '12px',
        color: 'var(--text-tertiary)',
        fontStyle: 'italic',
        padding: '12px',
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border-primary)',
      }}>
        This template does not require any variable parameters.
      </div>
    );
  }

  const handleInputChange = (idx: number, val: string) => {
    const updated = [...value];
    while (updated.length <= idx) {
      updated.push('');
    }
    updated[idx] = val;
    onChange(updated);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      padding: '16px',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template Variables</span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {parsedDesc.map((desc, idx) => {
          const variableTag = `{{${idx + 1}}}`;
          const currentVal = value[idx] || '';

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{desc || `Parameter ${idx + 1}`}</span>
                <code style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--error)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                }}>{variableTag}</code>
              </label>
              <input
                type="text"
                placeholder={`Value for ${desc || `variable ${idx + 1}`}`}
                value={currentVal}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                className="input-field"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

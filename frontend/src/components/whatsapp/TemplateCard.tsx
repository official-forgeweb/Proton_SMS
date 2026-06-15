'use client';
import React from 'react';
import { Eye, Edit2, Trash2, CloudLightning, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { Template } from '@/hooks/useTemplates';

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onSyncStatus: (template: Template) => void;
  onPushToMeta: (template: Template) => void;
  isSyncing: boolean;
  isPushing: boolean;
  isDeleting: boolean;
}

export default function TemplateCard({
  template,
  onPreview,
  onEdit,
  onDelete,
  onSyncStatus,
  onPushToMeta,
  isSyncing,
  isPushing,
  isDeleting,
}: TemplateCardProps) {
  const date = new Date(template.updated_at);
  const updatedStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMetaPushable = template.status === 'DRAFT' || template.status === 'LOCAL_ONLY' || template.sync_status === 'LOCAL_ONLY';
  const isMetaSyncable = template.status !== 'DRAFT';

  const iconBtnStyle: React.CSSProperties = {
    padding: '8px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-secondary)',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-lg)',
      transition: 'all 0.3s',
      opacity: 1,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
    >
      {/* Top row */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px', margin: 0 }} title={template.name}>
              {template.name}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.03em' }}>
                {template.category}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {template.language}
              </span>
            </div>
          </div>
          <StatusBadge status={template.status} />
        </div>

        {/* Truncated Body Preview */}
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
          lineHeight: 1.5,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          padding: '12px',
          borderRadius: '10px',
          minHeight: '72px',
          marginBottom: '16px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: '0 0 16px 0',
        }}>
          {template.body_text}
        </p>
      </div>

      {/* Footer row */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          <span>Synced:
            <strong style={{ marginLeft: '4px', color: template.sync_status === 'SYNCED' ? 'var(--success)' : '#D97706' }}>
              {template.sync_status.replace('_', ' ')}
            </strong>
          </span>
          <span>Updated: {updatedStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => onPreview(template)} style={iconBtnStyle} title="Preview Message"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <Eye size={13} />
            </button>
            <button onClick={() => onEdit(template)} style={iconBtnStyle} title="Edit Template"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(template)}
              disabled={isDeleting}
              title="Delete Template"
              style={{ ...iconBtnStyle, opacity: isDeleting ? 0.4 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = '#FECACA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isMetaSyncable && (
              <button
                onClick={() => onSyncStatus(template)}
                disabled={isSyncing}
                title="Sync Status from Meta"
                style={{ ...iconBtnStyle, opacity: isSyncing ? 0.4 : 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            )}

            {isMetaPushable && (
              <button
                onClick={() => onPushToMeta(template)}
                disabled={isPushing}
                title="Push Local Template to Meta for approval"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  background: 'var(--error-light)',
                  border: '1px solid #FECACA',
                  color: 'var(--error)',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: isPushing ? 'not-allowed' : 'pointer',
                  opacity: isPushing ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = 'var(--error)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--error-light)'; e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = '#FECACA'; }}
              >
                <CloudLightning size={10} />
                {isPushing ? 'Pushing...' : 'Push to Meta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

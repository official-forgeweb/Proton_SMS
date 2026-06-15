'use client';
import React from 'react';
import { ToggleLeft, ToggleRight, Play, Edit2, Trash2, Calendar, Users, Zap } from 'lucide-react';
import { AutomationRule } from '@/hooks/useAutomations';


interface AutomationCardProps {
  rule: AutomationRule;
  onToggleActive: (rule: AutomationRule) => void;
  onTestRule: (rule: AutomationRule) => void;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (rule: AutomationRule) => void;
  isToggling: boolean;
  isTesting: boolean;
  isDeleting: boolean;
}

export default function AutomationCard({
  rule,
  onToggleActive,
  onTestRule,
  onEdit,
  onDelete,
  isToggling,
  isTesting,
  isDeleting,
}: AutomationCardProps) {
  const lastRunStr = rule.last_run 
    ? new Date(rule.last_run).toLocaleDateString() + ' ' + new Date(rule.last_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never run';

  const getEventLabel = (evt: string) => {
    switch (evt) {
      case 'STUDENT_CREATED': return 'New Student Welcome';
      case 'TEACHER_CREATED': return 'New Teacher Welcome';
      case 'COORDINATOR_CREATED': return 'New Coordinator Welcome';
      case 'TIMETABLE_CREATED': return 'Weekly Timetable Published';
      case 'TEST_SCHEDULED': return 'Exam / Test Scheduled';
      case 'TEACHER_SCHEDULE_CREATED': return 'Teacher Schedule Assigned';
      case 'QUERY_RAISED': return 'New Student Support Query';
      case 'QUERY_RESPONDED': return 'Support Query Response';
      case 'FEE_REMINDER_CRON': return 'Fee Reminder (Weekly)';
      case 'CLASS_REMINDER_CRON': return 'Daily Class Reminder';
      default: return evt.replace(/_/g, ' ');
    }
  };

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
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s',
      opacity: rule.is_active ? 1 : 0.7,
    }}>

      {/* Upper Area */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Zap size={14} style={{ color: rule.is_active ? 'var(--error)' : 'var(--text-tertiary)' }} />
              {rule.name}
            </h4>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
              Trigger: {getEventLabel(rule.trigger_event)}
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggleActive(rule)}
            disabled={isToggling}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.15s' }}
            title={rule.is_active ? 'Disable Rule' : 'Enable Rule'}
          >
            {rule.is_active ? (
              <ToggleRight style={{ color: 'var(--error)' }} size={32} />
            ) : (
              <ToggleLeft style={{ color: 'var(--text-tertiary)' }} size={32} />
            )}
          </button>
        </div>

        {/* Template Indicator */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Template Linked</span>
          <span style={{ color: 'var(--text-primary)' }}>{rule.template?.name || 'Unknown Template'}</span>
        </div>
      </div>

      {/* Stats / Parameters */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span>Targets: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{rule.target_group}</strong></span>
          </div>
          {rule.cron_schedule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span>Cron: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '4px', color: 'var(--error)', fontFamily: 'monospace', fontSize: '9px' }}>{rule.cron_schedule}</code></span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            <span>Last Run:</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{lastRunStr}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => onEdit(rule)} style={iconBtnStyle} title="Edit Rule Settings"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(rule)}
              disabled={isDeleting}
              title="Delete Rule"
              style={{ ...iconBtnStyle, opacity: isDeleting ? 0.4 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.borderColor = '#FECACA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          <button
            onClick={() => onTestRule(rule)}
            disabled={isTesting}
            title="Execute Trigger Test With Sample Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: isTesting ? 'not-allowed' : 'pointer',
              opacity: isTesting ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
          >
            <Play size={10} fill="currentColor" />
            {isTesting ? 'Testing...' : 'Test Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

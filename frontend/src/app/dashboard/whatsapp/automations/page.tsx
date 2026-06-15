'use client';
import { useState } from 'react';
import { useAutomations, AutomationRule } from '@/hooks/useAutomations';
import { useTemplates } from '@/hooks/useTemplates';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import AutomationCard from '@/components/whatsapp/AutomationCard';
import { customConfirm, customAlert } from '@/utils/dialog';
import { Plus, Play, Sparkles, X, AlertCircle } from 'lucide-react';
import React from 'react';

export default function WhatsAppAutomations() {
  const { status } = useWhatsAppConfig();
  const { templates } = useTemplates();
  const {
    rules, loading, actionLoading, createRule, updateRule, deleteRule, toggleRule, testRule, manuallyTriggerCron
  } = useAutomations();

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [activeRule, setActiveRule] = useState<AutomationRule | null>(null);

  // Form Fields State
  const [ruleName, setRuleName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('STUDENT_CREATED');
  const [targetGroup, setTargetGroup] = useState('STUDENT');
  const [templateId, setTemplateId] = useState('');
  const [cronSchedule, setCronSchedule] = useState('');

  const triggerEventsList = [
    { value: 'STUDENT_CREATED', label: 'Student Created (Welcome)' },
    { value: 'TEACHER_CREATED', label: 'Teacher Created (Welcome)' },
    { value: 'COORDINATOR_CREATED', label: 'Coordinator Created (Welcome)' },
    { value: 'TIMETABLE_CREATED', label: 'Timetable Created (Broadcast)' },
    { value: 'TEST_SCHEDULED', label: 'Exam / Test Scheduled' },
    { value: 'TEACHER_SCHEDULE_CREATED', label: 'Teacher Schedule Assigned' },
    { value: 'QUERY_RAISED', label: 'Support Query Raised (Admin Alert)' },
    { value: 'QUERY_RESPONDED', label: 'Support Query Responded' },
    { value: 'FEE_REMINDER_CRON', label: 'Fee Reminder (Cron Schedule)' },
    { value: 'CLASS_REMINDER_CRON', label: 'Class Reminder (Cron Schedule)' },
  ];

  const handleEditClick = (rule: AutomationRule) => {
    setActiveRule(rule);
    setRuleName(rule.name);
    setTriggerEvent(rule.trigger_event);
    setTargetGroup(rule.target_group);
    setTemplateId(rule.template_id);
    setCronSchedule(rule.cron_schedule || '');
    setFormOpen(true);
  };

  const handleCreateClick = () => {
    setActiveRule(null);
    setRuleName('');
    setTriggerEvent('STUDENT_CREATED');
    setTargetGroup('STUDENT');
    setTemplateId('');
    setCronSchedule('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!ruleName.trim()) {
      alert('Rule Name is required');
      return;
    }
    if (!templateId) {
      alert('Template selection is required');
      return;
    }

    const payload = {
      name: ruleName.trim(),
      trigger_event: triggerEvent,
      target_group: targetGroup,
      template_id: templateId,
      cron_schedule: triggerEvent.endsWith('_CRON') ? cronSchedule : null,
    };

    let res;
    if (activeRule) {
      res = await updateRule(activeRule.id, payload);
    } else {
      res = await createRule(payload);
    }

    if (res.success) {
      setFormOpen(false);
      customAlert('Automation rule saved successfully!', 'Saved');
    } else {
      customAlert(res.error || 'Failed to save automation rule.', 'Save Error');
    }
  };

  const handleDelete = async (rule: AutomationRule) => {
    const confirm = await customConfirm(
      `Are you sure you want to delete the automation rule "${rule.name}"?`,
      'Confirm Rule Deletion'
    );
    if (confirm) {
      const res = await deleteRule(rule.id);
      if (res.success) {
        customAlert('Automation rule deleted.', 'Deleted');
      } else {
        customAlert(res.error || 'Failed to delete rule.', 'Error');
      }
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    const res = await toggleRule(rule.id, !rule.is_active);
    if (!res.success) {
      customAlert(res.error || 'Failed to toggle rule state.', 'Toggle Error');
    }
  };

  const handleTestNow = async (rule: AutomationRule) => {
    const res = await testRule(rule.id);
    if (res.success) {
      customAlert(res.message || 'Test automation run initiated successfully.', 'Test Activated');
    } else {
      customAlert(res.error || 'Test run trigger failed.', 'Error');
    }
  };

  const handleTriggerCron = async (cronType: string) => {
    const res = await manuallyTriggerCron(cronType);
    if (res.success) {
      customAlert(res.message || 'Cron script executed successfully in background.', 'Cron Activated');
    } else {
      customAlert(res.error || 'Failed to trigger cron script.', 'Cron Error');
    }
  };

  const isMock = status?.is_mock_mode || false;
  const isCronActive = triggerEvent.endsWith('_CRON');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Automation Rules
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Map platform database events (new students, timetables, test schedules) to auto-delivered WhatsApp templates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleTriggerCron('CLASS_REMINDER_CRON')}
            disabled={actionLoading === 'trigger-CLASS_REMINDER_CRON'}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
            title="Execute Class reminders script immediately"
          >
            <Play size={12} fill="currentColor" />
            Trigger Class Reminders
          </button>
          
          <button
            onClick={() => handleTriggerCron('FEE_REMINDER_CRON')}
            disabled={actionLoading === 'trigger-FEE_REMINDER_CRON'}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
            title="Execute Fee reminders script immediately"
          >
            <Play size={12} fill="currentColor" />
            Trigger Fee Reminders
          </button>

          <button
            onClick={handleCreateClick}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <Plus size={14} />
            Create Rule
          </button>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMock} />

      {/* Intro info box */}
      <div style={{ 
        background: 'var(--primary-50)', 
        border: '1px solid var(--primary-100)', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        display: 'flex', 
        alignItems: 'start', 
        gap: '14px' 
      }}>
        <div style={{ 
          padding: '8px', 
          background: 'rgba(229, 57, 53, 0.08)', 
          borderRadius: '10px', 
          color: 'var(--primary)', 
          border: '1px solid rgba(229, 57, 53, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sparkles size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Non-Blocking Operations</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            All automations are processed in the background. If a webhook or automation rule fails, the main user operation (e.g. enrolling a student or posting attendance) will continue to succeed without delay or errors.
          </p>
        </div>
      </div>

      {/* Rules list grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ height: '180px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '180px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '180px', borderRadius: '16px' }} className="skeleton" />
        </div>
      ) : rules.length === 0 ? (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '48px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '13px' }}>
          No automation rules configured. Seed templates or click Create Rule to initialize.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {rules.map((rule) => (
            <AutomationCard
              key={rule.id}
              rule={rule}
              onToggleActive={handleToggle}
              onTestRule={handleTestNow}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              isToggling={actionLoading === `toggle-${rule.id}`}
              isTesting={actionLoading === `test-${rule.id}`}
              isDeleting={actionLoading === `delete-${rule.id}`}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {formOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(26, 29, 59, 0.5)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '16px' 
        }}>
          <div 
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '480px', 
              boxShadow: 'var(--shadow-xl)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              maxHeight: '90vh' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 24px', 
              background: '#FAFAFC', 
              borderBottom: '1px solid var(--border-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h3>
              <button 
                onClick={() => setFormOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Scroll Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Send Welcome on student sign up"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                />
              </div>

              {/* Trigger event dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Trigger Event</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => {
                    setTriggerEvent(e.target.value);
                    if (e.target.value.includes('STUDENT')) setTargetGroup('STUDENT');
                    else if (e.target.value.includes('TEACHER')) setTargetGroup('TEACHER');
                    else if (e.target.value.includes('COORDINATOR')) setTargetGroup('COORDINATOR');
                    else setTargetGroup('ALL');
                  }}
                  className="input-field"
                  style={{ fontSize: '13px', cursor: 'pointer' }}
                >
                  {triggerEventsList.map((evt) => (
                    <option key={evt.value} value={evt.value}>
                      {evt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Message Template to dispatch</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} ({tmpl.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Target Group</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="STUDENT">Students</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="COORDINATOR">Coordinators</option>
                  <option value="PARENT">Parents</option>
                  <option value="ALL">All Contacts (Students/Teachers/Admin)</option>
                </select>
              </div>

              {/* Cron expression (shows only if Cron triggers) */}
              {isCronActive && (
                <div style={{ 
                  background: '#FAFAFC', 
                  padding: '16px', 
                  border: '1px solid var(--border-primary)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
                    Cron Expression Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0 9 * * 1 (Every Monday at 9:00 AM)"
                    value={cronSchedule}
                    onChange={(e) => setCronSchedule(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--primary-600)' }}
                  />
                  <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Standard 5-field cron syntax: Minute Hour Day-of-Month Month Day-of-Week.
                  </p>
                </div>
              )}

            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', background: '#FAFAFC', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setFormOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="btn btn-primary"
              >
                Save Rule Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

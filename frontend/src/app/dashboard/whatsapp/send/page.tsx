'use client';
import { useState, useEffect } from 'react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useTemplates, Template } from '@/hooks/useTemplates';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import RecipientSelector, { RecipientSelection } from '@/components/whatsapp/RecipientSelector';
import VariableInput from '@/components/whatsapp/VariableInput';
import PhonePreview from '@/components/whatsapp/PhonePreview';
import MessagePreview from '@/components/whatsapp/MessagePreview';
import { customConfirm, customAlert } from '@/utils/dialog';
import api from '@/lib/api';
import { Send, Info, AlertTriangle } from 'lucide-react';
import React from 'react';

export default function WhatsAppSend() {
  const { status } = useWhatsAppConfig();
  const { templates } = useTemplates();

  // Mode selection: TEMPLATE vs FREE_TEXT
  const [sendMode, setSendMode] = useState<'TEMPLATE' | 'FREE_TEXT'>('TEMPLATE');

  // Recipient state
  const [recipients, setRecipients] = useState<RecipientSelection>({
    type: 'CUSTOM',
    customPhone: '',
    selectedIds: [],
    recipientNames: [],
  });

  // Template sending state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVars, setTemplateVars] = useState<string[]>([]);

  // Free text sending state
  const [freeText, setFreeText] = useState('');

  const [sending, setSending] = useState(false);

  // Update selected template
  useEffect(() => {
    if (selectedTemplateId) {
      const tmpl = templates.find((t) => t.id === selectedTemplateId) || null;
      setSelectedTemplate(tmpl);
      setTemplateVars([]);
    } else {
      setSelectedTemplate(null);
      setTemplateVars([]);
    }
  }, [selectedTemplateId, templates]);

  const handleSend = async () => {
    // 1. Validations
    if (recipients.type === 'CUSTOM' && !recipients.customPhone.trim()) {
      customAlert('Please enter a recipient phone number.', 'Validation Error');
      return;
    }

    if (recipients.type !== 'CUSTOM' && recipients.selectedIds.length === 0) {
      customAlert('Please select at least one recipient.', 'Validation Error');
      return;
    }

    if (sendMode === 'TEMPLATE') {
      if (!selectedTemplate) {
        customAlert('Please select a template.', 'Validation Error');
        return;
      }
      // Check variables count
      let reqCount = 0;
      if (selectedTemplate.variables_description) {
        const desc = typeof selectedTemplate.variables_description === 'string'
          ? JSON.parse(selectedTemplate.variables_description)
          : selectedTemplate.variables_description;
        reqCount = desc.length;
      }
      if (templateVars.filter(Boolean).length < reqCount) {
        customAlert('Please fill in all template variables.', 'Validation Error');
        return;
      }
    } else {
      if (!freeText.trim()) {
        customAlert('Please write a message body.', 'Validation Error');
        return;
      }
    }

    // 2. Prepare payload & resolve recipients list
    setSending(true);
    try {
      let resolvedRecipients: { phone: string; name: string; type: string; userId?: string }[] = [];

      if (recipients.type === 'CUSTOM') {
        resolvedRecipients.push({
          phone: recipients.customPhone,
          name: 'Custom Contact',
          type: 'CUSTOM',
        });
      } else if (recipients.type === 'STUDENT') {
        // Fetch students to get phone numbers
        const res = await api.get('/students?limit=500');
        const allStudents = res.data.data || [];
        recipients.selectedIds.forEach((id) => {
          const student = allStudents.find((s: any) => s.id === id);
          if (student && student.phone) {
            resolvedRecipients.push({
              phone: student.phone,
              name: `${student.first_name} ${student.last_name}`,
              type: 'STUDENT',
              userId: student.user_id,
            });
          }
        });
      } else if (recipients.type === 'TEACHER') {
        const res = await api.get('/teachers');
        const allTeachers = res.data.data || [];
        recipients.selectedIds.forEach((id) => {
          const teacher = allTeachers.find((t: any) => t.id === id);
          if (teacher && teacher.phone) {
            resolvedRecipients.push({
              phone: teacher.phone,
              name: `${teacher.first_name} ${teacher.last_name}`,
              type: 'TEACHER',
              userId: teacher.user_id,
            });
          }
        });
      } else if (recipients.type === 'BATCH') {
        // Resolve all active students in the selected class
        for (const classId of recipients.selectedIds) {
          const res = await api.get(`/students?class_id=${classId}&limit=200`);
          const classStudents = res.data.data || [];
          classStudents.forEach((student: any) => {
            if (student.phone) {
              resolvedRecipients.push({
                phone: student.phone,
                name: `${student.first_name} ${student.last_name}`,
                type: 'STUDENT',
                userId: student.user_id,
              });
            }
          });
        }
      }

      if (resolvedRecipients.length === 0) {
        customAlert('Could not resolve phone numbers for selected recipients.', 'Send Error');
        setSending(false);
        return;
      }

      const totalRecipients = resolvedRecipients.length;
      const isBulk = totalRecipients > 1;

      // Ask for confirmation
      const isMock = status?.is_mock_mode || false;
      const confirmMsg = isBulk
        ? `Are you sure you want to queue ${totalRecipients} messages for broadcast?${isMock ? ' (Mock mode active - no real SMS will be charged)' : ''}`
        : `Are you sure you want to send this message to ${resolvedRecipients[0].name}?`;

      const approved = await customConfirm(confirmMsg, isMock ? 'Confirm Mock Send' : 'Confirm Message Send');
      if (!approved) {
        setSending(false);
        return;
      }

      let response;
      if (isBulk) {
        // Bulk Broadcast Queue API
        const messages = resolvedRecipients.map((rec) => ({
          phone: rec.phone,
          templateName: selectedTemplate?.name,
          variables: templateVars,
          recipientName: rec.name,
          recipientType: rec.type,
          recipientUserId: rec.userId,
        }));

        response = await api.post('/whatsapp/send/bulk', { messages });
        customAlert(
          response.data.message || `${totalRecipients} messages added to bulk broadcast queue successfully!`,
          'Queue Activated'
        );
      } else {
        // Single Send API
        const rec = resolvedRecipients[0];
        if (sendMode === 'TEMPLATE') {
          response = await api.post('/whatsapp/send/template', {
            phone: rec.phone,
            templateName: selectedTemplate?.name,
            variables: templateVars,
            recipientName: rec.name,
            recipientType: rec.type,
            recipientUserId: rec.userId,
          });
        } else {
          response = await api.post('/whatsapp/send/text', {
            phone: rec.phone,
            text: freeText,
            recipientName: rec.name,
            recipientType: rec.type,
            recipientUserId: rec.userId,
          });
        }

        customAlert(
          response.data.message || 'Message sent successfully!',
          'Transmission Complete'
        );
      }

      // Clear text fields
      setFreeText('');
      setTemplateVars([]);
    } catch (err: any) {
      console.error(err);
      customAlert(err.response?.data?.message || 'Failed to dispatch messages.', 'Transmission Error');
    } finally {
      setSending(false);
    }
  };

  const isMock = status?.is_mock_mode || false;
  // Only Approved templates can be selected
  const approvedTemplates = templates.filter((t) => t.status === 'APPROVED' || isMock);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Send Message
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Broadcast approved template notifications to student batches or send quick transactional texts to numbers.
        </p>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMock} />

      {/* Send Mode Select Tab */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '24px' }}>
        <button
          onClick={() => setSendMode('TEMPLATE')}
          style={{
            background: 'none',
            border: 'none',
            paddingBottom: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            position: 'relative',
            transition: 'color 0.2s',
            color: sendMode === 'TEMPLATE' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Send Template Message
          {sendMode === 'TEMPLATE' && (
            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
          )}
        </button>

        <button
          onClick={() => setSendMode('FREE_TEXT')}
          style={{
            background: 'none',
            border: 'none',
            paddingBottom: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            position: 'relative',
            transition: 'color 0.2s',
            color: sendMode === 'FREE_TEXT' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Send Free Text (24hr Window)
          {sendMode === 'FREE_TEXT' && (
            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Form Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Recipient Selection Card */}
          <div style={{ 
            background: 'var(--bg-primary)', 
            border: '1px solid var(--border-primary)', 
            borderRadius: '16px', 
            padding: '20px', 
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              borderBottom: '1px solid var(--border-primary)', 
              paddingBottom: '8px',
              display: 'block'
            }}>
              1. Choose Recipient
            </span>
            <RecipientSelector 
              value={recipients}
              onChange={setRecipients}
            />
          </div>

          {/* Message Content Selection */}
          {sendMode === 'TEMPLATE' ? (
            <div style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                borderBottom: '1px solid var(--border-primary)', 
                paddingBottom: '8px',
                display: 'block'
              }}>
                2. Select Template & Parameters
              </span>

              {/* Template Select Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Approved Template Name</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="">-- Choose Approved Template --</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p style={{ fontSize: '10px', color: 'var(--warning)', fontWeight: 700, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={11} /> No templates are approved on Meta. Configure drafts and push them first.
                  </p>
                )}
              </div>

              {/* Variable inputs */}
              {selectedTemplate && (
                <VariableInput 
                  descriptions={selectedTemplate.variables_description}
                  value={templateVars}
                  onChange={setTemplateVars}
                />
              )}
            </div>
          ) : (
            // Free Text Box
            <div style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)', 
              borderRadius: '16px', 
              padding: '20px', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 800, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                borderBottom: '1px solid var(--border-primary)', 
                paddingBottom: '8px',
                display: 'block'
              }}>
                2. Write Custom Text
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Message Body</label>
                <textarea
                  rows={6}
                  placeholder="Write your custom message here. Note: Free text messages can ONLY be delivered if the recipient has interacted with your Business account in the last 24 hours."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px', lineHeight: 1.5, resize: 'vertical', minHeight: '120px' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Info size={13} /> Custom text supports bold (*bold*), italics (_italics_), and monospace (```code```).
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Phone Mockup Preview Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'block' }}>
            Live Sending Preview
          </span>
          <PhonePreview title="Proton Notifications">
            {sendMode === 'TEMPLATE' && selectedTemplate ? (
              <MessagePreview 
                bodyText={selectedTemplate.body_text}
                headerType={selectedTemplate.header_type}
                headerContent={selectedTemplate.header_content || ''}
                footerText={selectedTemplate.footer_text || ''}
                buttons={selectedTemplate.buttons}
                variables={templateVars}
                status="PENDING"
                time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            ) : sendMode === 'FREE_TEXT' && freeText.trim() ? (
              <MessagePreview 
                bodyText={freeText}
                status="PENDING"
                time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>
                Select a template or type a text on the left to show live mock view.
              </div>
            )}
          </PhonePreview>
        </div>

      </div>

      {/* Dispatch Action bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderTop: '1px solid var(--border-primary)', 
        paddingTop: '24px', 
        marginTop: '12px' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Transmission Cost:</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)' }}>
            {isMock ? 'INR 0.00 (Mocked)' : 'Meta rate plan applies'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="btn btn-primary"
          style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Send size={16} />
          {sending ? 'Sending...' : isMock ? 'Send Broadcast (Mock)' : 'Send Live Broadcast'}
        </button>
      </div>

    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowRight } from 'lucide-react';
import PhonePreview from './PhonePreview';
import MessagePreview from './MessagePreview';

interface TemplateItem {
  id?: string;
  name: string;
  category: string;
  language: string;
  status: string;
  sync_status: string;
  body_text: string;
  footer_text: string | null;
  header_type: string;
  header_content: string | null;
  buttons: any;
  variables_description: any;
  sample_values: any;
}

interface TemplateFormProps {
  template: TemplateItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, pushToMeta: boolean) => void;
  isSaving: boolean;
}

export default function TemplateForm({
  template,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: TemplateFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('UTILITY');
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');

  const [buttons, setButtons] = useState<any[]>([]);
  const [variables, setVariables] = useState<number[]>([]);
  const [varDesc, setVarDesc] = useState<Record<number, string>>({});
  const [varSamples, setVarSamples] = useState<Record<number, string>>({});

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setLanguage(template.language);
      setHeaderType(template.header_type);
      setHeaderContent(template.header_content || '');
      setBodyText(template.body_text);
      setFooterText(template.footer_text || '');

      if (template.buttons) {
        setButtons(typeof template.buttons === 'string' ? JSON.parse(template.buttons) : template.buttons);
      } else {
        setButtons([]);
      }

      const parsedDesc: Record<number, string> = {};
      const parsedSamples: Record<number, string> = {};

      const descList = typeof template.variables_description === 'string' ? JSON.parse(template.variables_description) : template.variables_description;
      const sampleList = typeof template.sample_values === 'string' ? JSON.parse(template.sample_values) : template.sample_values;

      if (Array.isArray(descList)) {
        descList.forEach((d, idx) => { parsedDesc[idx + 1] = d; });
      }
      if (Array.isArray(sampleList)) {
        sampleList.forEach((s, idx) => { parsedSamples[idx + 1] = s; });
      }
      setVarDesc(parsedDesc);
      setVarSamples(parsedSamples);
    } else {
      setName('');
      setCategory('UTILITY');
      setLanguage('en_US');
      setHeaderType('NONE');
      setHeaderContent('');
      setBodyText('');
      setFooterText('');
      setButtons([]);
      setVarDesc({});
      setVarSamples({});
    }
  }, [template, isOpen]);

  useEffect(() => {
    const regex = /\{\{(\d+)\}\}/g;
    let match;
    const foundVars: number[] = [];
    while ((match = regex.exec(bodyText)) !== null) {
      const num = parseInt(match[1]);
      if (!foundVars.includes(num)) {
        foundVars.push(num);
      }
    }
    foundVars.sort((a, b) => a - b);
    setVariables(foundVars);
  }, [bodyText]);

  if (!isOpen) return null;

  const handleInsertVariable = () => {
    const nextNum = variables.length > 0 ? Math.max(...variables) + 1 : 1;
    setBodyText(bodyText + `{{${nextNum}}}`);
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'QUICK_REPLY', text: 'New Button' }]);
  };

  const handleRemoveButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleButtonChange = (idx: number, field: string, val: string) => {
    const updated = [...buttons];
    updated[idx] = { ...updated[idx], [field]: val };
    setButtons(updated);
  };

  const handleSaveClick = (pushToMeta: boolean) => {
    if (!name.trim()) { alert('Template Name is required'); return; }
    if (!/^[a-z0-9_]+$/.test(name)) {
      alert('Template Name must contain only lowercase letters, numbers, and underscores (no spaces/dashes)');
      return;
    }
    if (!bodyText.trim()) { alert('Template Body text is required'); return; }

    if (variables.length > 0) {
      const maxVar = Math.max(...variables);
      if (maxVar !== variables.length) {
        alert(`Variables must be sequential starting from {{1}}. You have variables up to {{${maxVar}}} but only ${variables.length} unique placeholders.`);
        return;
      }
    }

    const variables_description = variables.map((num) => varDesc[num] || `Var ${num}`);
    const sample_values = variables.map((num) => varSamples[num] || `Sample ${num}`);

    const payload = {
      name: name.trim(),
      category,
      language,
      header_type: headerType,
      header_content: headerType !== 'NONE' ? headerContent : null,
      body_text: bodyText,
      footer_text: footerText.trim() ? footerText.trim() : null,
      buttons: buttons.length > 0 ? buttons : null,
      variables_description,
      sample_values,
    };

    onSave(payload, pushToMeta);
  };

  const previewSamples = variables.map((num) => varSamples[num] || `{{${num}}}`);

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1024px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {template ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {template ? `Sync Status: ${template.sync_status}` : 'New Local Draft'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-tertiary)',
              padding: '6px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Split Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '7fr 5fr' }}>

          {/* Left Side Form Scroll */}
          <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border-primary)' }}>

            {/* Template Info Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Template Name</label>
                <input
                  type="text"
                  disabled={!!template}
                  placeholder="e.g. welcome_student"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  style={{ ...inputStyle, opacity: template ? 0.5 : 1 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                />
                {!template && (
                  <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                    Lowercase letters, numbers, and underscores only.
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="UTILITY">Utility (Transactional/Alerts)</option>
                  <option value="MARKETING">Marketing (Offers/Promotions)</option>
                  <option value="AUTHENTICATION">Authentication (OTPs)</option>
                </select>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label style={labelStyle}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...inputStyle, maxWidth: '200px', cursor: 'pointer' }}
              >
                <option value="en_US">English (US)</option>
                <option value="es_ES">Spanish</option>
                <option value="hi_IN">Hindi</option>
              </select>
            </div>

            {/* Header Settings */}
            <div style={sectionStyle}>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Header Configuration</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>Header Type</label>
                  <select
                    value={headerType}
                    onChange={(e) => { setHeaderType(e.target.value); setHeaderContent(''); }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="NONE">None</option>
                    <option value="TEXT">Text Header</option>
                    <option value="IMAGE">Image Media Header</option>
                    <option value="DOCUMENT">Document Attachment</option>
                    <option value="VIDEO">Video Attachment</option>
                  </select>
                </div>

                {headerType !== 'NONE' && (
                  <div>
                    <label style={{ ...labelStyle, fontSize: '10px' }}>
                      {headerType === 'TEXT' ? 'Header Text' : 'Media URL / Sample Link'}
                    </label>
                    <input
                      type="text"
                      placeholder={headerType === 'TEXT' ? 'e.g. Important Notice' : 'e.g. https://domain.com/doc.pdf'}
                      value={headerContent}
                      onChange={(e) => setHeaderContent(e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Body Editor */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Template Body Text</label>
                <button
                  type="button"
                  onClick={handleInsertVariable}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--error)',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  + Add Variable
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Write your template text. Type *text* for bold, _text_ for italics, and ```text``` for code format. Use variables like {{1}}, {{2}} for dynamic values."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                style={{
                  ...inputStyle,
                  borderRadius: '12px',
                  padding: '16px',
                  lineHeight: 1.5,
                  resize: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
              />
            </div>

            {/* Footer Text */}
            <div>
              <label style={labelStyle}>Footer Text (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Reply STOP to opt out"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--error)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
              />
            </div>

            {/* Dynamic Variables Descriptions / Samples */}
            {variables.length > 0 && (
              <div style={sectionStyle}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variables Description & Samples</span>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  Define what each variable represents and provide real sample values. These samples are <strong>mandatory</strong> for Meta's review process.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {variables.map((num) => (
                    <div key={num} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                    }}>
                      <div>
                        <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                          Variable {`{{${num}}}`} Description
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Student Full Name"
                          value={varDesc[num] || ''}
                          onChange={(e) => setVarDesc({ ...varDesc, [num]: e.target.value })}
                          style={{ ...inputStyle, padding: '6px 10px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                          Sample Value for Review
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={varSamples[num] || ''}
                          onChange={(e) => setVarSamples({ ...varSamples, [num]: e.target.value })}
                          style={{ ...inputStyle, padding: '6px 10px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons Builder */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Buttons (Max 3)</span>
                {buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                    }}
                  >
                    <Plus size={12} /> Add Button
                  </button>
                )}
              </div>

              {buttons.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px' }}>No buttons configured.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {buttons.map((btn, idx) => (
                    <div key={idx} style={{
                      background: 'var(--bg-primary)',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Button Type</label>
                          <select
                            value={btn.type}
                            onChange={(e) => handleButtonChange(idx, 'type', e.target.value)}
                            style={{ ...inputStyle, padding: '4px 10px', cursor: 'pointer' }}
                          >
                            <option value="QUICK_REPLY">Quick Reply (Free text response)</option>
                            <option value="URL">Visit Website URL</option>
                            <option value="PHONE_NUMBER">Call Phone Number</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Label Text</label>
                          <input
                            type="text"
                            placeholder="e.g. Accept Admission"
                            value={btn.text}
                            onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                            style={{ ...inputStyle, padding: '4px 10px', fontWeight: 600 }}
                          />
                        </div>

                        {btn.type === 'URL' && (
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Target URL</label>
                            <input
                              type="text"
                              placeholder="e.g. https://domain.com"
                              value={btn.url || ''}
                              onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                              style={{ ...inputStyle, padding: '4px 10px' }}
                            />
                          </div>
                        )}
                        {btn.type === 'PHONE_NUMBER' && (
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                            <input
                              type="text"
                              placeholder="e.g. +919999999999"
                              value={btn.phoneNumber || ''}
                              onChange={(e) => handleButtonChange(idx, 'phoneNumber', e.target.value)}
                              style={{ ...inputStyle, padding: '4px 10px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Live Mobile Preview */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', userSelect: 'none' }}>
                Interactive Preview
              </span>
              <PhonePreview title="Proton LMS Notification">
                <MessagePreview
                  bodyText={bodyText || 'Start typing in the editor on the left to see the message formatting appear here.'}
                  headerType={headerType}
                  headerContent={headerContent}
                  footerText={footerText}
                  buttons={buttons}
                  variables={previewSamples}
                  status="READ"
                  time={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
              </PhonePreview>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleSaveClick(false)}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              Save Local Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveClick(true)}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--error)',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.2)',
                transition: 'all 0.15s',
              }}
            >
              Save & Push to Meta
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

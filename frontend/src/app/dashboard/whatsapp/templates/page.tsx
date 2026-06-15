'use client';
import { useState } from 'react';
import { useTemplates, Template } from '@/hooks/useTemplates';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import TemplateCard from '@/components/whatsapp/TemplateCard';
import TemplateForm from '@/components/whatsapp/TemplateForm';
import PhonePreview from '@/components/whatsapp/PhonePreview';
import MessagePreview from '@/components/whatsapp/MessagePreview';
import { customConfirm, customAlert } from '@/utils/dialog';
import { 
  Plus, RefreshCw, CloudLightning, Search, X, FileText
} from 'lucide-react';
import React from 'react';

export default function WhatsAppTemplates() {
  const { status } = useWhatsAppConfig();
  const {
    templates, loading, actionLoading, createTemplate, updateTemplate, deleteTemplate, 
    syncSingleTemplate, syncAllTemplates, pushTemplateToMeta, pushAllDrafts
  } = useTemplates();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Search / Filters execution
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.body_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = !categoryFilter || t.category === categoryFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesLang = !langFilter || t.language === langFilter;

    return matchesSearch && matchesCat && matchesStatus && matchesLang;
  });

  const handleEditClick = (template: Template) => {
    setActiveTemplate(template);
    setFormOpen(true);
  };

  const handleCreateClick = () => {
    setActiveTemplate(null);
    setFormOpen(true);
  };

  const handleDeleteClick = async (template: Template) => {
    const confirm = await customConfirm(
      `Are you sure you want to delete template "${template.name}"? This will delete it locally and attempt to delete it on Meta.`,
      'Confirm Deletion'
    );
    if (confirm) {
      const res = await deleteTemplate(template.id);
      if (res.success) {
        customAlert('Template deleted successfully.', 'Success');
      } else {
        customAlert(res.error || 'Failed to delete template.', 'Error');
      }
    }
  };

  const handlePreviewClick = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleFormSave = async (payload: any, pushToMeta: boolean) => {
    let res;
    if (activeTemplate?.id) {
      res = await updateTemplate(activeTemplate.id, payload);
    } else {
      res = await createTemplate(payload);
    }

    if (res.success) {
      const templateId = res.data.id;
      setFormOpen(false);
      
      if (pushToMeta) {
        const pushRes = await pushTemplateToMeta(templateId);
        if (pushRes.success) {
          customAlert('Template saved and successfully pushed to Meta for review!', 'Push Completed');
        } else {
          customAlert(`Template saved locally but push to Meta failed: ${pushRes.error}`, 'Push Failed');
        }
      } else {
        customAlert('Template draft saved successfully.', 'Saved');
      }
    } else {
      customAlert(res.error || 'Failed to save template.', 'Error Saving');
    }
  };

  const handleSyncAll = async () => {
    const res = await syncAllTemplates();
    if (res.success) {
      customAlert('All templates successfully synchronized with Meta Business API.', 'Sync Successful');
    } else {
      customAlert(res.error || 'Sync failed.', 'Sync Error');
    }
  };

  const handlePushAllDrafts = async () => {
    const confirm = await customConfirm(
      'Are you sure you want to push all local DRAFT templates to Meta for approval?',
      'Push All Drafts'
    );
    if (confirm) {
      const res = await pushAllDrafts();
      if (res.success) {
        customAlert('All local draft templates have been pushed to Meta.', 'Success');
      } else {
        customAlert(res.error || 'Failed to push templates.', 'Error');
      }
    }
  };

  const isMock = status?.is_mock_mode || false;
  const syncCountMeta = templates.filter(t => t.sync_status === 'SYNCED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Message Templates
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage local layout drafts and request approval for WhatsApp templates on Meta Developer Portal.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSyncAll}
            disabled={actionLoading === 'sync-all'}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <RefreshCw size={13} className={actionLoading === 'sync-all' ? 'animate-spin' : ''} />
            Sync from Meta
          </button>
          
          <button
            onClick={handlePushAllDrafts}
            disabled={actionLoading === 'push-all'}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <CloudLightning size={13} />
            Push All Drafts
          </button>

          <button
            onClick={handleCreateClick}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <Plus size={14} />
            Create Template
          </button>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMock} />

      {/* Filter Bar */}
      <div style={{ 
        background: 'var(--bg-primary)', 
        border: '1px solid var(--border-primary)', 
        borderRadius: '16px', 
        padding: '16px', 
        boxShadow: 'var(--shadow-sm)', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '12px', 
        alignItems: 'center' 
      }}>
        
        {/* Search */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: '#FAFAFC', 
          border: '1px solid var(--border-primary)', 
          borderRadius: '12px', 
          padding: '8px 12px',
          gridColumn: 'span 2'
        }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-800 outline-none py-1 placeholder-slate-400"
            style={{ outline: 'none', border: 'none', background: 'transparent', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', fontSize: '12px', color: 'var(--text-secondary)', borderRadius: '12px', padding: '10px 14px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Categories</option>
          <option value="UTILITY">Utility</option>
          <option value="MARKETING">Marketing</option>
          <option value="AUTHENTICATION">Authentication</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', fontSize: '12px', color: 'var(--text-secondary)', borderRadius: '12px', padding: '10px 14px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAUSED">Paused</option>
        </select>

        {/* Language */}
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', fontSize: '12px', color: 'var(--text-secondary)', borderRadius: '12px', padding: '10px 14px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Languages</option>
          <option value="en_US">English (US)</option>
          <option value="hi_IN">Hindi</option>
        </select>
      </div>

      {/* Sync stats indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        fontSize: '12px', 
        color: 'var(--text-secondary)', 
        fontWeight: 700, 
        background: '#FAFAFC', 
        padding: '12px 20px', 
        border: '1px solid var(--border-primary)', 
        borderRadius: '12px' 
      }}>
        <span>Template Alignment Status</span>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Local Database: <strong style={{ color: 'var(--primary)' }}>{templates.length}</strong> / Meta Synced: <strong style={{ color: 'var(--success)' }}>{syncCountMeta}</strong>
        </span>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ height: '240px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '240px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '240px', borderRadius: '16px' }} className="skeleton" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '64px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontWeight: 550 }}>
          <FileText size={48} style={{ margin: '0 auto 12px auto', color: 'var(--text-tertiary)', opacity: 0.5 }} />
          No templates found matching selected filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: '24px' }}>
          {filteredTemplates.map((item) => (
            <TemplateCard
              key={item.id}
              template={item}
              onPreview={handlePreviewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onSyncStatus={(t) => syncSingleTemplate(t.id)}
              onPushToMeta={(t) => pushTemplateToMeta(t.id)}
              isSyncing={actionLoading === `sync-${item.id}`}
              isPushing={actionLoading === `push-${item.id}`}
              isDeleting={actionLoading === `delete-${item.id}`}
            />
          ))}
        </div>
      )}

      {/* Creation/Edition Form Modal */}
      <TemplateForm
        template={activeTemplate}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleFormSave}
        isSaving={actionLoading === 'create' || (activeTemplate && actionLoading === `edit-${activeTemplate.id}`) || false}
      />

      {/* Preview Modal */}
      {previewOpen && previewTemplate && (
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
              maxWidth: '380px', 
              boxShadow: 'var(--shadow-xl)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              maxHeight: '85vh' 
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
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                Preview: {previewTemplate.name}
              </span>
              <button 
                onClick={() => setPreviewOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Layout Preview */}
            <div style={{ flex: 1, padding: '24px', background: '#FAFAFC', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhonePreview title="Proton LMS Preview">
                <MessagePreview 
                  bodyText={previewTemplate.body_text}
                  headerType={previewTemplate.header_type}
                  headerContent={previewTemplate.header_content || ''}
                  footerText={previewTemplate.footer_text || ''}
                  buttons={previewTemplate.buttons}
                  variables={
                    Array.isArray(previewTemplate.sample_values) 
                      ? previewTemplate.sample_values 
                      : typeof previewTemplate.sample_values === 'string'
                        ? JSON.parse(previewTemplate.sample_values)
                        : []
                  }
                  status="READ"
                  time="10:00 AM"
                />
              </PhonePreview>
            </div>
            
            <div style={{ padding: '16px 24px', background: '#FAFAFC', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

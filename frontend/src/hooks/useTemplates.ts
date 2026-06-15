'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Template {
  id: string;
  meta_template_id: string | null;
  name: string;
  category: string;
  language: string;
  status: string;
  sync_status: string;
  header_type: string;
  header_content: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: any;
  variables_description: any;
  sample_values: any;
  updated_at: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Stores template ID / action type
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/whatsapp/templates');
      setTemplates(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (payload: any) => {
    setActionLoading('create');
    setError(null);
    try {
      const res = await api.post('/whatsapp/templates', payload);
      setTemplates((prev) => [res.data.data, ...prev]);
      return { success: true, data: res.data.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create template.';
      return { success: false, error: msg };
    } finally {
      setActionLoading(null);
    }
  };

  const updateTemplate = async (id: string, payload: any) => {
    setActionLoading(`edit-${id}`);
    setError(null);
    try {
      const res = await api.put(`/whatsapp/templates/${id}`, payload);
      setTemplates((prev) => prev.map((t) => (t.id === id ? res.data.data : t)));
      return { success: true, data: res.data.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update template.';
      return { success: false, error: msg };
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTemplate = async (id: string) => {
    setActionLoading(`delete-${id}`);
    setError(null);
    try {
      await api.delete(`/whatsapp/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete template.';
      return { success: false, error: msg };
    } finally {
      setActionLoading(null);
    }
  };

  const syncSingleTemplate = async (id: string) => {
    setActionLoading(`sync-${id}`);
    try {
      const res = await api.post(`/whatsapp/templates/${id}/sync`);
      setTemplates((prev) => prev.map((t) => (t.id === id ? res.data.data : t)));
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to sync template status.' };
    } finally {
      setActionLoading(null);
    }
  };

  const syncAllTemplates = async () => {
    setActionLoading('sync-all');
    try {
      await api.post('/whatsapp/templates/sync');
      await fetchTemplates();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to sync templates.' };
    } finally {
      setActionLoading(null);
    }
  };

  const pushTemplateToMeta = async (id: string) => {
    setActionLoading(`push-${id}`);
    try {
      const res = await api.post(`/whatsapp/templates/${id}/push`);
      setTemplates((prev) => prev.map((t) => (t.id === id ? res.data.data : t)));
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to push template to Meta.' };
    } finally {
      setActionLoading(null);
    }
  };

  const pushAllDrafts = async () => {
    setActionLoading('push-all');
    try {
      const res = await api.post('/whatsapp/templates/push-all');
      await fetchTemplates();
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to push all drafts.' };
    } finally {
      setActionLoading(null);
    }
  };

  const fetchTemplatesFromMeta = async () => {
    setActionLoading('fetch-meta');
    try {
      const res = await api.get('/whatsapp/templates/meta/list');
      setMetaTemplates(res.data.data || []);
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to fetch Meta templates.' };
    } finally {
      setActionLoading(null);
    }
  };

  return {
    templates,
    metaTemplates,
    loading,
    actionLoading,
    error,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    syncSingleTemplate,
    syncAllTemplates,
    pushTemplateToMeta,
    pushAllDrafts,
    fetchTemplatesFromMeta,
  };
}

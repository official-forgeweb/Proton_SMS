'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface AutomationRule {
  id: string;
  name: string;
  trigger_event: string;
  template_id: string;
  target_group: string;
  is_active: boolean;
  conditions: any;
  cron_schedule: string | null;
  last_run: string | null;
  template: {
    id: string;
    name: string;
  };
}

export function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/whatsapp/automation/rules');
      setRules(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch automation rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const createRule = async (payload: any) => {
    setActionLoading('create');
    setError(null);
    try {
      const res = await api.post('/whatsapp/automation/rules', payload);
      await fetchRules();
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to create rule.' };
    } finally {
      setActionLoading(null);
    }
  };

  const updateRule = async (id: string, payload: any) => {
    setActionLoading(`edit-${id}`);
    setError(null);
    try {
      const res = await api.put(`/whatsapp/automation/rules/${id}`, payload);
      await fetchRules();
      return { success: true, data: res.data.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to update rule.' };
    } finally {
      setActionLoading(null);
    }
  };

  const deleteRule = async (id: string) => {
    setActionLoading(`delete-${id}`);
    setError(null);
    try {
      await api.delete(`/whatsapp/automation/rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete rule.' };
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRule = async (id: string, is_active: boolean) => {
    setActionLoading(`toggle-${id}`);
    try {
      const res = await api.post(`/whatsapp/automation/rules/${id}/toggle`, { is_active });
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active } : r)));
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to toggle rule.' };
    } finally {
      setActionLoading(null);
    }
  };

  const testRule = async (id: string) => {
    setActionLoading(`test-${id}`);
    try {
      const res = await api.post(`/whatsapp/automation/rules/${id}/test`);
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to test automation rule.' };
    } finally {
      setActionLoading(null);
    }
  };

  const manuallyTriggerCron = async (triggerEvent: string) => {
    setActionLoading(`trigger-${triggerEvent}`);
    try {
      const res = await api.post('/whatsapp/automation/trigger', { triggerEvent });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to trigger automation.' };
    } finally {
      setActionLoading(null);
    }
  };

  return {
    rules,
    loading,
    actionLoading,
    error,
    refresh: fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    manuallyTriggerCron,
  };
}

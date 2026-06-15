'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface WhatsAppConfigData {
  id: string;
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  verify_token: string;
  api_version: string;
  api_base_url: string;
  is_active: boolean;
  is_mock_mode: boolean;
  daily_limit: number;
  daily_counter: number;
  webhook_url: string;
  webhook_verified: boolean;
}

export function useWhatsAppConfig() {
  const [config, setConfig] = useState<WhatsAppConfigData | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigAndStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, statusRes] = await Promise.all([
        api.get('/whatsapp/config'),
        api.get('/whatsapp/config/status'),
      ]);
      setConfig(configRes.data.data);
      setStatus(statusRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch WhatsApp configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigAndStatus();
  }, [fetchConfigAndStatus]);

  const saveConfig = async (formData: Partial<WhatsAppConfigData>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post('/whatsapp/config', formData);
      setConfig(res.data.data);
      // Refresh status after saving
      const statusRes = await api.get('/whatsapp/config/status');
      setStatus(statusRes.data.data);
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save configuration.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await api.post('/whatsapp/config/test');
      return { 
        success: res.data.success, 
        message: res.data.message, 
        data: res.data.data 
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'API connection test failed.';
      return { success: false, error: msg };
    } finally {
      setTesting(false);
    }
  };

  const verifyWebhook = async () => {
    try {
      const res = await api.post('/whatsapp/config/verify-webhook');
      if (res.data.success) {
        setStatus((prev: any) => prev ? { ...prev, webhook_verified: true } : null);
      }
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to verify webhook.' };
    }
  };

  return {
    config,
    status,
    loading,
    saving,
    testing,
    error,
    refresh: fetchConfigAndStatus,
    saveConfig,
    testConnection,
    verifyWebhook,
  };
}

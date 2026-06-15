'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export function useLogs(filters: any = {}, page: number = 1, limit: number = 50) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stringify filters object to avoid infinite render/re-fetch loops caused by new object references on every render
  const filtersSerialized = JSON.stringify(filters);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilters = JSON.parse(filtersSerialized);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...Object.fromEntries(
          Object.entries(parsedFilters).filter(([_, v]) => v !== undefined && v !== '')
        ),
      } as any);

      const res = await api.get(`/whatsapp/logs?${queryParams.toString()}`);
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalItems(res.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filtersSerialized]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/whatsapp/logs/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resendMessage = async (id: string) => {
    setResendingId(id);
    try {
      const res = await api.post(`/whatsapp/logs/${id}/resend`);
      // Update local log record if successful
      await fetchLogs();
      await fetchStats();
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to resend message.' };
    } finally {
      setResendingId(null);
    }
  };

  const clearOldLogs = async (days: number = 30) => {
    setClearing(true);
    try {
      const res = await api.delete(`/whatsapp/logs/clear?olderThanDays=${days}`);
      await fetchLogs();
      await fetchStats();
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to clear old logs.' };
    } finally {
      setClearing(false);
    }
  };

  const exportLogsCsv = () => {
    // Navigate window to CSV export route to trigger native browser file download
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/whatsapp/logs/export?token=${token}`;
    
    // We can also download via axios and save
    api({
      url: '/whatsapp/logs/export',
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const href = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', `proton_whatsapp_logs_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error('CSV Export failed:', err);
      alert('Failed to export CSV. Please authenticate and try again.');
    });
  };

  return {
    logs,
    stats,
    loading,
    statsLoading,
    resendingId,
    clearing,
    error,
    totalPages,
    totalItems,
    refresh: fetchLogs,
    refreshStats: fetchStats,
    resendMessage,
    clearOldLogs,
    exportLogsCsv,
  };
}

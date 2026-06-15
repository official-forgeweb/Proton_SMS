'use client';
import { useState, useEffect } from 'react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import { customConfirm, customAlert } from '@/utils/dialog';
import api from '@/lib/api';
import { 
  Terminal, ShieldAlert, Cpu, Heart, CheckCircle2, XCircle, 
  RefreshCw, Play, Trash2, ShieldX, PlayCircle
} from 'lucide-react';
import React from 'react';

export default function WhatsAppDebug() {
  const { status, refresh: refreshConfig } = useWhatsAppConfig();

  // Health and status state
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Phone validator state
  const [validatePhone, setValidatePhone] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);

  // Queue actions state
  const [queueLoading, setQueueLoading] = useState(false);

  // Webhook logs state
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [webhookFilter, setWebhookFilter] = useState('');

  // API Tester state
  const [apiEndpoint, setApiEndpoint] = useState('/whatsapp/debug/health');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [apiBody, setApiBody] = useState('{\n  \n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Danger actions state
  const [dangerLoading, setDangerLoading] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.get('/whatsapp/debug/health');
      setHealth(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    setWebhooksLoading(true);
    try {
      const url = webhookFilter 
        ? `/whatsapp/webhook/logs?event_type=${webhookFilter}`
        : '/whatsapp/webhook/logs';
      const res = await api.get(url);
      setWebhookLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchWebhookLogs();
  }, [webhookFilter]);

  const handleValidateNumber = async () => {
    if (!validatePhone.trim()) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await api.post('/whatsapp/debug/validate-number', { phone: validatePhone });
      setValidationResult(res.data.data);
    } catch (err: any) {
      customAlert(err.response?.data?.message || 'Validation failed.', 'Error');
    } finally {
      setValidating(false);
    }
  };

  const handleQueueAction = async (action: 'clear' | 'pause' | 'resume') => {
    setQueueLoading(true);
    try {
      const res = await api.post(`/whatsapp/debug/queue/${action}`);
      customAlert(res.data.message || 'Queue action completed successfully.', 'Queue Status');
      fetchHealth();
    } catch (err: any) {
      customAlert(err.response?.data?.message || 'Failed to update queue.', 'Error');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    try {
      await api.delete('/whatsapp/webhook/logs/clear');
      setWebhookLogs([]);
      customAlert('Webhook logs cleared successfully.', 'Clear Webhooks');
    } catch (err) {
      customAlert('Failed to clear webhook logs.', 'Error');
    }
  };

  const handleRunApiTest = async () => {
    setApiTesting(true);
    setApiResponse(null);
    try {
      let bodyData = null;
      if (apiMethod !== 'GET' && apiBody.trim()) {
        try {
          bodyData = JSON.parse(apiBody);
        } catch (e) {
          customAlert('Invalid request body JSON format.', 'API Tester JSON Error');
          setApiTesting(false);
          return;
        }
      }

      let res;
      if (apiMethod === 'GET') {
        res = await api.get(apiEndpoint);
      } else if (apiMethod === 'POST') {
        res = await api.post(apiEndpoint, bodyData);
      } else {
        res = await api.delete(apiEndpoint);
      }
      setApiResponse(res.data);
    } catch (err: any) {
      setApiResponse(err.response?.data || { error: err.message });
    } finally {
      setApiTesting(false);
    }
  };

  const handleResetCounter = async () => {
    const confirm = await customConfirm(
      'Are you sure you want to reset the daily counter of messages to 0? This resets the quota consumption for today.',
      'Reset Daily Counter'
    );
    if (confirm) {
      setDangerLoading(true);
      try {
        const res = await api.post('/whatsapp/debug/reset-counter');
        customAlert(res.data.message || 'Daily counter reset to 0.', 'Danger Zone');
        refreshConfig();
        fetchHealth();
      } catch (err) {
        customAlert('Failed to reset daily counter.', 'Error');
      } finally {
        setDangerLoading(false);
      }
    }
  };

  const handleDisconnect = async () => {
    const confirm = await customConfirm(
      'Are you sure you want to disconnect WhatsApp integration? This will delete all credentials from the database and set mock mode to true.',
      'Disconnect WhatsApp'
    );
    if (confirm) {
      setDangerLoading(true);
      try {
        const res = await api.post('/whatsapp/debug/disconnect');
        customAlert(res.data.message || 'WhatsApp integration disconnected.', 'Danger Zone');
        refreshConfig();
        fetchHealth();
      } catch (err) {
        customAlert('Failed to disconnect.', 'Error');
      } finally {
        setDangerLoading(false);
      }
    }
  };

  const handleResetRules = async () => {
    const confirm = await customConfirm(
      'Are you sure you want to reset all WhatsApp templates and automation rules? This deletes all custom configurations and seeds the default 10 templates and rules.',
      'Reset rules to default'
    );
    if (confirm) {
      setDangerLoading(true);
      try {
        const res = await api.post('/whatsapp/debug/reset-rules');
        customAlert(res.data.message || 'WhatsApp rules reset completed.', 'Danger Zone');
        fetchHealth();
      } catch (err) {
        customAlert('Failed to reset rules.', 'Error');
      } finally {
        setDangerLoading(false);
      }
    }
  };

  const isMock = status?.is_mock_mode || false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Debug & Tools
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Audit system health, test Webhook payloads, validate contacts, run APIs manually, and manage system resets.
          </p>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMock} />

      {/* Grid: Health & Queue Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* System Health Status */}
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-primary)', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} style={{ color: 'var(--primary)' }} />
              System Health Diagnosis
            </span>
            <button
              onClick={fetchHealth}
              disabled={healthLoading}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', height: '28px', minWidth: '28px' }}
            >
              <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {healthLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '32px', width: '100%', borderRadius: '8px' }} className="skeleton" />
              <div style={{ height: '32px', width: '90%', borderRadius: '8px' }} className="skeleton" />
              <div style={{ height: '32px', width: '80%', borderRadius: '8px' }} className="skeleton" />
            </div>
          ) : health ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
              <div style={{ background: '#FAFAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Database Status:</span>
                <span style={{ color: health.database === 'healthy' ? 'var(--success)' : 'var(--error)' }}>
                  {health.database === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                </span>
              </div>
              
              <div style={{ background: '#FAFAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Meta API Status:</span>
                <span style={{ color: health.metaApi === 'CONNECTED' ? 'var(--success)' : health.metaApi === 'MOCK' ? 'var(--warning)' : 'var(--error)' }}>
                  {health.metaApi === 'CONNECTED' ? '✓ Connected' : health.metaApi === 'MOCK' ? 'Mock Mode' : '✗ Offline'}
                </span>
              </div>

              <div style={{ background: '#FAFAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Webhook Status:</span>
                <span style={{ color: health.webhookVerified ? 'var(--success)' : 'var(--warning)' }}>
                  {health.webhookVerified ? '✓ Verified' : 'Pending'}
                </span>
              </div>

              <div style={{ background: '#FAFAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Access Token Valid:</span>
                <span style={{ color: health.tokenValid ? 'var(--success)' : 'var(--error)' }}>
                  {health.tokenValid ? '✓ Valid' : '✗ Missing'}
                </span>
              </div>

              <div style={{ background: '#FAFAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Webhook URL:</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                  {health.webhookUrl || 'Not configured'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--error)' }}>Failed to run diagnosis.</div>
          )}
        </div>

        {/* Queue Management Card */}
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-primary)', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
            Message Queue
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Queue Status:</span>
              <span style={{ color: health?.queue?.paused ? 'var(--warning)' : 'var(--success)' }}>
                {health?.queue?.paused ? '⏸ Paused' : '▶ Active / Running'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
              <span>Pending Queue Size:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{health?.queue?.size || 0} messages</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {health?.queue?.paused ? (
                <button
                  onClick={() => handleQueueAction('resume')}
                  disabled={queueLoading}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, height: '36px' }}
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={() => handleQueueAction('pause')}
                  disabled={queueLoading}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, height: '36px' }}
                >
                  Pause
                </button>
              )}

              <button
                onClick={() => handleQueueAction('clear')}
                disabled={queueLoading || !health?.queue?.size}
                className="btn btn-danger btn-sm"
                style={{ flex: 1, height: '36px' }}
              >
                Clear Queue
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Phone Validator & API Tester */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 3.5fr', gap: '24px' }}>
        
        {/* Phone Validator */}
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
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
            WhatsApp Contact Validator
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. +919999988888"
                value={validatePhone}
                onChange={(e) => setValidatePhone(e.target.value)}
                className="input-field"
                style={{ fontSize: '13px', height: '40px' }}
              />
              <button
                onClick={handleValidateNumber}
                disabled={validating || !validatePhone}
                className="btn btn-primary btn-sm"
                style={{ height: '40px' }}
              >
                {validating ? 'Checking...' : 'Check'}
              </button>
            </div>

            {validationResult && (
              <div style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
                <div style={{ fontWeight: 700 }}>
                  {validationResult.isValid ? (
                    <span style={{ color: 'var(--success)' }}>✓ Registered WhatsApp Contact</span>
                  ) : (
                    <span style={{ color: 'var(--error)' }}>✗ Not Registered on WhatsApp</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>
                  Formatted Phone: {validationResult.phone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Tester */}
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
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
            REST API Request Tester
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '8px' }}>
              {/* Method */}
              <select
                value={apiMethod}
                onChange={(e: any) => setApiMethod(e.target.value)}
                className="input-field"
                style={{ fontSize: '13px', height: '40px', padding: '8px 12px', cursor: 'pointer' }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="DELETE">DELETE</option>
              </select>

              {/* Endpoint */}
              <input
                type="text"
                placeholder="Endpoint path e.g. /whatsapp/config/status"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="input-field"
                style={{ fontSize: '13px', height: '40px', fontFamily: 'monospace', color: 'var(--primary)' }}
              />
            </div>

            {/* Request Body JSON */}
            {apiMethod !== 'GET' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Request Body (JSON)</label>
                <textarea
                  rows={4}
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: 'monospace', fontSize: '11px', padding: '12px', resize: 'vertical' }}
                />
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleRunApiTest}
              disabled={apiTesting}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px' }}
            >
              <Terminal size={14} />
              {apiTesting ? 'Executing Request...' : 'Execute Request'}
            </button>

            {/* Response Area */}
            {apiResponse && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>API Response Payload</span>
                <pre style={{ 
                  padding: '12px', 
                  background: '#FAFAFC', 
                  border: '1px solid var(--border-primary)', 
                  borderRadius: '12px', 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  color: '#0F172A', 
                  overflowX: 'auto',
                  maxHeight: '180px' 
                }}>
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Webhook logs */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={16} style={{ color: 'var(--primary)' }} />
            Webhook Event Logs
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={webhookFilter}
              onChange={(e) => setWebhookFilter(e.target.value)}
              className="input-field"
              style={{ width: '130px', height: '32px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
            >
              <option value="">All Events</option>
              <option value="messages">messages (incoming)</option>
              <option value="statuses">statuses (delivery status)</option>
            </select>
            
            <button
              onClick={handleClearWebhookLogs}
              disabled={webhookLogs.length === 0}
              style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              Clear Webhook Logs
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          {webhooksLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Fetching webhook payloads...</div>
          ) : webhookLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>No webhook payloads logged yet.</div>
          ) : (
            webhookLogs.map((log) => {
              const date = new Date(log.created_at);
              const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

              return (
                <div key={log.id} style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <span style={{ fontSize: '9px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {log.event_type || 'Generic Event'}
                      </span>
                      <span style={{ color: log.processed ? 'var(--success)' : 'var(--error)' }}>
                        {log.processed ? '✓ Processed' : '✗ Failed'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{timeStr}</span>
                  </div>
                  {log.error && (
                    <div style={{ fontSize: '11px', color: 'var(--error)', fontWeight: 600 }}>Error: {log.error}</div>
                  )}
                  <pre style={{ 
                    padding: '8px 12px', 
                    background: 'white', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontFamily: 'monospace', 
                    color: '#0F172A', 
                    overflowX: 'auto',
                    maxHeight: '100px'
                  }}>
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ 
        background: '#FFF5F5', 
        border: '1px solid #FEE2E2', 
        borderRadius: '16px', 
        padding: '24px', 
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #FEE2E2', paddingBottom: '12px' }}>
          <ShieldAlert size={16} />
          Danger Zone
        </span>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Irreversible configuration commands. Please exercise absolute caution before proceeding.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '8px' }}>
          {/* Reset counter */}
          <div style={{ background: 'white', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reset Quota Counter</h5>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Resets the daily message consumption counter back to 0. Does not modify daily limits.
              </p>
            </div>
            <button
              onClick={handleResetCounter}
              disabled={dangerLoading}
              className="btn btn-danger btn-sm"
              style={{ width: '100%', height: '36px' }}
            >
              Reset Counter
            </button>
          </div>

          {/* Reset rules */}
          <div style={{ background: 'white', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reset Automations & Seeds</h5>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Deletes all custom rules and templates, and seeds the default transactional configurations.
              </p>
            </div>
            <button
              onClick={handleResetRules}
              disabled={dangerLoading}
              className="btn btn-danger btn-sm"
              style={{ width: '100%', height: '36px' }}
            >
              Reset to Seeds
            </button>
          </div>

          {/* Disconnect WhatsApp */}
          <div style={{ background: 'white', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Disconnect Integration</h5>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Clears all access tokens, phone number IDs, verify keys, and switches integration to Mock mode.
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={dangerLoading}
              className="btn btn-danger btn-sm"
              style={{ width: '100%', height: '36px' }}
            >
              Disconnect Credentials
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

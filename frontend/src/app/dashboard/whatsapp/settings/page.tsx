'use client';
import { useState, useEffect } from 'react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import StatusBadge from '@/components/whatsapp/StatusBadge';
import { 
  Save, Key, Shield, Phone, FileText, Download, 
  Copy, Check, Eye, EyeOff, Wifi
} from 'lucide-react';
import { customAlert } from '@/utils/dialog';
import React from 'react';

export default function WhatsAppSettings() {
  const { 
    config, status, loading, saving, testing, saveConfig, testConnection
  } = useWhatsAppConfig();

  // Local state for credentials
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [phoneId, setPhoneId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [apiVersion, setApiVersion] = useState('v18.0');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://graph.facebook.com');
  const [isActive, setIsActive] = useState(false);
  const [isMockMode, setIsMockMode] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(250);
  const [copied, setCopied] = useState(false);

  // Load configuration details
  useEffect(() => {
    if (config) {
      setAccessToken(config.access_token || '');
      setPhoneId(config.phone_number_id || '');
      setBusinessId(config.business_account_id || '');
      setVerifyToken(config.verify_token || '');
      setApiVersion(config.api_version || 'v18.0');
      setApiBaseUrl(config.api_base_url || 'https://graph.facebook.com');
      setIsActive(config.is_active || false);
      setIsMockMode(config.is_mock_mode || false);
      setDailyLimit(config.daily_limit || 250);
    }
  }, [config]);

  // Construct auto Webhook URL
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host.replace(':3000', ':5001')}/api/whatsapp/webhook`
    : 'http://localhost:5001/api/whatsapp/webhook';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    const res = await testConnection();
    if (res.success) {
      customAlert(res.message || 'Connection successful!', 'Connection Test Status');
    } else {
      customAlert(res.error || 'Connection failed.', 'Connection Test Status');
    }
  };

  const handleSave = async () => {
    // Validations
    if (isActive && !isMockMode) {
      if (!accessToken.trim() || !phoneId.trim() || !businessId.trim()) {
        customAlert('To activate LIVE mode, access token, phone number ID, and business account ID are required.', 'Validation Error');
        return;
      }
    }

    const payload = {
      access_token: accessToken,
      phone_number_id: phoneId,
      business_account_id: businessId,
      verify_token: verifyToken,
      api_version: apiVersion,
      api_base_url: apiBaseUrl,
      is_active: isActive,
      is_mock_mode: isMockMode,
      daily_limit: Number(dailyLimit),
    };

    const res = await saveConfig(payload);
    if (res.success) {
      customAlert('WhatsApp configuration updated successfully!', 'Settings Saved');
    } else {
      customAlert(res.error || 'Failed to update configuration.', 'Error saving settings');
    }
  };

  const downloadSetupGuide = () => {
    const guideText = `=========================================
PROTON WhatsApp Business API Integration Guide
=========================================

To go LIVE, follow these configuration steps in Meta developer portal:

STEP 1: Create Meta Developer Account
-------------------------------------
1. Go to https://developers.facebook.com and register as a developer.
2. Create an App. Select "Other" -> Business app type. Name your App "Proton SMS".

STEP 2: Configure WhatsApp Product
-----------------------------------
1. Inside your App Dashboard, click "Set Up" under WhatsApp.
2. Connect your Meta Business Suite account.
3. In "Getting Started", copy the Temporary Access Token, Phone Number ID, and Business Account ID.
4. Add these credentials in your Proton Settings.

STEP 3: Configure Webhook Subscriptions
---------------------------------------
1. Navigate to WhatsApp -> Configuration inside your Meta app.
2. In the "Webhook" section, click "Edit".
3. Callback URL: Copy the Webhook URL from Proton settings page.
4. Verify Token: Copy or define a Verify Token, e.g. "proton_verify_token". Update this in Proton too.
5. In Webhook Fields, subscribe to "messages" (incoming chats) and "message_template_status_update" (sync status updates).

STEP 4: Set Up Permanent Token
-----------------------------
1. Under Business Settings (business.facebook.com), go to System Users.
2. Create a System User (Admin role).
3. Click "Generate New Token" for your app. Check permissions: whatsapp_business_messaging, whatsapp_business_management.
4. Copy this permanent token and replace the temporary token in Proton settings.

STEP 5: Register Phone Number
-----------------------------
1. In Meta developer dashboard under WhatsApp Getting Started, add a phone number.
2. Verify via SMS. This is the official sending number.

System status parameters:
- Webhook endpoint: ${webhookUrl}
- Webhook verify token: ${verifyToken || 'Not Set'}
=========================================`;

    const blob = new Blob([guideText], { type: 'text/plain;charset=utf-8' });
    const href = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', 'Proton_WhatsApp_Setup_Guide.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
        <div style={{ height: '40px', width: '200px', borderRadius: '12px' }} className="skeleton" />
        <div style={{ height: '140px', width: '100%', borderRadius: '16px' }} className="skeleton" />
        <div style={{ height: '300px', width: '100%', borderRadius: '16px' }} className="skeleton" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          WhatsApp Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure API credentials, toggle mock mode, check webhook links, and download integration guides.
        </p>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMockMode} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Form Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>
          
          {/* Credentials Card */}
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
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              borderBottom: '1px solid var(--border-primary)', 
              paddingBottom: '12px' 
            }}>
              <Key size={16} style={{ color: 'var(--primary)' }} />
              Meta API Credentials
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Access Token */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Access Token</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'none' }}>Use permanent token from Meta Developer Suite</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="Enter Meta Cloud API System User Access Token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="input-field"
                    style={{ paddingRight: '40px', fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-tertiary)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* IDs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 109876543210987"
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>WhatsApp Business Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 209876543210987"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Version & URL Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>API Version</label>
                  <input
                    type="text"
                    value={apiVersion}
                    onChange={(e) => setApiVersion(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>API Base URL</label>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Parameters Card */}
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
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              borderBottom: '1px solid var(--border-primary)', 
              paddingBottom: '12px' 
            }}>
              <Shield size={16} style={{ color: 'var(--primary)' }} />
              Integration Rules & Limits
            </span>

            {/* Rule switches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Integration toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid var(--border-primary)', background: '#FAFAFC', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Enable WhatsApp Module</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Turns WhatsApp message dispatch on or off globally. If disabled, all hooks bypass operations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '999px',
                    padding: '3px',
                    border: 'none',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--text-tertiary)'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'transform 0.2s',
                    transform: isActive ? 'translateX(22px)' : 'translateX(0)'
                  }} />
                </button>
              </div>

              {/* Force Mock toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid var(--border-primary)', background: '#FAFAFC', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Run In Mock Mode</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Always log sending attempts instead of calling Meta. Useful for testing pipelines without depleting quotas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMockMode(!isMockMode)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '999px',
                    padding: '3px',
                    border: 'none',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    backgroundColor: isMockMode ? 'var(--warning)' : 'var(--text-tertiary)'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'transform 0.2s',
                    transform: isMockMode ? 'translateX(22px)' : 'translateX(0)'
                  }} />
                </button>
              </div>

              {/* Daily Limit input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Daily Message Limit</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="input-field"
                  style={{ fontSize: '13px', fontWeight: 700 }}
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Webhook config and guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Webhook Card */}
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
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              borderBottom: '1px solid var(--border-primary)', 
              paddingBottom: '12px' 
            }}>
              <Phone size={16} style={{ color: 'var(--primary)' }} />
              Webhook Subscription
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Verify Token</span>
                <input
                  type="text"
                  placeholder="Define Webhook Verification Token"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Auto-Generated URL</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="input-field"
                    style={{ fontSize: '11px', fontFamily: 'monospace', padding: '10px 12px', background: '#FAFAFC', cursor: 'default' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '10px', minWidth: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Status indicators */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                borderTop: '1px solid var(--border-primary)', 
                paddingTop: '12px', 
                marginTop: '6px', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: 'var(--text-secondary)' 
              }}>
                <span>Webhook Verified:</span>
                <span style={{ color: status?.webhook_verified ? 'var(--success)' : 'var(--warning)' }}>
                  {status?.webhook_verified ? '✓ Verified' : '❌ Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
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
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 800, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              borderBottom: '1px solid var(--border-primary)', 
              paddingBottom: '12px' 
            }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              Setup Guide
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>
                Configure Meta Webhooks inside the Facebook Developers console to receive status updates (Delivered / Read checks).
              </p>
              
              <div style={{ background: '#FAFAFC', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Subscribe fields:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ background: 'white', border: '1px solid var(--border-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>messages</span>
                  <span style={{ background: 'white', border: '1px solid var(--border-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>message_deliveries</span>
                  <span style={{ background: 'white', border: '1px solid var(--border-primary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>template_status_update</span>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadSetupGuide}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '38px' }}
              >
                <Download size={14} />
                Download Setup Guide
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Save & Test bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderTop: '1px solid var(--border-primary)', 
        paddingTop: '24px', 
        marginTop: '12px' 
      }}>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !phoneId}
          className="btn btn-secondary"
          style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Wifi size={16} className={testing ? 'animate-pulse' : ''} />
          {testing ? 'Testing Connection...' : 'Test Connection Status'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

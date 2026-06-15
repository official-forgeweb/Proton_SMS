'use client';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { useLogs } from '@/hooks/useLogs';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import ConnectionStatus from '@/components/whatsapp/ConnectionStatus';
import StatsCard from '@/components/whatsapp/StatsCard';
import DailyLimitProgress from '@/components/whatsapp/DailyLimitProgress';
import StatusBadge from '@/components/whatsapp/StatusBadge';
import { 
  Send, Settings as SettingsIcon, MessageSquare, Clock, 
  CheckCircle, AlertCircle, PlaySquare, FileCheck, HelpCircle, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

export default function WhatsAppDashboard() {
  const { config, status, loading: configLoading, refresh: refreshConfig } = useWhatsAppConfig();
  const { logs, stats, loading: logsLoading, refresh: refreshLogs } = useLogs({}, 1, 10); // fetch last 10 logs
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const loading = configLoading || logsLoading;

  // Quick actions helper
  const actions = [
    { 
      label: 'Send Message', 
      href: '/dashboard/whatsapp/send', 
      icon: Send, 
      style: { background: 'var(--gradient-primary)', color: 'white', borderStyle: 'none' },
      hoverStyle: { opacity: 0.9, transform: 'translateY(-1px)' }
    },
    { 
      label: 'Message Logs', 
      href: '/dashboard/whatsapp/logs', 
      icon: Clock, 
      style: { background: 'var(--bg-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' },
      hoverStyle: { background: 'var(--bg-secondary)', color: 'var(--primary)', borderColor: 'var(--primary-100)' }
    },
    { 
      label: 'API Settings', 
      href: '/dashboard/whatsapp/settings', 
      icon: SettingsIcon, 
      style: { background: 'var(--bg-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' },
      hoverStyle: { background: 'var(--bg-secondary)', color: 'var(--primary)', borderColor: 'var(--primary-100)' }
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
        <div style={{ height: '40px', width: '200px', borderRadius: '12px' }} className="skeleton" />
        <div style={{ height: '48px', width: '100%', borderRadius: '12px' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ height: '120px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '120px', borderRadius: '16px' }} className="skeleton" />
          <div style={{ height: '120px', borderRadius: '16px' }} className="skeleton" />
        </div>
        <div style={{ height: '280px', borderRadius: '16px' }} className="skeleton" />
      </div>
    );
  }

  const isMock = status?.is_mock_mode || false;
  const isConnected = status?.status === 'CONNECTED';
  const connectionState = status?.status || 'DISCONNECTED';

  // Stats mapped from API response
  const sentToday = status?.is_mock_mode ? stats?.today?.mock || 0 : stats?.today?.sent || 0;
  const deliveredToday = stats?.today?.delivered || 0;
  const deliveredTodayPercent = stats?.today?.deliveredPercent || 0;
  const failedToday = stats?.today?.failed || 0;
  const failedTodayPercent = stats?.today?.failedPercent || 0;
  
  const readRate = stats?.total?.readRate || 0;
  const approvedTemplates = stats?.templatesApproved || 0;
  const activeAutomations = stats?.activeAutomations || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Breadcrumbs */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            WhatsApp Business API
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Automate and broadcast notifications, alerts, and transactional messages directly via Meta WhatsApp Cloud API.
          </p>
        </div>
        
        {/* Connection status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Status:</span>
          <StatusBadge status={connectionState} />
        </div>
      </div>

      {/* Mock Mode Alert Banner */}
      <MockModeBanner show={isMock} />

      {/* Grid: Health Card & Limit Progress Bar & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <ConnectionStatus 
          status={connectionState}
          isActive={status?.is_active || false}
          onRefresh={() => {
            refreshConfig();
            refreshLogs();
          }}
        />

        <DailyLimitProgress 
          counter={status?.daily_counter || 0}
          limit={status?.daily_limit || 250}
        />

        {/* Quick Actions Panel */}
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-primary)', 
          borderRadius: '16px', 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              color: 'var(--text-tertiary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'block', 
              marginBottom: '12px' 
            }}>Quick Actions</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {actions.map((act, i) => {
                const Icon = act.icon;
                const isHovered = hoveredIndex === i;
                return (
                  <Link 
                    key={i} 
                    href={act.href}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: isHovered && act.style.borderStyle === 'none' ? '0 4px 12px rgba(229, 57, 53, 0.25)' : 'none',
                      ...act.style,
                      ...(isHovered ? act.hoverStyle : {})
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={14} />
                      <span>{act.label}</span>
                    </div>
                    <ArrowRight size={14} />
                  </Link>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center', fontWeight: 600, marginTop: '16px' }}>
            Authorized Admin & Coordinator Panel
          </div>
        </div>
      </div>

      {/* Grid: 6 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
        <StatsCard 
          title="Sent Today" 
          value={sentToday} 
          icon={Send} 
          subtext={isMock ? 'Mocked broadcasts' : 'Live broadcasts'} 
          color={isMock ? 'orange' : 'green'} 
        />
        <StatsCard 
          title="Delivered Today" 
          value={deliveredToday} 
          icon={CheckCircle} 
          subtext={`${deliveredTodayPercent}% of sent today`} 
          color="blue" 
        />
        <StatsCard 
          title="Failed Today" 
          value={failedToday} 
          icon={AlertCircle} 
          subtext={`${failedTodayPercent}% rate today`} 
          color={failedToday > 0 ? 'red' : 'gray'} 
        />
        <StatsCard 
          title="Read Rate (All)" 
          value={`${readRate}%`} 
          icon={PlaySquare} 
          subtext="Lifetime read percentage" 
          color="green" 
        />
        <StatsCard 
          title="Templates" 
          value={approvedTemplates} 
          icon={FileCheck} 
          subtext="Meta approved templates" 
          color="blue" 
        />
        <StatsCard 
          title="Automations" 
          value={activeAutomations} 
          icon={HelpCircle} 
          subtext="Active trigger rules" 
          color="orange" 
        />
      </div>

      {/* Grid: Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Recent Message Logs */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Recent Message Log Feed
              </h3>
            </div>
            <Link 
              href="/dashboard/whatsapp/logs" 
              style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--primary)', 
                textTransform: 'uppercase', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
            >
              View All Logs
              <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>
                No recent messages logged yet. Try sending a test message.
              </div>
            ) : (
              logs.map((log) => {
                const date = new Date(log.created_at);
                const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isMockLog = log.status.toUpperCase() === 'MOCK' || (!log.meta_message_id?.startsWith('wamid.'));

                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px 0', borderBottom: '1px dashed var(--border-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-primary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '14px', 
                        fontWeight: 700, 
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                      }}>
                        {log.recipient_name?.slice(0, 1) || '#'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.recipient_name || 'Custom Contact'} ({log.phone})
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Template: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{log.template?.name || 'Free Text'}</strong> • {timeStr}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                        background: isMockLog ? 'var(--warning-light)' : 'var(--success-light)',
                        color: isMockLog ? '#92400E' : '#065F46'
                      }}>
                        {isMockLog ? 'MOCK' : 'LIVE'}
                      </span>
                      <StatusBadge status={log.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

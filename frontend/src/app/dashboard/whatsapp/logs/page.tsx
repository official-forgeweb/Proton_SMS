'use client';
import { useState } from 'react';
import { useLogs } from '@/hooks/useLogs';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import MockModeBanner from '@/components/whatsapp/MockModeBanner';
import StatsBar from '@/components/whatsapp/StatsBar';
import LogTable from '@/components/whatsapp/LogTable';
import LogDetailModal from '@/components/whatsapp/LogDetailModal';
import { customConfirm, customAlert } from '@/utils/dialog';
import { 
  Download, Trash2, Search, SlidersHorizontal 
} from 'lucide-react';
import React from 'react';

export default function WhatsAppLogs() {
  const { status } = useWhatsAppConfig();

  // Filter settings
  const [currentPage, setCurrentPage] = useState(1);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [automationFilter, setAutomationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Combined filters to pass to hook
  const activeFilters = {
    phone: phoneSearch,
    status: statusFilter,
    recipient_type: recipientFilter,
    direction: directionFilter,
    automation_type: automationFilter,
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
  };

  const {
    logs, stats, loading, statsLoading, resendingId, clearing, totalPages,
    resendMessage, clearOldLogs, exportLogsCsv
  } = useLogs(activeFilters, currentPage, 20); // 20 per page for better layout density

  // Details Modal State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const handleRowClick = (log: any) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleResend = async (log: any) => {
    const confirm = await customConfirm(
      `Do you want to attempt resending this failed message to ${log.recipient_name || log.phone}?`,
      'Confirm Resend'
    );
    if (confirm) {
      const res = await resendMessage(log.id);
      if (res.success) {
        customAlert('Message successfully resent and processed.', 'Success');
        if (detailOpen && selectedLog?.id === log.id) {
          setDetailOpen(false);
        }
      } else {
        customAlert(res.error || 'Resend attempt failed.', 'Transmission Failed');
      }
    }
  };

  const handleClearLogs = async () => {
    const confirm = await customConfirm(
      'Are you sure you want to permanently clear all logs older than 30 days? This action cannot be undone.',
      'Clear Old Logs'
    );
    if (confirm) {
      const res = await clearOldLogs(30);
      if (res.success) {
        customAlert(res.message || 'Old logs deleted successfully.', 'Clear Complete');
      } else {
        customAlert(res.error || 'Failed to clear old logs.', 'Error');
      }
    }
  };

  const handleFilterReset = () => {
    setPhoneSearch('');
    setStatusFilter('');
    setRecipientFilter('');
    setDirectionFilter('');
    setAutomationFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const isMock = status?.is_mock_mode || false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Transmission Logs
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Browse transaction records, audit message delivery events, trace errors, and resend failed broadcasts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleClearLogs}
            disabled={clearing}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <Trash2 size={13} />
            Clear logs &gt; 30 Days
          </button>
          
          <button
            onClick={exportLogsCsv}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px' }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <MockModeBanner show={isMock} />

      {/* Stats bar */}
      {!statsLoading && stats ? (
        <StatsBar stats={stats.total} />
      ) : (
        <div style={{ height: '80px', borderRadius: '16px' }} className="skeleton" />
      )}

      {/* Advanced Filters */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
          <SlidersHorizontal size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advanced Filters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          
          {/* Phone search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FAFAFC', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '6px 12px' }}>
            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search phone..."
              value={phoneSearch}
              onChange={(e) => { setPhoneSearch(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '12px', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent (Live)</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
            <option value="FAILED">Failed</option>
            <option value="MOCK">Mock Logged</option>
          </select>

          {/* Recipient Type */}
          <select
            value={recipientFilter}
            onChange={(e) => { setRecipientFilter(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="">All Recipients</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="COORDINATOR">Coordinator</option>
            <option value="PARENT">Parent</option>
            <option value="CUSTOM">Custom Number</option>
          </select>

          {/* Trigger Source */}
          <select
            value={automationFilter}
            onChange={(e) => { setAutomationFilter(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="">All Automations</option>
            <option value="WELCOME">Welcome Alerts</option>
            <option value="FEE_REMINDER">Fee Reminders</option>
            <option value="CLASS_REMINDER">Class Reminders</option>
            <option value="EXAM_ALERT">Exam / Test Alerts</option>
          </select>

          {/* Direction */}
          <select
            value={directionFilter}
            onChange={(e) => { setDirectionFilter(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="">All Directions</option>
            <option value="OUTGOING">Outgoing</option>
            <option value="INCOMING">Incoming</option>
          </select>

          {/* Date Range Start */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px' }}
            title="Start Date"
          />

          {/* Date Range End */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ padding: '8px 12px', fontSize: '12px' }}
            title="End Date"
          />

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={handleFilterReset}
            style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em' }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ height: '400px', borderRadius: '16px' }} className="skeleton" />
      ) : (
        <LogTable
          logs={logs}
          onViewDetails={handleRowClick}
          onResend={handleResend}
          isResending={resendingId}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onResend={handleResend}
        isResending={resendingId === selectedLog?.id}
      />

    </div>
  );
}

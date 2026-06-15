'use client';
import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let className = 'badge badge-neutral';
  let label = status;

  if (norm === 'CONNECTED' || norm === 'LIVE' || norm === 'APPROVED') {
    className = 'badge badge-success';
    label = norm === 'CONNECTED' ? 'Connected' : norm === 'LIVE' ? 'Live' : 'Approved';
  } else if (norm === 'MOCK' || norm === 'PENDING_REVIEW') {
    className = 'badge badge-warning';
    label = norm === 'MOCK' ? 'Mock Mode' : 'Pending Review';
  } else if (norm === 'DISCONNECTED' || norm === 'FAILED' || norm === 'REJECTED') {
    className = 'badge badge-error';
    label = norm === 'DISCONNECTED' ? 'Disconnected' : norm === 'FAILED' ? 'Failed' : 'Rejected';
  } else if (norm === 'PENDING' || norm === 'DRAFT') {
    className = 'badge badge-info';
    label = norm === 'PENDING' ? 'Pending' : 'Draft';
  } else if (norm === 'SENT') {
    className = 'badge badge-success';
    label = 'Sent';
  } else if (norm === 'DELIVERED') {
    className = 'badge badge-info';
    label = 'Delivered';
  } else if (norm === 'READ') {
    className = 'badge badge-success';
    label = 'Read';
  } else if (norm === 'PAUSED') {
    className = 'badge badge-neutral';
    label = 'Paused';
  }

  return (
    <span className={className}>
      {label}
    </span>
  );
}

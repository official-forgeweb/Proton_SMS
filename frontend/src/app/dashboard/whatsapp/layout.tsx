'use client';
import DashboardLayout from '@/components/DashboardLayout';
import React from 'react';

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout requiredRole={['admin', 'coordinator']}>
      {children}
    </DashboardLayout>
  );
}

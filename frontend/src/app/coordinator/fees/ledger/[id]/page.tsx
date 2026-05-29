'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LedgerPageClient from '@/app/admin/fees/ledger/LedgerPageClient';

export default function CoordinatorLedgerPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <DashboardLayout requiredRole="coordinator">
            <LedgerPageClient assignmentId={id} role="coordinator" />
        </DashboardLayout>
    );
}

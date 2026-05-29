'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LedgerPageClient from '../LedgerPageClient';

export default function AdminLedgerPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <DashboardLayout requiredRole="admin">
            <LedgerPageClient assignmentId={id} role="admin" />
        </DashboardLayout>
    );
}

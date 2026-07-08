'use client';
import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LedgerPageClient from '../LedgerPageClient';

export default function AdminLedgerPage() {
    const pathname = usePathname();
    const basePath = pathname.startsWith('/coordinator') ? '/coordinator' : '/admin';
    const requiredRole = pathname.startsWith('/coordinator') ? 'coordinator' : 'admin';
    const params = useParams();
    const id = params.id as string;

    return (
        <DashboardLayout requiredRole={requiredRole}>
            <LedgerPageClient assignmentId={id} role="admin" />
        </DashboardLayout>
    );
}

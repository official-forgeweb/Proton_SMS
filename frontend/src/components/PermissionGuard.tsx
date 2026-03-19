'use client';
import { useAuthStore } from '@/stores/authStore';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
    /** The permission key required to access this content (e.g. "enquiries", "fees") */
    permissionKey: string;
    children: React.ReactNode;
}

/**
 * Wrap a teacher page with this component to enforce access control.
 * - Admins always pass through.
 * - Teachers must have the permissionKey in their profile.permissions array.
 * - Other roles (student/parent) are not affected — they have their own guards.
 */
export default function PermissionGuard({ permissionKey, children }: PermissionGuardProps) {
    const { user } = useAuthStore();

    // Admins always have full access
    if (!user || user.role === 'admin') return <>{children}</>;

    // For teachers, check the permissions array stored in their profile
    if (user.role === 'teacher') {
        const permissions: string[] = user.profile?.permissions || [];
        if (permissions.includes(permissionKey)) {
            return <>{children}</>;
        }

        // Access denied screen
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: '16px',
                padding: '40px',
                textAlign: 'center',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <ShieldX size={36} color="#EF4444" strokeWidth={1.5} />
                </div>
                <div>
                    <h2 style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#1A1D3B',
                        marginBottom: '8px',
                    }}>
                        Access Restricted
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: '#8F92A1',
                        maxWidth: '380px',
                        lineHeight: 1.6,
                    }}>
                        You don&apos;t have permission to view this page. Please contact your administrator to request access.
                    </p>
                </div>
                <div style={{
                    marginTop: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#F4F5F9',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#5E6278',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                }}>
                    Module: {permissionKey}
                </div>
            </div>
        );
    }

    // All other roles — just render children
    return <>{children}</>;
}

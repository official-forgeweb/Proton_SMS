'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, MapPin, Building, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function StudentProfilePage() {
    const { user } = useAuthStore();

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Profile</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage your personal data and account settings.
                    </p>
                </div>
            </div>

            <div className="page-body">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--gradient-primary)', height: '120px' }}></div>

                        <div style={{ padding: '32px', position: 'relative' }}>
                            <div className="avatar avatar-xl" style={{ position: 'absolute', top: '-40px', background: 'var(--bg-primary)', border: '4px solid var(--bg-primary)', boxShadow: 'var(--shadow-md)', color: 'var(--primary)' }}>
                                {user?.email?.charAt(0).toUpperCase() || 'S'}
                            </div>

                            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Student Profile</h2>
                                    <span className="badge badge-info" style={{ marginTop: '8px' }}>Active Student</span>
                                </div>
                                <button className="btn btn-secondary">Edit Information</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                                        <Mail size={16} /> {user?.email || 'N/A'}
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Role</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                                        <Shield size={16} /> {user?.role?.toUpperCase() || 'STUDENT'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

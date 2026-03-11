'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Shield, Bell, Database, Globe, Building } from 'lucide-react';

export default function SettingsPage() {
    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>System Settings</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Configure institutional preferences, roles, and integrations.
                    </p>
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px', alignItems: 'start' }}>
                    {/* Sidebar Navigation for Settings */}
                    <div className="card" style={{ padding: '16px' }}>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { label: 'General Info', icon: Building, active: true },
                                { label: 'Security', icon: Shield, active: false },
                                { label: 'Notifications', icon: Bell, active: false },
                                { label: 'Data Backups', icon: Database, active: false },
                                { label: 'Website Settings', icon: Globe, active: false },
                            ].map((nav, i) => (
                                <button key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                    borderRadius: '8px', background: nav.active ? 'var(--bg-secondary)' : 'transparent',
                                    color: nav.active ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: nav.active ? 600 : 500, fontSize: '14px', border: 'none', cursor: 'pointer',
                                    textAlign: 'left', transition: 'all 0.2s'
                                }}>
                                    <nav.icon size={18} /> {nav.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-primary)' }}>
                            General Information
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="input-group">
                                <label>Institution Name</label>
                                <input className="input-field" defaultValue="Proton Coaching" />
                            </div>
                            <div className="input-group">
                                <label>Contact Email</label>
                                <input className="input-field" defaultValue="admin@protoncoaching.com" />
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input className="input-field" defaultValue="+91-9876543210" />
                            </div>
                            <div className="input-group">
                                <label>Currency</label>
                                <select className="input-field" defaultValue="INR">
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label>Address</label>
                                <textarea className="input-field" rows={3} defaultValue="123 Education Lane, Knowledge City, Bangalore" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="btn btn-primary">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

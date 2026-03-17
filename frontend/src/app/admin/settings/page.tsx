'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Shield, Bell, Database, Globe, Building, Save } from 'lucide-react';

export default function SettingsPage() {
    const [activeNav, setActiveNav] = useState('General Info');

    const navItems = [
        { label: 'General Info', icon: Building },
        { label: 'Security', icon: Shield },
        { label: 'Notifications', icon: Bell },
        { label: 'Data Backups', icon: Database },
        { label: 'Website Settings', icon: Globe },
    ];

    const inputStyle: React.CSSProperties = {
        padding: '11px 14px', border: '1px solid #F0F0F5', borderRadius: '10px',
        fontSize: '14px', background: '#F8F9FD', color: '#1A1D3B',
        outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
        transition: 'border-color 0.2s',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#5E6278',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                        System Settings
                    </h1>
                    <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                        Configure institutional preferences, roles, and integrations.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Settings Sidebar Nav */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '12px',
                        border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {navItems.map((nav) => {
                                const Icon = nav.icon;
                                const isActive = activeNav === nav.label;
                                return (
                                    <button
                                        key={nav.label}
                                        onClick={() => setActiveNav(nav.label)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '11px 14px', borderRadius: '10px',
                                            background: isActive ? 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)' : 'transparent',
                                            color: isActive ? 'white' : '#5E6278',
                                            fontWeight: isActive ? 700 : 500, fontSize: '14px',
                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                            transition: 'all 0.2s', width: '100%',
                                            boxShadow: isActive ? '0 4px 12px rgba(79,96,255,0.25)' : 'none',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) { (e.currentTarget as HTMLElement).style.background = '#F4F5F9'; (e.currentTarget as HTMLElement).style.color = '#4F60FF'; }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5E6278'; }
                                        }}
                                    >
                                        <Icon size={17} />
                                        {nav.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '18px', padding: '28px',
                        border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                        <h3 style={{
                            fontSize: '18px', fontWeight: 700, color: '#1A1D3B',
                            marginBottom: '20px', paddingBottom: '16px',
                            borderBottom: '1px solid #F0F0F5', fontFamily: 'Poppins, sans-serif',
                        }}>
                            {activeNav}
                        </h3>

                        {activeNav === 'General Info' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Institution Name</label>
                                    <input style={inputStyle} defaultValue="Proton Coaching" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contact Email</label>
                                    <input style={inputStyle} defaultValue="admin@protoncoaching.com" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input style={inputStyle} defaultValue="+91-9876543210" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Currency</label>
                                    <select style={inputStyle} defaultValue="INR">
                                        <option value="INR">Indian Rupee (₹)</option>
                                        <option value="USD">US Dollar ($)</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Address</label>
                                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} defaultValue="123 Education Lane, Knowledge City, Bangalore" />
                                </div>
                            </div>
                        )}

                        {activeNav !== 'General Info' && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#A1A5B7' }}>
                                <Settings size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p style={{ fontSize: '14px', fontWeight: 500 }}>This section is under development.</p>
                            </div>
                        )}

                        {activeNav === 'General Info' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
                                <button style={{
                                    padding: '11px 26px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)',
                                    color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700,
                                    fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    gap: '8px', boxShadow: '0 4px 12px rgba(79,96,255,0.3)',
                                }}>
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

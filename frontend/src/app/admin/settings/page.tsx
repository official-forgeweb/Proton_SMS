'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Shield, Bell, Database, Globe, Building, Save } from 'lucide-react';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';

export default function SettingsPage() {
    const [activeNav, setActiveNav] = useState('General Info');
    const [settings, setSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const navItems = [
        { label: 'General Info', icon: Building },
        { label: 'Security & Access', icon: Shield },
        { label: 'Notifications', icon: Bell },
        { label: 'Data Backups', icon: Database },
        { label: 'Website Settings', icon: Globe },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error(error);
            customAlert('Failed to fetch settings from the server.', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        try {
            setIsSaving(true);
            await api.patch('/settings', {
                institution_name: settings.institution_name,
                contact_email: settings.contact_email,
                phone_number: settings.phone_number,
                currency: settings.currency,
                address: settings.address,
                allow_student_registration: settings.allow_student_registration,
                require_email_verification: settings.require_email_verification,
                enable_2fa: settings.enable_2fa,
                email_notifications: settings.email_notifications,
                sms_notifications: settings.sms_notifications
            });
            customAlert('System settings have been successfully updated.', 'Settings Saved');
        } catch (error) {
            console.error(error);
            customAlert('Failed to update system settings.', 'Error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

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

    const ToggleSwitch = ({ checked, onChange, label, description }: { checked: boolean, onChange: (val: boolean) => void, label: string, description: string }) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', border: '1px solid #F1F4F9', borderRadius: '12px', marginBottom: '12px' }}>
            <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>{label}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>{description}</p>
            </div>
            <button 
                onClick={() => onChange(!checked)}
                style={{ 
                    position: 'relative', width: '48px', height: '26px', borderRadius: '26px', 
                    background: checked ? '#4F60FF' : '#E2E8F0', border: 'none', cursor: 'pointer', transition: 'background 0.3s' 
                }}
            >
                <div style={{
                    position: 'absolute', top: '3px', left: checked ? '25px' : '3px', width: '20px', height: '20px',
                    borderRadius: '50%', background: '#FFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }} />
            </button>
        </div>
    );

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                        System Settings
                    </h1>
                    <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                        Configure institutional preferences, roles, security policies and integrations.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Sidebar Nav */}
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
                                            background: isActive ? 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)' : 'transparent',
                                            color: isActive ? 'white' : '#5E6278',
                                            fontWeight: isActive ? 700 : 500, fontSize: '14px',
                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                            transition: 'all 0.2s', width: '100%',
                                            boxShadow: isActive ? '0 4px 12px rgba(26, 29, 59, 0.25)' : 'none',
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
                        minHeight: '400px'
                    }}>
                        <h3 style={{
                            fontSize: '18px', fontWeight: 700, color: '#1A1D3B',
                            marginBottom: '20px', paddingBottom: '16px',
                            borderBottom: '1px solid #F0F0F5', fontFamily: 'Poppins, sans-serif',
                        }}>
                            {activeNav}
                        </h3>

                        {isLoading ? (
                            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                <div className="skeleton" style={{ height: '50px', borderRadius: '10px' }} />
                                <div className="skeleton" style={{ height: '50px', borderRadius: '10px' }} />
                                <div className="skeleton" style={{ height: '100px', borderRadius: '10px' }} />
                            </div>
                        ) : !settings ? (
                            <div style={{ color: '#E53935' }}>Failed to load configuration.</div>
                        ) : (
                            <>
                                {activeNav === 'General Info' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={labelStyle}>Institution Name</label>
                                            <input 
                                                style={inputStyle} 
                                                value={settings.institution_name || ''} 
                                                onChange={e => handleChange('institution_name', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Contact Email</label>
                                            <input 
                                                style={inputStyle} 
                                                value={settings.contact_email || ''} 
                                                onChange={e => handleChange('contact_email', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Phone Number</label>
                                            <input 
                                                style={inputStyle} 
                                                value={settings.phone_number || ''} 
                                                onChange={e => handleChange('phone_number', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Currency</label>
                                            <select style={inputStyle} value={settings.currency || 'INR'} onChange={e => handleChange('currency', e.target.value)}>
                                                <option value="INR">Indian Rupee (₹)</option>
                                                <option value="USD">US Dollar ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={labelStyle}>Physical Address</label>
                                            <textarea 
                                                style={{ ...inputStyle, resize: 'vertical' }} 
                                                rows={3} 
                                                value={settings.address || ''}
                                                onChange={e => handleChange('address', e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeNav === 'Security & Access' && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <ToggleSwitch 
                                            label="Allow Open Student Registration" 
                                            description="If enabled, students can dynamically sign up from the main portal. If disabled, only admins can enroll students."
                                            checked={settings.allow_student_registration || false}
                                            onChange={val => handleChange('allow_student_registration', val)}
                                        />
                                        <ToggleSwitch 
                                            label="Require Email Verification" 
                                            description="Newly registered accounts must verify their email via OTP before full platform access."
                                            checked={settings.require_email_verification || false}
                                            onChange={val => handleChange('require_email_verification', val)}
                                        />
                                        <ToggleSwitch 
                                            label="Two-Factor Authentication (2FA)" 
                                            description="Enforce 2FA strictly for Admin and Managerial portal access globally."
                                            checked={settings.enable_2fa || false}
                                            onChange={val => handleChange('enable_2fa', val)}
                                        />
                                    </div>
                                )}

                                {activeNav === 'Notifications' && (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <ToggleSwitch 
                                            label="Platform Email Alerts" 
                                            description="Send automatic SMTP emails for fee reminders, attendance, and assignment alerts."
                                            checked={settings.email_notifications || false}
                                            onChange={val => handleChange('email_notifications', val)}
                                        />
                                        <ToggleSwitch 
                                            label="External SMS Gateway" 
                                            description="Dispatch critical OTPs and instant Parent SMS alerts natively via Twilio/Fast2SMS APIs."
                                            checked={settings.sms_notifications || false}
                                            onChange={val => handleChange('sms_notifications', val)}
                                        />
                                    </div>
                                )}

                                {(activeNav === 'Data Backups' || activeNav === 'Website Settings') && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#A1A5B7', background: '#F8F9FD', borderRadius: '16px' }}>
                                        <Settings size={48} style={{ marginBottom: '16px', opacity: 0.5, color: '#1A1D3B' }} />
                                        <h3 style={{ color: '#1A1D3B', fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Under Active Expansion</h3>
                                        <p style={{ fontSize: '14px', fontWeight: 500, margin: 0, maxWidth: '300px', display: 'inline-block' }}>
                                            The {activeNav} module will be available in the upcoming Version 2.4 core patch.
                                        </p>
                                    </div>
                                )}

                                {['General Info', 'Security & Access', 'Notifications'].includes(activeNav) && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', borderTop: '1px solid #F0F0F5', paddingTop: '20px' }}>
                                        <button 
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            style={{
                                                padding: '12px 28px', background: isSaving ? '#A1A5B7' : 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)',
                                                color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700,
                                                fontSize: '14px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                                                gap: '8px', boxShadow: isSaving ? 'none' : '0 4px 15px rgba(26, 29, 59, 0.3)',
                                            }}
                                        >
                                            {isSaving ? <><span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF' }}></span> Saving...</> : <><Save size={16} /> Save Configuration</>}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

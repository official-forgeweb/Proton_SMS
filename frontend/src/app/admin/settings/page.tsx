'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Shield, Bell, Database, Globe, Building, Save } from 'lucide-react';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';
import CustomSelect from '@/components/ui/CustomSelect';

export default function SettingsPage() {
    const [activeNav, setActiveNav] = useState('General Info');
    const [settings, setSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Data Backups States
    const [backups, setBackups] = useState<any[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [restoringFilename, setRestoringFilename] = useState('');

    const navItems = [
        { label: 'General Info', icon: Building },
        { label: 'Security & Access', icon: Shield },
        { label: 'Notifications', icon: Bell },
        { label: 'Google Sheets', icon: Database },
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

    useEffect(() => {
        if (activeNav === 'Data Backups') {
            fetchBackups();
        }
    }, [activeNav]);

    const fetchBackups = async () => {
        try {
            setIsLoadingBackups(true);
            const res = await api.get('/settings/backups');
            setBackups(res.data.data);
        } catch (error) {
            console.error(error);
            customAlert('Failed to load backup snapshots.', 'Error');
        } finally {
            setIsLoadingBackups(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setIsCreatingBackup(true);
            const res = await api.post('/settings/backups');
            customAlert(res.data.message || 'Backup snapshot created successfully.', 'Success');
            fetchBackups();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to create backup.';
            customAlert(msg, 'Error');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete backup snapshot ${filename}?`)) return;
        try {
            await api.delete(`/settings/backups/${filename}`);
            fetchBackups();
        } catch (error) {
            console.error(error);
            customAlert('Failed to delete backup file.', 'Error');
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        if (!confirm(`WARNING: Restoring database to snapshot ${filename} will overwrite ALL current database records.\n\nAre you sure you want to proceed?`)) return;
        try {
            setRestoringFilename(filename);
            const res = await api.post(`/settings/backups/${filename}/restore`);
            customAlert(res.data.message || 'Database restored successfully!', 'Success');
            fetchSettings();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Database restoration failed.';
            customAlert(msg, 'Restoration Failed');
        } finally {
            setRestoringFilename('');
        }
    };

    const handleDownloadBackup = async (filename: string) => {
        try {
            const res = await api.get(`/settings/backups/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            customAlert('Failed to download backup file.', 'Download Error');
        }
    };

    const handleWebsiteChange = (key: string, val: any) => {
        setSettings((prev: any) => {
            const webSettings = prev.website_settings || {};
            return {
                ...prev,
                website_settings: {
                    ...webSettings,
                    [key]: val
                }
            };
        });
    };

    const handleTestConnection = async () => {
        if (!settings?.google_spreadsheet_id) return;
        try {
            setIsTesting(true);
            const res = await api.post('/video-lectures/test-connection', {
                spreadsheetId: settings.google_spreadsheet_id
            });
            customAlert(res.data.message || 'Connection test successful!', 'Success');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to authenticate with Google Sheets API.';
            customAlert(msg, 'Connection Failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSyncNow = async () => {
        if (!settings?.google_spreadsheet_id) return;
        try {
            setIsSyncing(true);
            const res = await api.post('/video-lectures/sync');
            const summary = res.data.summary;
            const message = `Sync Completed!\n\n• Processed: ${summary.processed}\n• Created: ${summary.created}\n• Updated: ${summary.updated}\n• Deleted: ${summary.deleted}`;
            customAlert(message, 'Synchronization Report');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Google Sheets synchronization failed.';
            customAlert(msg, 'Sync Failed');
        } finally {
            setIsSyncing(false);
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
                sms_notifications: settings.sms_notifications,
                google_sheets_enabled: settings.google_sheets_enabled,
                google_spreadsheet_id: settings.google_spreadsheet_id,
                google_sheet_name: settings.google_sheet_name,
                google_sync_interval_minutes: parseInt(settings.google_sync_interval_minutes) || 5,
                website_settings: settings.website_settings
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
        setSettings((prev: any) => ({ ...prev, [field]: value }));
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
                                            <CustomSelect
                                                value={settings.currency || 'INR'}
                                                onChange={val => handleChange('currency', val)}
                                                options={[
                                                    { value: 'INR', label: 'Indian Rupee (₹)' },
                                                    { value: 'USD', label: 'US Dollar ($)' },
                                                    { value: 'EUR', label: 'Euro (€)' }
                                                ]}
                                            />
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

                                {activeNav === 'Google Sheets' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <ToggleSwitch 
                                            label="Enable Google Sheets Auto-Sync" 
                                            description="Automatically synchronizes lecture videos and materials directly from your shared Google Spreadsheet every few minutes."
                                            checked={settings.google_sheets_enabled || false}
                                            onChange={val => handleChange('google_sheets_enabled', val)}
                                        />
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '16px', background: '#F8F9FD', borderRadius: '14px', border: '1px solid #F0F0F5' }}>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Google Spreadsheet ID</label>
                                                <input 
                                                    style={inputStyle} 
                                                    placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                                                    value={settings.google_spreadsheet_id || ''} 
                                                    onChange={e => handleChange('google_spreadsheet_id', e.target.value)} 
                                                />
                                                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#8F92A1', fontWeight: 500 }}>
                                                    The unique ID in your Google Sheet's URL. Make sure to share the sheet with your service account email as a **Viewer**!
                                                </p>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Sheet Tab Name</label>
                                                <input 
                                                    style={inputStyle} 
                                                    placeholder="e.g. Videos"
                                                    value={settings.google_sheet_name || 'Videos'} 
                                                    onChange={e => handleChange('google_sheet_name', e.target.value)} 
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Sync Interval (Minutes)</label>
                                                <input 
                                                    type="number"
                                                    style={inputStyle} 
                                                    min={1}
                                                    value={settings.google_sync_interval_minutes || 5} 
                                                    onChange={e => handleChange('google_sync_interval_minutes', parseInt(e.target.value) || 5)} 
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                            <button 
                                                onClick={handleTestConnection}
                                                disabled={isTesting || !settings.google_spreadsheet_id}
                                                style={{
                                                    padding: '10px 20px', 
                                                    background: '#FFFFFF',
                                                    color: '#4F60FF',
                                                    border: '1px solid #4F60FF', 
                                                    borderRadius: '10px', 
                                                    fontWeight: 700,
                                                    fontSize: '13px', 
                                                    cursor: (isTesting || !settings.google_spreadsheet_id) ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: (isTesting || !settings.google_spreadsheet_id) ? 0.6 : 1
                                                }}
                                            >
                                                {isTesting ? 'Testing Connection...' : 'Test Connection'}
                                            </button>
                                            <button 
                                                onClick={handleSyncNow}
                                                disabled={isSyncing || !settings.google_spreadsheet_id}
                                                style={{
                                                    padding: '10px 20px', 
                                                    background: 'linear-gradient(135deg, #4F60FF 0%, #3144E5 100%)',
                                                    color: 'white',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    fontWeight: 700,
                                                    fontSize: '13px', 
                                                    cursor: (isSyncing || !settings.google_spreadsheet_id) ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: (isSyncing || !settings.google_spreadsheet_id) ? 0.6 : 1,
                                                    boxShadow: '0 4px 10px rgba(79, 96, 255, 0.15)'
                                                }}
                                            >
                                                {isSyncing ? 'Syncing...' : 'Sync Now'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeNav === 'Website Settings' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>Hero / Landing Page Branding</h4>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Hero Banner Title</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="e.g. Proton Coaching Portal"
                                                value={settings.website_settings?.hero_title || ''} 
                                                onChange={e => handleWebsiteChange('hero_title', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Hero Banner Subtitle</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="e.g. Empowering students to excel"
                                                value={settings.website_settings?.hero_subtitle || ''} 
                                                onChange={e => handleWebsiteChange('hero_subtitle', e.target.value)} 
                                            />
                                        </div>

                                        <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>SEO & Search Rankings</h4>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Meta/SEO Title</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="e.g. Proton Coaching Institute"
                                                value={settings.website_settings?.seo_title || ''} 
                                                onChange={e => handleWebsiteChange('seo_title', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Meta/SEO Description</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="e.g. Premium courses for IIT-JEE & NEET preparation"
                                                value={settings.website_settings?.seo_description || ''} 
                                                onChange={e => handleWebsiteChange('seo_description', e.target.value)} 
                                            />
                                        </div>

                                        <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>Social Links & Contacts</h4>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Facebook URL</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="https://facebook.com/..."
                                                value={settings.website_settings?.facebook || ''} 
                                                onChange={e => handleWebsiteChange('facebook', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Instagram URL</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="https://instagram.com/..."
                                                value={settings.website_settings?.instagram || ''} 
                                                onChange={e => handleWebsiteChange('instagram', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>LinkedIn URL</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="https://linkedin.com/in/..."
                                                value={settings.website_settings?.linkedin || ''} 
                                                onChange={e => handleWebsiteChange('linkedin', e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>WhatsApp Contact Link</label>
                                            <input 
                                                style={inputStyle} 
                                                placeholder="https://wa.me/..."
                                                value={settings.website_settings?.whatsapp || ''} 
                                                onChange={e => handleWebsiteChange('whatsapp', e.target.value)} 
                                            />
                                        </div>

                                        <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>Site Status & Mode</h4>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <ToggleSwitch 
                                                label="Maintenance Mode" 
                                                description="If enabled, all public portal routes are blocked with a maintenance screen."
                                                checked={settings.website_settings?.maintenance_mode || false}
                                                onChange={val => handleWebsiteChange('maintenance_mode', val)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeNav === 'Data Backups' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FD', padding: '16px', borderRadius: '12px', border: '1px solid #F1F4F9' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1A1D3B' }}>Database Backup & Restoration</h4>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>Create snapshots of your core database records. Restore any snapshot in a single click.</p>
                                            </div>
                                            <button 
                                                onClick={handleCreateBackup}
                                                disabled={isCreatingBackup}
                                                style={{
                                                    padding: '10px 20px', 
                                                    background: 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)',
                                                    color: 'white',
                                                    border: 'none', 
                                                    borderRadius: '10px', 
                                                    fontWeight: 700,
                                                    fontSize: '13px', 
                                                    cursor: isCreatingBackup ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: isCreatingBackup ? 0.6 : 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {isCreatingBackup ? 'Backing Up...' : 'Create Backup'}
                                            </button>
                                        </div>

                                        {isLoadingBackups ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
                                                <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
                                            </div>
                                        ) : backups.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: '#A1A5B7', background: '#F8F9FD', borderRadius: '12px' }}>
                                                No backups found. Click "Create Backup" to generate your first snapshot.
                                            </div>
                                        ) : (
                                            <div style={{ overflowX: 'auto', border: '1px solid #F1F4F9', borderRadius: '12px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                                    <thead>
                                                        <tr style={{ background: '#F8F9FD', borderBottom: '1px solid #E2E8F0', color: '#5E6278', fontWeight: 600 }}>
                                                            <th style={{ padding: '12px 16px' }}>Snapshot File</th>
                                                            <th style={{ padding: '12px 16px' }}>Size</th>
                                                            <th style={{ padding: '12px 16px' }}>Created Date</th>
                                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {backups.map((b: any) => (
                                                            <tr key={b.filename} style={{ borderBottom: '1px solid #F1F4F9', color: '#1A1D3B' }}>
                                                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.filename}</td>
                                                                <td style={{ padding: '12px 16px' }}>{(b.size / 1024).toFixed(2)} KB</td>
                                                                <td style={{ padding: '12px 16px' }}>{new Date(b.created_at).toLocaleString()}</td>
                                                                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                    <button 
                                                                        onClick={() => handleDownloadBackup(b.filename)}
                                                                        style={{ padding: '6px 12px', background: 'white', color: '#4F60FF', border: '1px solid #E2E8F0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                                    >
                                                                        Download
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleRestoreBackup(b.filename)}
                                                                        disabled={restoringFilename !== ''}
                                                                        style={{ padding: '6px 12px', background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: restoringFilename !== '' ? 'not-allowed' : 'pointer' }}
                                                                    >
                                                                        {restoringFilename === b.filename ? 'Restoring...' : 'Restore'}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteBackup(b.filename)}
                                                                        style={{ padding: '6px 12px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {['General Info', 'Security & Access', 'Notifications', 'Google Sheets', 'Website Settings'].includes(activeNav) && (
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

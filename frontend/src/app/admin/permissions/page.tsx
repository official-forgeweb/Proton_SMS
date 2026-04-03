'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Shield, Check, Search, Save, Settings, User } from 'lucide-react';

export default function AdminPermissionsPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [permRes, teacherRes] = await Promise.all([
                api.get('/permissions/available'),
                api.get('/permissions/teachers')
            ]);
            setAvailablePermissions(permRes.data.data);
            setTeachers(teacherRes.data.data);
        } catch (error) {
            console.error('Error fetching permissions info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePermission = (teacherId: string, permissionCode: string) => {
        setTeachers(prev => prev.map(t => {
            if (t.id === teacherId) {
                const currentPerms = new Set(t.permissions || []);
                if (currentPerms.has(permissionCode)) {
                    currentPerms.delete(permissionCode);
                } else {
                    currentPerms.add(permissionCode);
                }
                return { ...t, permissions: Array.from(currentPerms), _isModified: true };
            }
            return t;
        }));
    };

    const handleSelectAll = (teacherId: string, selectAll: boolean) => {
        setTeachers(prev => prev.map(t => {
            if (t.id === teacherId) {
                return { 
                    ...t, 
                    permissions: selectAll ? [...availablePermissions] : [], 
                    _isModified: true 
                };
            }
            return t;
        }));
    };

    const handleSavePermissions = async (teacher: any) => {
        setSavingId(teacher.id);
        try {
            await api.put(`/permissions/teachers/${teacher.id}`, {
                permissions: teacher.permissions || []
            });
            // Mark as saved
            setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, _isModified: false } : t));
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Failed to save permissions. Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    const filteredTeachers = teachers.filter(t => 
        t.first_name?.toLowerCase().includes(search.toLowerCase()) || 
        t.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.employee_id?.toLowerCase().includes(search.toLowerCase())
    );

    // Helper to format permission keys nicely (e.g. "demo_classes" -> "Demo Classes")
    const formatPermissionName = (key: string) => {
        return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield className="text-primary" size={28} />
                        Access Control
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                        Manage module access and permissions for teachers and staff members.
                    </p>
                </div>
            </div>

            <div className="page-body">
                <div className="card" style={{ padding: '24px' }}>
                    
                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="input-field"
                            placeholder="Search staff by name or ID..."
                            style={{ paddingLeft: '38px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  teachers.length === 0 ? (
                        <div className="empty-state">
                            <Settings size={48} />
                            <h3>No Staff Found</h3>
                            <p>There are no active teachers or staff members to manage.</p>
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Results</h3>
                            <p>No staff matches your search query.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {filteredTeachers.map(teacher => (
                                <div key={teacher.id} style={{ 
                                    border: '1px solid var(--border-primary)', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden',
                                    background: 'var(--bg-primary)'
                                }}>
                                    {/* Teacher Header */}
                                    <div style={{ 
                                        padding: '16px 20px', 
                                        background: 'var(--bg-secondary)', 
                                        borderBottom: '1px solid var(--border-primary)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '16px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {teacher.first_name?.[0]}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                                                    {teacher.first_name} {teacher.last_name}
                                                </h3>
                                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '2px 0 0', display: 'flex', gap: '8px' }}>
                                                    <span style={{ fontFamily: 'monospace' }}>{teacher.employee_id}</span>
                                                    <span>•</span>
                                                    <span>{teacher.role_type?.replace('_', ' ') || 'Teacher'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                                                <button 
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleSelectAll(teacher.id, true)}
                                                >
                                                    Select All
                                                </button>
                                                <button 
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleSelectAll(teacher.id, false)}
                                                >
                                                    Clear All
                                                </button>
                                            </div>

                                            <button 
                                                className="btn btn-primary"
                                                disabled={!teacher._isModified || savingId === teacher.id}
                                                onClick={() => handleSavePermissions(teacher)}
                                                style={{ 
                                                    opacity: (!teacher._isModified && savingId !== teacher.id) ? 0.5 : 1,
                                                    minWidth: '100px',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {savingId === teacher.id ? 'Saving...' : <><Save size={16} /> Save</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permissions Grid */}
                                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                        {availablePermissions.map(perm => {
                                            const hasPerm = (teacher.permissions || []).includes(perm);
                                            return (
                                                <label 
                                                    key={perm} 
                                                    onClick={() => handleTogglePermission(teacher.id, perm)}
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '10px',
                                                        padding: '12px 16px',
                                                        border: `1px solid ${hasPerm ? 'var(--primary)' : 'var(--border-primary)'}`,
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        background: hasPerm ? 'var(--primary-50)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                        userSelect: 'none'
                                                    }}
                                                >
                                                    <div style={{ 
                                                        width: '20px', 
                                                        height: '20px', 
                                                        borderRadius: '6px', 
                                                        border: `2px solid ${hasPerm ? 'var(--primary)' : 'var(--text-tertiary)'}`,
                                                        background: hasPerm ? 'var(--primary)' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {hasPerm && <Check size={14} color="white" strokeWidth={3} />}
                                                    </div>
                                                    <span style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: hasPerm ? 600 : 500,
                                                        color: hasPerm ? 'var(--primary-dark)' : 'var(--text-secondary)'
                                                    }}>
                                                        {formatPermissionName(perm)}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

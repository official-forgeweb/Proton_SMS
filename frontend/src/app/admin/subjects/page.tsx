'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
  BookOpen, Plus, Edit3, Trash2, Search, Shuffle, Activity,
  Check, X, AlertCircle, ChevronDown, RefreshCw, Key, Info, HelpCircle
} from 'lucide-react';
import { customAlert, customConfirm } from '@/utils/dialog';

interface Alias {
  id: string;
  alias: string;
}

interface EnrichedSubject {
  id: string;
  canonical_name: string;
  short_name: string | null;
  code: string | null;
  description: string | null;
  is_active: boolean;
  aliases: Alias[];
  timetable_usage: number;
  test_usage: number;
  material_usage: number;
  homework_usage: number;
  total_usage: number;
}

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<EnrichedSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Form values
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Merge tool state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/subjects');
      if (res.data && res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      customAlert('Failed to load subjects database.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setShortName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setAliasInput('');
    setAliases([]);
    setShowDialog(true);
  };

  const handleOpenEdit = (subj: EnrichedSubject) => {
    setIsEditing(true);
    setCurrentId(subj.id);
    setName(subj.canonical_name);
    setShortName(subj.short_name || '');
    setCode(subj.code || '');
    setDescription(subj.description || '');
    setIsActive(subj.is_active);
    setAliasInput('');
    setAliases(subj.aliases.map(a => a.alias));
    setShowDialog(true);
  };

  // Add an alias to list
  const handleAddAlias = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const clean = aliasInput.trim();
    if (clean && !aliases.includes(clean)) {
      setAliases([...aliases, clean]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        name,
        canonical_name: name,
        short_name: shortName.trim() || null,
        code: code.trim() || null,
        description: description.trim() || null,
        is_active: isActive,
        aliases
      };

      if (isEditing && currentId) {
        const res = await api.put(`/subjects/${currentId}`, payload);
        if (res.data && res.data.success) {
          customAlert('Subject updated successfully and cascading references synchronized.', 'Success');
          setShowDialog(false);
          fetchSubjects();
        }
      } else {
        const res = await api.post('/subjects', payload);
        if (res.data && res.data.success) {
          customAlert('Subject master record created successfully.', 'Success');
          setShowDialog(false);
          fetchSubjects();
        }
      }
    } catch (err: any) {
      console.error('Error saving subject:', err);
      const msg = err.response?.data?.message || 'Failed to save subject.';
      customAlert(msg, 'Error Saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Active status toggling directly from dashboard
  const handleToggleActive = async (subj: EnrichedSubject) => {
    try {
      const updatedStatus = !subj.is_active;
      const res = await api.put(`/subjects/${subj.id}`, {
        is_active: updatedStatus
      });
      if (res.data && res.data.success) {
        setSubjects(prev =>
          prev.map(s => (s.id === subj.id ? { ...s, is_active: updatedStatus } : s))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      customAlert('Failed to update subject status.', 'Error');
    }
  };

  // Safe Deletion
  const handleDelete = async (subj: EnrichedSubject) => {
    if (subj.total_usage > 0) {
      customAlert(
        `Cannot delete subject "${subj.canonical_name}" because it is currently in use across ${subj.total_usage} database records. Please use the Merge Subjects tool instead to remap references first.`,
        'Constraint Warning'
      );
      return;
    }

    const confirmed = await customConfirm(
      `Are you sure you want to permanently delete the canonical subject "${subj.canonical_name}"? This action cannot be undone.`,
      'Confirm Deletion'
    );

    if (confirmed) {
      try {
        const res = await api.delete(`/subjects/${subj.id}`);
        if (res.data && res.data.success) {
          customAlert('Subject master record deleted successfully.', 'Deleted');
          fetchSubjects();
        }
      } catch (err: any) {
        console.error('Error deleting subject:', err);
        const msg = err.response?.data?.message || 'Failed to delete subject.';
        customAlert(msg, 'Deletion Disrupted');
      }
    }
  };

  // Merge executing
  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;

    if (sourceId === targetId) {
      customAlert('Source subject and Target subject must be different.', 'Invalid Mapping');
      return;
    }

    const source = subjects.find(s => s.id === sourceId);
    const target = subjects.find(s => s.id === targetId);
    if (!source || !target) return;

    const confirmed = await customConfirm(
      `⚠️ WARNING: You are merging "${source.canonical_name}" into "${target.canonical_name}".\n\nThis will permanently:\n1. Re-map ALL existing timetables, homework, class configurations, tests, and study materials from "${source.canonical_name}" to "${target.canonical_name}".\n2. Add "${source.canonical_name}" and its aliases as aliases under "${target.canonical_name}".\n3. Permanently delete "${source.canonical_name}".\n\nAre you absolutely sure you want to proceed with this cascading database clean-up?`,
      'Confirm Data Merge'
    );

    if (!confirmed) return;

    setIsMerging(true);
    try {
      const res = await api.post('/subjects/merge', {
        sourceSubjectId: sourceId,
        targetSubjectId: targetId
      });
      if (res.data && res.data.success) {
        customAlert(res.data.message || 'Merge complete.', 'Database Remapped');
        setShowMergeDialog(false);
        setSourceId('');
        setTargetId('');
        fetchSubjects();
      }
    } catch (err: any) {
      console.error('Error merging subjects:', err);
      const msg = err.response?.data?.message || 'Failed to execute database merge.';
      customAlert(msg, 'Merge Disruption');
    } finally {
      setIsMerging(false);
    }
  };

  // Searching & Filtering
  const filteredSubjects = subjects.filter(subj => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      subj.canonical_name.toLowerCase().includes(q) ||
      (subj.short_name?.toLowerCase().includes(q) ?? false) ||
      (subj.code?.toLowerCase().includes(q) ?? false) ||
      subj.aliases.some(a => a.alias.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout requiredRole="admin">
      {/* Keyframe Injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subjectFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .subject-row-hover {
          transition: all 0.2s ease;
        }
        .subject-row-hover:hover {
          background: #FAFBFF;
        }
        .sh-alias-chip {
          transition: all 0.15s ease;
        }
        .sh-alias-chip:hover {
          background: #FEE2E2 !important;
          color: #EF4444 !important;
        }
      `}} />

      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={28} color="#E53935" /> Subject Management & Normalization
          </h1>
          <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
            Centralize subject names, configure search aliases, and merge duplicate entries to keep ERP data pristine.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              if (subjects.length < 2) {
                customAlert('At least two subjects are required to use the merge utility.', 'Information');
                return;
              }
              setShowMergeDialog(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#FFF5F5', border: '1.5px solid #FEE2E2', color: '#E53935',
              padding: '12px 20px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; }}
          >
            <Shuffle size={18} /> Merge Duplicates
          </button>
          
          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)',
              color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: '14px', fontWeight: 700, fontSize: '14px',
              boxShadow: '0 4px 15px rgba(26, 29, 59, 0.2)',
              cursor: 'pointer', transition: 'all 0.25s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 29, 59, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(26, 29, 59, 0.2)';
            }}
          >
            <Plus size={18} style={{ strokeWidth: 3 }} /> Add Subject
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total Subjects', val: subjects.length, desc: 'Master records', bg: '#F8FAFC', border: '#E2E8F0', text: '#1E293B', iconColor: '#64748B' },
          { label: 'Active Mappings', val: subjects.filter(s => s.is_active).length, desc: 'Available for selection', bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', iconColor: '#22C55E' },
          { label: 'Total Aliases', val: subjects.reduce((acc, s) => acc + s.aliases.length, 0), desc: 'Alternative search triggers', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', iconColor: '#3B82F6' },
          { label: 'ERP Active Usages', val: subjects.reduce((acc, s) => acc + s.total_usage, 0), desc: 'Cross-module reference links', bg: '#FFF5F5', border: '#FEE2E2', text: '#E53935', iconColor: '#E53935' }
        ].map((item, idx) => (
          <div key={idx} style={{
            background: item.bg, border: `1px solid ${item.border}`, borderRadius: '20px',
            padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '4px',
            animation: `subjectFadeIn 0.3s ease ${idx * 0.05}s forwards`, opacity: 0
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: item.text }}>{item.val}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel Content */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden'
      }}>
        {/* Search and Action Bar */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px',
            background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px',
            padding: '0 16px'
          }}>
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search by subject name, short code, or lookup alias..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 0', border: 'none', background: 'transparent',
                outline: 'none', fontSize: '14.5px', fontWeight: 600, color: '#1E293B'
              }}
            />
          </div>
          <button
            onClick={fetchSubjects}
            title="Refresh database"
            style={{
              padding: '12px', borderRadius: '14px', background: '#F8FAFC',
              border: '1.5px solid #E2E8F0', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
          >
            <RefreshCw size={18} color="#64748B" />
          </button>
        </div>

        {/* Subjects Table */}
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <RefreshCw size={32} className="animate-spin" color="#E53935" />
            <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#64748B' }}>Querying canonical master directories...</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div style={{ padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFF5F5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#E53935' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>No Subjects Found</h3>
            <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
              {searchQuery ? 'Your search filters did not match any master canonical names or aliases.' : 'Click "Add Subject" to seed your very first canonical curriculum subject.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Canonical Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Short Code</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Normalizing Aliases</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ERP Usages</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map(subj => (
                  <tr key={subj.id} className="subject-row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    
                    {/* Canonical Name & Description */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1A1D3B' }}>{subj.canonical_name}</span>
                        {subj.description && (
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '3px' }}>{subj.description}</span>
                        )}
                      </div>
                    </td>

                    {/* Short Name / Code */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {subj.code ? (
                          <span style={{ padding: '4px 8px', background: '#EEF2F6', borderRadius: '6px', fontSize: '11px', fontWeight: 800, color: '#475569' }}>
                            {subj.code}
                          </span>
                        ) : null}
                        {subj.short_name ? (
                          <span style={{ padding: '4px 8px', background: '#F1F5F9', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                            {subj.short_name}
                          </span>
                        ) : (
                          subj.code ? null : <span style={{ color: '#CBD5E1', fontSize: '13px' }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Normalizing Aliases */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle', maxWidth: '320px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {subj.aliases.map(a => (
                          <span key={a.id} style={{
                            padding: '3px 8px', background: '#F8FAFC', border: '1px solid #E2E8F0',
                            borderRadius: '8px', fontSize: '11.5px', fontWeight: 600, color: '#475569'
                          }}>
                            {a.alias}
                          </span>
                        ))}
                        {subj.aliases.length === 0 && (
                          <span style={{ color: '#CBD5E1', fontSize: '12.5px', fontWeight: 500 }}>No aliases mapped</span>
                        )}
                      </div>
                    </td>

                    {/* Usages Summary */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {subj.total_usage > 0 ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }} title={`Timetables: ${subj.timetable_usage} | Tests: ${subj.test_usage} | Homework: ${subj.homework_usage} | Materials: ${subj.material_usage}`}>
                          <span style={{ padding: '4px 10px', background: '#FFF5F5', border: '1px solid #FEE2E2', borderRadius: '20px', fontSize: '12.5px', fontWeight: 800, color: '#E53935' }}>
                            {subj.total_usage} links
                          </span>
                        </div>
                      ) : (
                        <span style={{ padding: '4px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
                          0 links
                        </span>
                      )}
                    </td>

                    {/* Status Active/Inactive Toggle */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(subj)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', borderRadius: '12px', transition: 'all 0.15s'
                        }}
                      >
                        <div style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: subj.is_active ? '#22C55E' : '#94A3B8'
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: subj.is_active ? '#166534' : '#475569' }}>
                          {subj.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '20px 24px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEdit(subj)}
                          title="Edit details"
                          style={{
                            display: 'flex', padding: '10px', borderRadius: '10px',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            cursor: 'pointer', color: '#475569', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EEF2F6'; e.currentTarget.style.color = '#1E293B'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(subj)}
                          disabled={subj.total_usage > 0}
                          title={subj.total_usage > 0 ? "Cannot delete active subject" : "Delete subject"}
                          style={{
                            display: 'flex', padding: '10px', borderRadius: '10px',
                            background: subj.total_usage > 0 ? '#F8FAFC' : '#FFF5F5',
                            border: `1px solid ${subj.total_usage > 0 ? '#E2E8F0' : '#FEE2E2'}`,
                            cursor: subj.total_usage > 0 ? 'not-allowed' : 'pointer',
                            color: subj.total_usage > 0 ? '#CBD5E1' : '#E53935',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => {
                            if (subj.total_usage === 0) {
                              e.currentTarget.style.background = '#FEE2E2';
                            }
                          }}
                          onMouseLeave={e => {
                            if (subj.total_usage === 0) {
                              e.currentTarget.style.background = '#FFF5F5';
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & EDIT DIALOG MODAL */}
      {showDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', animation: 'subjectFadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '24px', width: '100%',
            maxWidth: '560px', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.04)'
          }}>
            {/* Header */}
            <div style={{
              padding: '28px 32px 0', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                {isEditing ? 'Edit Canonical Subject' : 'Add Canonical Subject'}
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A5B7' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} style={{ padding: '24px 32px 32px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* Canonical Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Canonical Subject Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Mathematics, Theoretical Physics"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                  />
                </div>

                {/* Short Code & Subject Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Short Name abbreviation</label>
                    <input
                      type="text"
                      placeholder="e.g. Math, PHY"
                      value={shortName}
                      onChange={e => setShortName(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Official Code</label>
                    <input
                      type="text"
                      placeholder="e.g. MATH-101"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Description</label>
                  <textarea
                    placeholder="Provide details or comments about this curriculum area..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, resize: 'vertical' }}
                  />
                </div>

                {/* Normalization Lookup Aliases */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Normalization Lookup Aliases (Optional)</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Type variation (e.g. maths, MATH, math) & tap enter"
                      value={aliasInput}
                      onChange={e => setAliasInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(e); } }}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '13.5px', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAlias}
                      style={{
                        padding: '0 16px', background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                        borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '13px'
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {/* Alias Chip Area */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px',
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px',
                    minHeight: '52px'
                  }}>
                    {aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        onClick={() => handleRemoveAlias(idx)}
                        className="sh-alias-chip"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', background: '#FFFFFF', border: '1px solid #E2E8F0',
                          borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {alias} <X size={12} />
                      </span>
                    ))}
                    {aliases.length === 0 && (
                      <span style={{ color: '#94A3B8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={12} /> Variations typed during records creation will resolve to canonical name.
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="is_active_checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#E53935' }}
                  />
                  <label htmlFor="is_active_checkbox" style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1D3B', cursor: 'pointer' }}>
                    Active and available for new sessions/schedules
                  </label>
                </div>

              </div>

              {/* Actions */}
              <div style={{
                marginTop: '32px', display: 'flex', gap: '12px',
                justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9',
                paddingTop: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', color: '#64748B', fontSize: '13.5px',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '12px 28px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1A1D3B 0%, #31355B 100%)',
                    color: '#FFFFFF', border: 'none', fontSize: '13.5px', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(26,29,59,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE SUBJECTS WIZARD MODAL */}
      {showMergeDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', animation: 'subjectFadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '24px', width: '100%',
            maxWidth: '520px', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.04)'
          }}>
            {/* Header */}
            <div style={{
              padding: '28px 32px 0', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shuffle size={20} color="#E53935" /> Merge Duplicate Subjects
              </h2>
              <button
                onClick={() => setShowMergeDialog(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A1A5B7' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Merge Form */}
            <form onSubmit={handleMergeSubmit} style={{ padding: '24px 32px 32px' }}>
              <p style={{ color: '#64748B', fontSize: '13.5px', lineHeight: 1.5, marginTop: 0, marginBottom: '24px', fontWeight: 500 }}>
                Safely merge duplicate names (e.g. Maths, math, MATH) into one canonical subject. All historical classes, schedules, and materials strings will instantly re-align.
              </p>

              <div style={{ display: 'grid', gap: '20px' }}>
                
                {/* Source Subject Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Source Subject (Duplicate to remove) *</label>
                  <select
                    required
                    value={sourceId}
                    onChange={e => setSourceId(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, background: '#FFF' }}
                  >
                    <option value="">Select source subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.canonical_name} ({s.total_usage} links)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Subject Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', marginBottom: '8px' }}>Target Subject (Canonical record to keep) *</label>
                  <select
                    required
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600, background: '#FFF' }}
                  >
                    <option value="">Select target subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} disabled={s.id === sourceId}>
                        {s.canonical_name} ({s.total_usage} links)
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Actions */}
              <div style={{
                marginTop: '32px', display: 'flex', gap: '12px',
                justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9',
                paddingTop: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowMergeDialog(false)}
                  style={{
                    padding: '12px 24px', borderRadius: '12px', background: '#F8FAFC',
                    border: '1px solid #E2E8F0', color: '#64748B', fontSize: '13.5px',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMerging || !sourceId || !targetId}
                  style={{
                    padding: '12px 28px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                    color: '#FFFFFF', border: 'none', fontSize: '13.5px', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(229,57,53,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isMerging ? 'Executing Merge...' : 'Execute Merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

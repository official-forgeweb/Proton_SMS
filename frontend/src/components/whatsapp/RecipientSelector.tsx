'use client';
import React, { useState, useEffect } from 'react';
import { Search, User, Users, GraduationCap, Phone, Info } from 'lucide-react';
import api from '@/lib/api';

export type RecipientType = 'CUSTOM' | 'STUDENT' | 'TEACHER' | 'BATCH';

export interface RecipientSelection {
  type: RecipientType;
  customPhone: string;
  selectedIds: string[];
  recipientNames: string[];
}

interface RecipientSelectorProps {
  value: RecipientSelection;
  onChange: (val: RecipientSelection) => void;
}

export default function RecipientSelector({ value, onChange }: RecipientSelectorProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTargets = async () => {
      setLoading(true);
      try {
        if (value.type === 'STUDENT' && students.length === 0) {
          const res = await api.get('/students?limit=200');
          setStudents(res.data.data || []);
        } else if (value.type === 'TEACHER' && teachers.length === 0) {
          const res = await api.get('/teachers');
          setTeachers(res.data.data || []);
        } else if (value.type === 'BATCH' && classes.length === 0) {
          const res = await api.get('/classes');
          setClasses(res.data.data || res.data || []);
        }
      } catch (err) {
        console.error('Failed to load recipient targets:', err);
      } finally {
        setLoading(false);
      }
    };

    if (value.type !== 'CUSTOM') {
      fetchTargets();
    }
  }, [value.type]);

  const handleTypeChange = (type: RecipientType) => {
    onChange({ type, customPhone: '', selectedIds: [], recipientNames: [] });
    setSearchTerm('');
  };

  const handleCustomPhoneChange = (phone: string) => {
    onChange({ ...value, customPhone: phone, recipientNames: [phone] });
  };

  const handleSelectId = (id: string, name: string) => {
    let updatedIds = [...value.selectedIds];
    let updatedNames = [...value.recipientNames];

    if (value.type === 'BATCH') {
      if (updatedIds.includes(id)) {
        updatedIds = updatedIds.filter(x => x !== id);
        updatedNames = updatedNames.filter(x => x !== name);
      } else {
        updatedIds = [id];
        updatedNames = [name];
      }
    } else {
      if (updatedIds.includes(id)) {
        updatedIds = updatedIds.filter(x => x !== id);
        updatedNames = updatedNames.filter(x => x !== name);
      } else {
        updatedIds.push(id);
        updatedNames.push(name);
      }
    }

    onChange({ ...value, selectedIds: updatedIds, recipientNames: updatedNames });
  };

  const getFilteredItems = () => {
    const term = searchTerm.toLowerCase();
    if (value.type === 'STUDENT') {
      return students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(term) ||
        s.phone?.includes(term) ||
        s.PRO_ID?.toLowerCase().includes(term)
      );
    }
    if (value.type === 'TEACHER') {
      return teachers.filter(t =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(term) ||
        t.phone?.includes(term)
      );
    }
    if (value.type === 'BATCH') {
      return classes.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.class_code?.toLowerCase().includes(term) ||
        c.grade_level?.toLowerCase().includes(term)
      );
    }
    return [];
  };

  const filteredItems = getFilteredItems();

  const typeBtnBase: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border-primary)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Target Type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
        {(['CUSTOM', 'STUDENT', 'TEACHER', 'BATCH'] as RecipientType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            style={{
              ...typeBtnBase,
              background: value.type === t ? 'var(--error-light)' : 'var(--bg-secondary)',
              borderColor: value.type === t ? 'var(--error)' : 'var(--border-primary)',
              color: value.type === t ? 'var(--error)' : 'var(--text-secondary)',
            }}
          >
            {t === 'CUSTOM' && <Phone size={13} />}
            {t === 'STUDENT' && <GraduationCap size={13} />}
            {t === 'TEACHER' && <User size={13} />}
            {t === 'BATCH' && <Users size={13} />}
            {t === 'CUSTOM' ? 'Custom Phone' : t === 'BATCH' ? 'Target Batch' : `${t.charAt(0) + t.slice(1).toLowerCase()}s`}
          </button>
        ))}
      </div>

      {/* Inputs area */}
      {value.type === 'CUSTOM' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Phone Number</label>
          <input
            type="text"
            placeholder="e.g. +919999988888 (Include Country Code)"
            value={value.customPhone}
            onChange={(e) => handleCustomPhoneChange(e.target.value)}
            className="input-field"
          />
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
            <Info size={11} /> Enter full international format without spaces or symbols.
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '10px',
            padding: '6px 12px',
          }}>
            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder={`Search ${value.type === 'BATCH' ? 'classes...' : 'by name or phone...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
                padding: '4px 0',
              }}
            />
          </div>

          {/* List display */}
          <div style={{
            maxHeight: '192px',
            overflowY: 'auto',
            border: '1px solid var(--border-primary)',
            borderRadius: '10px',
            background: 'var(--bg-primary)',
          }}>
            {loading ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)' }}>Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No matching results found.</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = value.selectedIds.includes(item.id);
                let displayName = '';
                let subText = '';

                if (value.type === 'STUDENT' || value.type === 'TEACHER') {
                  displayName = `${item.first_name} ${item.last_name}`;
                  subText = `${item.PRO_ID || ''} • ${item.phone || 'No phone'}`;
                } else if (value.type === 'BATCH') {
                  displayName = item.name;
                  subText = `Code: ${item.class_code || 'N/A'} • Grade: ${item.grade_level || 'N/A'}`;
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectId(item.id, displayName)}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                      background: isSelected ? 'var(--error-light)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: isSelected ? 'var(--error)' : 'var(--text-primary)' }}>
                        {displayName}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{subText}</span>
                    </div>

                    {/* Checkbox */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `1px solid ${isSelected ? 'var(--error)' : 'var(--border-primary)'}`,
                      background: isSelected ? 'var(--error)' : 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '9px',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Badges */}
          {value.selectedIds.length > 0 && (
            <div style={{ paddingTop: '8px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                Selected {value.type === 'BATCH' ? 'Batch' : 'Recipients'} ({value.selectedIds.length})
              </span>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: '96px',
                overflowY: 'auto',
                padding: '4px',
                background: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
              }}>
                {value.recipientNames.map((name, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleSelectId(value.selectedIds[idx], name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        fontWeight: 700,
                        marginLeft: '2px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

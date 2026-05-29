'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search, BookOpen, Plus, Check, Loader2, ChevronDown, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface Subject {
  id: string;
  canonical_name: string;
  normalized_key: string;
  short_name?: string | null;
  code?: string | null;
  is_active: boolean;
  aliases?: Array<{ id: string; alias: string }>;
}

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export default function SubjectSelector({
  value,
  onChange,
  placeholder = 'Select a subject...',
  disabled = false,
  required = false,
  error = ''
}: SubjectSelectorProps) {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch subjects on mount / open
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.get('/subjects');
        if (res.data && res.data.success) {
          // Filter only active subjects
          const activeOnes = res.data.data.filter((s: Subject) => s.is_active);
          setSubjects(activeOnes);
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Update input text when external value changes
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset search field to current value if not confirmed
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [value]);

  // Filtering Logic
  const filteredSubjects = subjects.filter(subj => {
    const query = search.toLowerCase().trim();
    if (!query) return true;

    // Match canonical name
    const matchCanonical = subj.canonical_name.toLowerCase().includes(query);
    
    // Match code or short name
    const matchCode = subj.code?.toLowerCase().includes(query) || false;
    const matchShort = subj.short_name?.toLowerCase().includes(query) || false;

    // Match aliases
    const matchAliases = subj.aliases?.some(a => a.alias.toLowerCase().includes(query)) || false;

    return matchCanonical || matchCode || matchShort || matchAliases;
  });

  // Check if search string matches any existing canonical name or alias exactly
  const hasExactMatch = subjects.some(subj => {
    const query = search.toLowerCase().trim();
    if (subj.canonical_name.toLowerCase() === query) return true;
    if (subj.aliases?.some(a => a.alias.toLowerCase() === query)) return true;
    return false;
  });

  // Handle dropdown selection
  const selectSubject = (subjName: string) => {
    onChange(subjName);
    setSearch(subjName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = prev + 1;
        // Count list items (filtered list + "Create new subject" option if allowed)
        const totalItems = filteredSubjects.length + (canCreateSubject ? 1 : 0);
        return next >= totalItems ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = prev - 1;
        const totalItems = filteredSubjects.length + (canCreateSubject ? 1 : 0);
        return next < 0 ? totalItems - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      const totalItems = filteredSubjects.length;
      if (activeIndex >= 0 && activeIndex < totalItems) {
        // Selected standard item
        selectSubject(filteredSubjects[activeIndex].canonical_name);
      } else if (activeIndex === totalItems && canCreateSubject) {
        // Selected inline create option
        handleCreateInline();
      } else if (filteredSubjects.length > 0) {
        // Default to first match if no active selection
        selectSubject(filteredSubjects[0].canonical_name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch(value || '');
      inputRef.current?.blur();
    }
  };

  // Auto-scroll inside list container for focused keyboard item
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const parent = listRef.current;
        const itemTop = activeEl.offsetTop;
        const itemBottom = itemTop + activeEl.clientHeight;
        const parentTop = parent.scrollTop;
        const parentBottom = parentTop + parent.clientHeight;

        if (itemBottom > parentBottom) {
          parent.scrollTop = itemBottom - parent.clientHeight;
        } else if (itemTop < parentTop) {
          parent.scrollTop = itemTop;
        }
      }
    }
  }, [activeIndex]);

  // Inline subject creator
  const canCreateSubject = 
    search.trim() !== '' && 
    !hasExactMatch && 
    (user?.role === 'admin' || user?.role === 'coordinator');

  const handleCreateInline = async () => {
    const rawName = search.trim();
    if (!rawName) return;

    setCreating(true);
    try {
      const res = await api.post('/subjects', { name: rawName });
      if (res.data && res.data.success) {
        const newSubj: Subject = res.data.data;
        // Prepend or add to subjects list
        setSubjects(prev => [newSubj, ...prev]);
        selectSubject(newSubj.canonical_name);
      }
    } catch (err: any) {
      console.error('Error creating subject inline:', err);
      const msg = err.response?.data?.message || 'Failed to create subject';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  // Clear current value
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dynamic Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subjDropdownIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .subj-dropdown-anim {
          animation: subjDropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .subj-item {
          transition: all 0.15s ease;
        }
        .subj-item:hover {
          background: #F1F5F9;
        }
      `}} />

      {/* Input Field Container */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: '14px', pointerEvents: 'none',
          color: isOpen ? '#E53935' : '#94A3B8', transition: 'color 0.2s',
          display: 'flex', alignItems: 'center'
        }}>
          <BookOpen size={16} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '12px 40px 12px 40px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1E293B',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            border: `1.5px solid ${error ? '#EF4444' : isOpen ? '#E53935' : '#E2E8F0'}`,
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: isOpen ? '0 0 0 4px rgba(229, 57, 53, 0.08)' : 'none',
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />

        {/* Clear & Loading & Dropdown Icons */}
        <div style={{
          position: 'absolute', right: '14px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {creating ? (
            <Loader2 size={16} className="animate-spin" style={{ color: '#E53935' }} />
          ) : search && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '50%',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#475569'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              <X size={15} />
            </button>
          ) : null}

          <ChevronDown
            size={16}
            style={{
              color: '#94A3B8',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <span style={{
          display: 'block', fontSize: '12px', fontWeight: 600, color: '#EF4444',
          marginTop: '6px', paddingLeft: '4px'
        }}>
          {error}
        </span>
      )}

      {/* Dynamic Dropdown List */}
      {isOpen && !disabled && (
        <div
          className="subj-dropdown-anim"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            zIndex: 999,
            overflow: 'hidden',
          }}
        >
          {loading && subjects.length === 0 ? (
            <div style={{
              padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', color: '#64748B', fontSize: '13.5px', fontWeight: 600
            }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#E53935' }} />
              Loading subjects database...
            </div>
          ) : (
            <div
              ref={listRef}
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '8px'
              }}
            >
              {filteredSubjects.map((subj, idx) => {
                const isSelected = value === subj.canonical_name;
                const isActiveKey = activeIndex === idx;

                return (
                  <div
                    key={subj.id}
                    onClick={() => selectSubject(subj.canonical_name)}
                    className="subj-item"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? '#FFF5F5' : isActiveKey ? '#F1F5F9' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: isSelected ? '#E53935' : '#1E293B'
                      }}>
                        {subj.canonical_name}
                      </span>
                      {subj.code && (
                        <span style={{
                          fontSize: '11px',
                          color: '#64748B',
                          fontWeight: 500,
                          marginTop: '2px'
                        }}>
                          Code: {subj.code} {subj.short_name ? `• ${subj.short_name}` : ''}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} style={{ color: '#E53935', strokeWidth: 3 }} />
                    )}
                  </div>
                );
              })}

              {/* No items found */}
              {filteredSubjects.length === 0 && !canCreateSubject && (
                <div style={{
                  padding: '20px', textAlign: 'center', color: '#64748B',
                  fontSize: '13px', fontWeight: 600
                }}>
                  No matching subjects found
                </div>
              )}

              {/* Create new Subject option inline */}
              {canCreateSubject && (
                <div
                  onClick={handleCreateInline}
                  className="subj-item"
                  style={{
                    borderTop: '1px solid #F1F5F9',
                    marginTop: '4px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: activeIndex === filteredSubjects.length ? '#FFF5F5' : '#F8FAFC',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (activeIndex !== filteredSubjects.length) {
                      e.currentTarget.style.background = '#FFF5F5';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeIndex !== filteredSubjects.length) {
                      e.currentTarget.style.background = '#F8FAFC';
                    }
                  }}
                >
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: '#FEF2F2', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#E53935', flexShrink: 0
                  }}>
                    <Plus size={14} style={{ strokeWidth: 3 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#E53935'
                    }}>
                      Create new subject: "{search.trim()}"
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#64748B',
                      fontWeight: 500,
                      marginTop: '1px'
                    }}>
                      Add it as a master canonical subject
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

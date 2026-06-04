'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { BookOpen, Check, Loader2, ChevronDown, X, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface Subject {
  id: string;
  canonical_name: string;
  normalized_key: string;
  short_name?: string | null;
  code?: string | null;
}

interface ClassSubjectSelectorProps {
  classId?: string; // The class to filter subjects by
  value: string; // Current selected subject ID or canonical name
  onChange: (value: string) => void; // Callback returning subject.id or canonical_name
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  returnId?: boolean; // Whether to return subject ID instead of canonical name in onChange
}

export default function ClassSubjectSelector({
  classId = '',
  value,
  onChange,
  placeholder = 'Select a subject...',
  disabled = false,
  required = false,
  error = '',
  returnId = false
}: ClassSubjectSelectorProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch subjects for class when classId changes
  useEffect(() => {
    if (!classId) {
      setSubjects([]);
      setSearch('');
      onChange('');
      return;
    }

    const fetchClassSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/classes/${classId}/subjects`);
        if (res.data && res.data.success) {
          setSubjects(res.data.data);
          
          // If there is an existing value, try to find it and update search input
          const existing = res.data.data.find(
            (s: Subject) => s.id === value || s.canonical_name === value
          );
          if (existing) {
            setSearch(existing.canonical_name);
          } else {
            setSearch('');
          }
        }
      } catch (err) {
        console.error('Error fetching subjects for class:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassSubjects();
  }, [classId]);

  // Sync search input with value updates
  useEffect(() => {
    if (!value) {
      setSearch('');
      return;
    }
    const found = subjects.find(s => s.id === value || s.canonical_name === value);
    if (found) {
      setSearch(found.canonical_name);
    } else if (subjects.length > 0) {
      // In case subjects loaded after value was set
      setSearch('');
    }
  }, [value, subjects]);

  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset search to match actual confirmed selection
        const found = subjects.find(s => s.id === value || s.canonical_name === value);
        setSearch(found ? found.canonical_name : '');
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [value, subjects]);

  const filteredSubjects = subjects.filter(subj => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      subj.canonical_name.toLowerCase().includes(query) ||
      (subj.code && subj.code.toLowerCase().includes(query)) ||
      (subj.short_name && subj.short_name.toLowerCase().includes(query))
    );
  });

  const selectSubject = (subj: Subject) => {
    const outputValue = returnId ? subj.id : subj.canonical_name;
    onChange(outputValue);
    setSearch(subj.canonical_name);
    setIsOpen(false);
    setActiveIndex(-1);
  };

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
        return next >= filteredSubjects.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        const next = prev - 1;
        return next < 0 ? filteredSubjects.length - 1 : next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredSubjects.length) {
        selectSubject(filteredSubjects[activeIndex]);
      } else if (filteredSubjects.length > 0) {
        selectSubject(filteredSubjects[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      const found = subjects.find(s => s.id === value || s.canonical_name === value);
      setSearch(found ? found.canonical_name : '');
      inputRef.current?.blur();
    }
  };

  // Auto-scroll list when navigating with arrows
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const isSelectorDisabled = disabled || !classId;
  const placeholderText = !classId 
    ? '⚠️ Select class/batch first' 
    : loading 
      ? 'Loading subjects...' 
      : placeholder;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes classSubjDropdownIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .class-subj-dropdown-anim {
          animation: classSubjDropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Input container */}
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
          onFocus={() => {
            if (classId) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={isSelectorDisabled}
          placeholder={placeholderText}
          required={required}
          style={{
            width: '100%',
            padding: '12px 40px 12px 40px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1E293B',
            background: isSelectorDisabled ? '#F8FAFC' : '#FFFFFF',
            border: `1.5px solid ${error ? '#EF4444' : isOpen ? '#E53935' : '#E2E8F0'}`,
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: isOpen ? '0 0 0 4px rgba(229, 57, 53, 0.08)' : 'none',
            cursor: isSelectorDisabled ? 'not-allowed' : 'text'
          }}
        />

        {/* Clear / Status Icon */}
        <div style={{
          position: 'absolute', right: '14px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {loading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: '#E53935' }} />
          ) : search && !isSelectorDisabled ? (
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

      {/* Dropdown Items */}
      {isOpen && !isSelectorDisabled && (
        <div
          className="class-subj-dropdown-anim"
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
          <div
            ref={listRef}
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '8px'
            }}
          >
            {filteredSubjects.map((subj, idx) => {
              const isSelected = value === subj.id || value === subj.canonical_name;
              const isActiveKey = activeIndex === idx;

              return (
                <div
                  key={subj.id}
                  onClick={() => selectSubject(subj)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? '#FFF5F5' : isActiveKey ? '#F1F5F9' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#F1F5F9';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
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

            {filteredSubjects.length === 0 && (
              <div style={{
                padding: '20px', textAlign: 'center', color: '#64748B',
                fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={18} style={{ color: '#94A3B8' }} />
                No subjects assigned to this class
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

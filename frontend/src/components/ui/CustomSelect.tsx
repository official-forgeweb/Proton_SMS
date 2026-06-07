'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    name?: string;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    className = '',
    required = false,
    disabled = false,
    name
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset search query when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 10 }}>
            {/* Hidden Input for Form Validation */}
            <input
                type="text"
                value={value}
                required={required}
                disabled={disabled}
                name={name}
                readOnly
                onChange={() => {}}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: -1
                }}
            />

            {/* Dropdown Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`form-input ${className}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    background: disabled ? '#F1F5F9' : '#F8FAFC',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.7 : 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isOpen ? '1.5px solid var(--primary, #E53935)' : '1.5px solid #E2E8F0',
                    boxShadow: isOpen ? '0 0 0 4px rgba(229, 57, 53, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    color: selectedOption ? '#1E293B' : '#64748B',
                    fontWeight: 500,
                    fontSize: '14px',
                    outline: 'none'
                }}
            >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: '#64748B',
                        flexShrink: 0,
                        marginLeft: '8px'
                    }}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        width: '100%',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 12px 32px rgba(26, 29, 59, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.4)',
                        overflow: 'hidden',
                        animation: 'slideUpDropdown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Search Bar (if options > 5) */}
                    {options.length > 5 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                borderBottom: '1px solid #F1F5F9',
                                background: '#FCFDFE'
                            }}
                        >
                            <Search size={14} color="#94A3B8" />
                            <input
                                type="text"
                                placeholder="Search options..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    width: '100%',
                                    fontSize: '13px',
                                    color: '#1E293B',
                                    fontWeight: 500
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div
                        style={{
                            maxHeight: '220px',
                            overflowY: 'auto',
                            padding: '4px'
                        }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const isSelected = opt.value === value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: isSelected ? 650 : 500,
                                            color: isSelected ? 'var(--primary, #E53935)' : '#334155',
                                            background: isSelected ? '#FFEBEE' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {opt.label}
                                        </span>
                                        {isSelected && <Check size={14} style={{ color: 'var(--primary, #E53935)' }} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div
                                style={{
                                    padding: '16px',
                                    textAlign: 'center',
                                    color: '#94A3B8',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}
                            >
                                No matching options found
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideUpDropdown {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            ` }} />
        </div>
    );
}

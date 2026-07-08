'use client';
import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
    value: string; // "HH:mm" format (24-hour)
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function CustomTimePicker({ value, onChange, disabled = false }: CustomTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Parse/default the current value
    const timeValue = value || '08:00';

    // Generate all times in 15-minute increments for 24 hours
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const hStr = String(hour).padStart(2, '0');
            const mStr = String(min).padStart(2, '0');
            times.push(`${hStr}:${mStr}`);
        }
    }

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

    // Scroll selected value into view when dropdown opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
                if (selectedEl) {
                    selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleTimeSelect = (t: string) => {
        onChange(t);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 10 }}>
            {/* Input Trigger */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: disabled ? '#F1F5F9' : '#F8FAFC',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.7 : 1,
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: isOpen ? '1.5px solid #A855F7' : '1.5px solid #E2E8F0',
                    outline: 'none',
                    fontSize: '15px',
                    color: '#1E293B',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 3px rgba(168, 85, 247, 0.15)' : 'none',
                }}
            >
                <span>{timeValue}</span>
                <Clock size={16} color={isOpen ? '#A855F7' : '#94A3B8'} style={{ flexShrink: 0 }} />
            </div>

            {/* Dropdown Popover */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '6px',
                    background: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    padding: '6px',
                }}
                ref={listRef}
                className="custom-scrollbar"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {times.map(t => {
                            const isSelected = t === timeValue;
                            return (
                                <div
                                    key={t}
                                    data-selected={isSelected}
                                    onClick={() => handleTimeSelect(t)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: isSelected ? 700 : 500,
                                        backgroundColor: isSelected ? '#A855F7' : 'transparent',
                                        color: isSelected ? '#ffffff' : '#475569',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span>{t}</span>
                                    {isSelected && <span style={{ fontSize: '12px', opacity: 0.8 }}>✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Custom scrollbar styling inside dropdown */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}} />
        </div>
    );
}

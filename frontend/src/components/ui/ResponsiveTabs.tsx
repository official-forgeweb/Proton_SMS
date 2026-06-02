'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface TabItem {
    id: string;
    label: string;
    icon?: React.ComponentType<any> | React.ReactNode;
}

interface ResponsiveTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function ResponsiveTabs({
    tabs,
    activeTab,
    onChange,
    className = '',
    style = {}
}: ResponsiveTabsProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeTabItem = tabs.find(t => t.id === activeTab) || tabs[0];
    const ActiveIcon = activeTabItem?.icon;

    // Use customized premium dropdown for mobile when there are more than 3 tabs
    const useDropdown = isMobile && tabs.length > 3;

    return (
        <div 
            className={`responsive-tabs-wrapper ${className}`} 
            style={{ 
                width: '100%', 
                marginBottom: '24px',
                position: 'relative',
                ...style 
            }}
            ref={dropdownRef}
        >
            {useDropdown ? (
                <div style={{ width: '100%', position: 'relative' }}>
                    {/* Premium Styled Dropdown Trigger Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 20px',
                            borderRadius: '16px',
                            border: isOpen ? '2px solid #E53935' : '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#1A1D3B',
                            fontWeight: 700,
                            fontSize: '15px',
                            boxShadow: '0 4px 20px rgba(26, 29, 59, 0.04)',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {ActiveIcon && (
                                <span style={{ color: '#E53935', display: 'flex', alignItems: 'center' }}>
                                    {typeof ActiveIcon === 'function' ? <ActiveIcon size={18} /> : ActiveIcon}
                                </span>
                            )}
                            <span>{activeTabItem?.label}</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            style={{ 
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                color: '#5E6278'
                            }} 
                        />
                    </button>

                    {/* Custom Floating Dropdown Menu Options */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '18px',
                            border: '1px solid rgba(228, 230, 239, 0.9)',
                            boxShadow: '0 12px 36px rgba(26, 29, 59, 0.12)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            padding: '6px',
                            animation: 'slideDownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            transformOrigin: 'top center'
                        }}>
                            {tabs.map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            onChange(tab.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            border: 'none',
                                            borderRadius: '12px',
                                            background: isActive ? '#FFEBEE' : 'transparent',
                                            color: isActive ? '#E53935' : '#1A1D3B',
                                            fontWeight: isActive ? 750 : 600,
                                            fontSize: '14.5px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s ease',
                                            marginBottom: '2px',
                                            outline: 'none',
                                            minHeight: '44px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {TabIcon && (
                                                <span style={{ 
                                                    color: isActive ? '#E53935' : '#8F92A1',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    {typeof TabIcon === 'function' ? <TabIcon size={16} /> : TabIcon}
                                                </span>
                                            )}
                                            <span>{tab.label}</span>
                                        </div>
                                        {isActive && <Check size={16} color="#E53935" strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div 
                    className="tabs-scroll-container hide-scrollbar"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        paddingBottom: '4px',
                        borderBottom: '1px solid #EEEEF5',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 700 : 600,
                                    color: isActive ? '#E53935' : '#5E6278',
                                    background: isActive ? '#FFEBEE' : 'transparent',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                    outline: 'none',
                                    minHeight: '44px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.color = '#E53935';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.color = '#5E6278';
                                }}
                            >
                                {Icon && (typeof Icon === 'function' ? <Icon size={16} /> : Icon)}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <style jsx global>{`
                @keyframes slideDownFade {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}

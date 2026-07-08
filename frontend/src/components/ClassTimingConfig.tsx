'use client';
import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Sliders, CalendarClock, ListPlus, Sparkles } from 'lucide-react';
import { SectionCard, FormGrid, FieldGroup } from './form';

interface Break {
    break_name: string;
    after_period: number;
    duration_minutes: number;
}

interface TimeSlot {
    period_number: number;
    start_time: string;
    end_time: string;
    is_break: boolean;
    break_name?: string;
}

interface ClassTimingConfigProps {
    value: {
        institute_start: string;
        institute_end: string;
        lecture_duration: number;
        working_days?: string[];
        is_manual: boolean;
        breaks: Break[];
        manual_slots: TimeSlot[];
    };
    onChange: (config: any) => void;
}

export default function ClassTimingConfig({ value, onChange }: ClassTimingConfigProps) {
    const [config, setConfig] = useState({
        institute_start: value?.institute_start || '08:00',
        institute_end: value?.institute_end || '14:00',
        lecture_duration: value?.lecture_duration || 45,
        working_days: value?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        is_manual: value?.is_manual || false,
        breaks: value?.breaks || [],
        manual_slots: value?.manual_slots || []
    });

    const [generatedSlots, setGeneratedSlots] = useState<TimeSlot[]>([]);
    const [customDuration, setCustomDuration] = useState('');
    const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);

    // Sync state changes upward
    const updateConfig = (newFields: Partial<typeof config>) => {
        const next = { ...config, ...newFields };
        setConfig(next);
        onChange(next);
    };

    // Helper to parse time string HH:mm to minutes
    const timeToMin = (t: string): number => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    // Helper to convert minutes back to HH:mm string
    const minToTime = (min: number): string => {
        const h = Math.floor(min / 60) % 24;
        const m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // Compute preview slots when in Auto-generate mode
    useEffect(() => {
        if (config.is_manual) return;

        const startMin = timeToMin(config.institute_start);
        const endMin = timeToMin(config.institute_end);
        const duration = Number(config.lecture_duration) || 45;

        // Map breaks by after_period
        const breaksMap = new Map<number, Break>();
        config.breaks.forEach(b => {
            breaksMap.set(Number(b.after_period), b);
        });

        const slots: TimeSlot[] = [];
        let currentMin = startMin;
        let periodNum = 0;

        while (currentMin + duration <= endMin) {
            periodNum++;
            slots.push({
                period_number: periodNum,
                start_time: minToTime(currentMin),
                end_time: minToTime(currentMin + duration),
                is_break: false
            });
            currentMin += duration;

            const brk = breaksMap.get(periodNum);
            if (brk && currentMin + Number(brk.duration_minutes) <= endMin) {
                slots.push({
                    period_number: -1,
                    start_time: minToTime(currentMin),
                    end_time: minToTime(currentMin + Number(brk.duration_minutes)),
                    is_break: true,
                    break_name: brk.break_name || 'Break'
                });
                currentMin += Number(brk.duration_minutes);
            }
        }

        setGeneratedSlots(slots);
    }, [config.institute_start, config.institute_end, config.lecture_duration, config.breaks, config.is_manual]);

    // Handle standard duration pre-sets
    const handleDurationChange = (val: string) => {
        if (val === 'custom') {
            setShowCustomDurationInput(true);
        } else {
            setShowCustomDurationInput(false);
            updateConfig({ lecture_duration: Number(val) });
        }
    };

    // Add a new Break parameter (Auto Mode)
    const addBreak = () => {
        const newBreak: Break = { break_name: 'Short Break', after_period: 2, duration_minutes: 15 };
        updateConfig({ breaks: [...config.breaks, newBreak] });
    };

    const removeBreak = (idx: number) => {
        const nextBreaks = [...config.breaks];
        nextBreaks.splice(idx, 1);
        updateConfig({ breaks: nextBreaks });
    };

    const updateBreak = (idx: number, field: keyof Break, val: any) => {
        const nextBreaks = [...config.breaks];
        nextBreaks[idx] = { ...nextBreaks[idx], [field]: val };
        updateConfig({ breaks: nextBreaks });
    };

    // Manual slot functions (Manual Mode)
    const addManualSlot = () => {
        const lastSlot = config.manual_slots[config.manual_slots.length - 1];
        let nextStart = config.institute_start;
        if (lastSlot) {
            nextStart = lastSlot.end_time;
        }

        const nextMin = timeToMin(nextStart);
        const defaultDuration = config.lecture_duration || 45;

        const newSlot: TimeSlot = {
            period_number: config.manual_slots.filter(s => !s.is_break).length + 1,
            start_time: nextStart,
            end_time: minToTime(nextMin + defaultDuration),
            is_break: false
        };

        updateConfig({ manual_slots: [...config.manual_slots, newSlot] });
    };

    const removeManualSlot = (idx: number) => {
        const nextSlots = [...config.manual_slots];
        nextSlots.splice(idx, 1);

        // Re-number teaching periods sequentially
        let teachingIdx = 0;
        const normalized = nextSlots.map(s => {
            if (s.is_break) return s;
            teachingIdx++;
            return { ...s, period_number: teachingIdx };
        });

        updateConfig({ manual_slots: normalized });
    };

    const updateManualSlot = (idx: number, field: keyof TimeSlot, val: any) => {
        const nextSlots = [...config.manual_slots];
        nextSlots[idx] = { ...nextSlots[idx], [field]: val };
        updateConfig({ manual_slots: nextSlots });
    };

    return (
        <SectionCard 
            title="Class Timings & Periods Grid" 
            description="Define timing constraints, durations, and break timings for automated slot planning."
            icon={<CalendarClock size={18} />}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Generation Mode Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', padding: '6px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <button
                        type="button"
                        onClick={() => updateConfig({ is_manual: false })}
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: !config.is_manual ? '#FFFFFF' : 'transparent',
                            color: !config.is_manual ? '#E53935' : '#64748B',
                            boxShadow: !config.is_manual ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Sparkles size={14} /> Auto-Generate Periods
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            // Seed manual slots from auto slots if currently empty
                            if (config.manual_slots.length === 0) {
                                updateConfig({ is_manual: true, manual_slots: generatedSlots });
                            } else {
                                updateConfig({ is_manual: true });
                            }
                        }}
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: config.is_manual ? '#FFFFFF' : 'transparent',
                            color: config.is_manual ? '#E53935' : '#64748B',
                            boxShadow: config.is_manual ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Sliders size={14} /> Manually Configure Slots
                    </button>
                </div>

                {/* Shared Timings Inputs */}
                <FormGrid columns={2}>
                    <FieldGroup label="Institute Start Time (e.g. 08:00 AM)">
                        <input
                            type="time"
                            required
                            className="form-input"
                            value={config.institute_start}
                            onChange={e => updateConfig({ institute_start: e.target.value })}
                        />
                    </FieldGroup>
                    <FieldGroup label="Institute End Time (e.g. 02:00 PM)">
                        <input
                            type="time"
                            required
                            className="form-input"
                            value={config.institute_end}
                            onChange={e => updateConfig({ institute_end: e.target.value })}
                        />
                    </FieldGroup>
                </FormGrid>

                {!config.is_manual ? (
                    /* AUTO MODE OPTIONS */
                    <>
                        <FormGrid columns={2}>
                            <FieldGroup label="Lecture Duration">
                                <select
                                    className="form-input"
                                    value={showCustomDurationInput ? 'custom' : config.lecture_duration}
                                    onChange={e => handleDurationChange(e.target.value)}
                                >
                                    <option value="30">30 mins</option>
                                    <option value="35">35 mins</option>
                                    <option value="40">40 mins</option>
                                    <option value="45">45 mins</option>
                                    <option value="50">50 mins</option>
                                    <option value="60">60 mins</option>
                                    <option value="custom">Custom Minute Interval</option>
                                </select>
                            </FieldGroup>
                            
                            {showCustomDurationInput ? (
                                <FieldGroup label="Custom Duration (minutes)">
                                    <input
                                        type="number"
                                        min="10"
                                        max="180"
                                        placeholder="Ex: 55"
                                        className="form-input"
                                        value={customDuration}
                                        onChange={e => {
                                            setCustomDuration(e.target.value);
                                            updateConfig({ lecture_duration: Number(e.target.value) || 45 });
                                        }}
                                    />
                                </FieldGroup>
                            ) : (
                                <div />
                            )}
                        </FormGrid>

                        {/* Breaks Grid Settings */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Breaks Definition</span>
                                <button
                                    type="button"
                                    onClick={addBreak}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        fontSize: '12px', fontWeight: 700, color: '#E53935',
                                        background: 'rgba(229, 57, 53, 0.05)', border: '1px dashed rgba(229, 57, 53, 0.2)',
                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={14} /> Add Break
                                </button>
                            </div>

                            {config.breaks.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {config.breaks.map((brk, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ flex: 2 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Break Label (e.g. Recess)"
                                                    className="form-input"
                                                    value={brk.break_name}
                                                    onChange={e => updateBreak(idx, 'break_name', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>After Period</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    className="form-input"
                                                    value={brk.after_period}
                                                    onChange={e => updateBreak(idx, 'after_period', Number(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="120"
                                                    className="form-input"
                                                    value={brk.duration_minutes}
                                                    onChange={e => updateBreak(idx, 'duration_minutes', Number(e.target.value) || 15)}
                                                />
                                                <span style={{ fontSize: '12px', color: '#64748B' }}>mins</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeBreak(idx)}
                                                style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#EF4444' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed #E2E8F0', borderRadius: '10px', color: '#64748B', fontSize: '12px', fontStyle: 'italic' }}>
                                    No break timings configured.
                                </div>
                            )}
                        </div>

                        {/* Generated Time Grid Preview */}
                        <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '12px' }}>Generated Time Grid Preview</span>
                            {generatedSlots.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                                    {generatedSlots.map((s, idx) => (
                                        <div key={idx} style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            background: s.is_break ? '#FFF7ED' : '#F8FAFC',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: s.is_break ? '#EA580C' : '#475569', textTransform: 'uppercase' }}>
                                                {s.is_break ? s.break_name || 'Break' : `Period ${s.period_number}`}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                                                {s.start_time} - {s.end_time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#EF4444', fontSize: '12px', fontWeight: 650 }}>
                                    ⚠️ Timings out of bounds. Adjust Start/End Times to construct slots.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* MANUAL SLOTS MODE OPTIONS */
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Custom Manual Slots Editor</span>
                            <button
                                type="button"
                                onClick={addManualSlot}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontSize: '12px', fontWeight: 700, color: '#E53935',
                                    background: 'rgba(229, 57, 53, 0.05)', border: '1px dashed rgba(229, 57, 53, 0.2)',
                                    padding: '6px 12px', borderRadius: '8px', cursor: 'pointer'
                                }}
                            >
                                <Plus size={14} /> Add Period/Break
                            </button>
                        </div>

                        {config.manual_slots.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {config.manual_slots.map((s, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ flex: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id={`is-break-${idx}`}
                                                checked={s.is_break}
                                                onChange={e => {
                                                    const isBreak = e.target.checked;
                                                    // Trigger rename if converting type
                                                    updateManualSlot(idx, 'is_break', isBreak);
                                                    updateManualSlot(idx, 'break_name', isBreak ? 'Break' : undefined);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label htmlFor={`is-break-${idx}`} style={{ fontSize: '9px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px', cursor: 'pointer' }}>Break</label>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            {s.is_break ? (
                                                <input
                                                    type="text"
                                                    placeholder="Break Label (e.g. Lunch)"
                                                    className="form-input"
                                                    value={s.break_name || 'Break'}
                                                    onChange={e => updateManualSlot(idx, 'break_name', e.target.value)}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', display: 'block', paddingLeft: '8px' }}>
                                                    Period {s.period_number}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748B' }}>Start</span>
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={s.start_time}
                                                onChange={e => updateManualSlot(idx, 'start_time', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '12px', color: '#64748B' }}>End</span>
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={s.end_time}
                                                onChange={e => updateManualSlot(idx, 'end_time', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeManualSlot(idx)}
                                            style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#EF4444' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed #E2E8F0', borderRadius: '10px', color: '#64748B', fontSize: '12px', fontStyle: 'italic' }}>
                                Click "Add Period/Break" to design manual timetable schedule timing grid.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

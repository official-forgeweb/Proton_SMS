'use client';
import { useEffect, useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    X, ChevronRight, ChevronLeft, Calendar, Clock, 
    Layers, Plus, Trash2, AlertTriangle, CheckCircle, 
    User, BookOpen, Check 
} from 'lucide-react';
import api from '@/lib/api';
import { customAlert } from '@/utils/dialog';
import CustomSelect from '@/components/ui/CustomSelect';

interface SubjectFrequency {
    subject_id: string;
    subject_name: string;
    teacher_id: string | null;
    teacher_name: string;
    weekly_count: number;
}

interface BreakConfig {
    id: string;
    break_name: string;
    after_period: number;
    duration_minutes: number;
}

interface Props {
    onClose: () => void;
    classes: any[];
    teachers: any[];
    onSuccess: (msg: string) => void;
}

export default function TimetableWizard({ onClose, classes, teachers, onSuccess }: Props) {
    const [step, setStep] = useState(1);
    
    // Step 1: Select Classes
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [searchClassQuery, setSearchClassQuery] = useState('');

    // Step 2: Academic Calendar (Working Days)
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

    // Step 3: Daily Timing Configuration
    const [instituteStart, setInstituteStart] = useState('08:00');
    const [instituteEnd, setInstituteEnd] = useState('14:00');
    const [lectureDuration, setLectureDuration] = useState<number>(45);
    const [customDuration, setCustomDuration] = useState<number>(45);

    // Step 4: Break Configuration
    const [hasBreaks, setHasBreaks] = useState(true);
    const [breaks, setBreaks] = useState<BreakConfig[]>([
        { id: '1', break_name: 'Lunch Break', after_period: 4, duration_minutes: 30 }
    ]);

    // Step 5: Dates & Generate
    const getNextMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7; // Next Monday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    };
    
    const getNextSaturday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7 + 5; // Next Saturday
        const saturday = new Date(d.setDate(diff));
        return saturday.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getNextMonday());
    const [endDate, setEndDate] = useState(getNextSaturday());
    const [overrideConflicts, setOverrideConflicts] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationConflicts, setGenerationConflicts] = useState<any[]>([]);

    // ── Live Computations for Step 3 & 4 ──
    const totalTeachingMinutes = useMemo(() => {
        const [hStart, mStart] = instituteStart.split(':').map(Number);
        const [hEnd, mEnd] = instituteEnd.split(':').map(Number);
        return (hEnd * 60 + mEnd) - (hStart * 60 + mStart);
    }, [instituteStart, instituteEnd]);

    const activeDuration = lectureDuration === -1 ? customDuration : lectureDuration;

    // Calculate number of teaching periods and break injections
    const dailyTimeline = useMemo(() => {
        const timeline: { type: 'lecture' | 'break'; name: string; start: string; end: string; period?: number }[] = [];
        const sortedBreaks = [...breaks].sort((a, b) => a.after_period - b.after_period);
        const breakAfterPeriod = new Map<number, BreakConfig>();
        if (hasBreaks) {
            sortedBreaks.forEach(b => breakAfterPeriod.set(b.after_period, b));
        }

        const [hStart, mStart] = instituteStart.split(':').map(Number);
        const [hEnd, mEnd] = instituteEnd.split(':').map(Number);
        const endMin = hEnd * 60 + mEnd;

        let currentMin = hStart * 60 + mStart;
        let periodCount = 0;

        const formatTimeStr = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
        };

        while (currentMin + activeDuration <= endMin) {
            periodCount++;
            timeline.push({
                type: 'lecture',
                name: `Period ${periodCount}`,
                period: periodCount,
                start: formatTimeStr(currentMin),
                end: formatTimeStr(currentMin + activeDuration)
            });
            currentMin += activeDuration;

            const brk = breakAfterPeriod.get(periodCount);
            if (brk && currentMin + brk.duration_minutes <= endMin) {
                timeline.push({
                    type: 'break',
                    name: brk.break_name || 'Break',
                    start: formatTimeStr(currentMin),
                    end: formatTimeStr(currentMin + brk.duration_minutes)
                });
                currentMin += brk.duration_minutes;
            }
        }

        return { timeline, totalPeriods: periodCount };
    }, [instituteStart, instituteEnd, activeDuration, breaks, hasBreaks]);



    // Fetch previously saved config for single selected class to prefill timings
    useEffect(() => {
        if (selectedClassIds.length === 1) {
            api.get(`/timetable/config/${selectedClassIds[0]}`).then(res => {
                const saved = res.data.data;
                if (saved) {
                    setInstituteStart(saved.institute_start || '08:00');
                    setInstituteEnd(saved.institute_end || '14:00');
                    setLectureDuration(saved.lecture_duration || 45);
                    setWorkingDays(saved.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
                    if (saved.breaks && saved.breaks.length > 0) {
                        setHasBreaks(true);
                        setBreaks(saved.breaks.map((b: any, index: number) => ({
                            id: String(index + 1),
                            break_name: b.break_name,
                            after_period: b.after_period,
                            duration_minutes: b.duration_minutes
                        })));
                    } else {
                        setHasBreaks(false);
                    }
                }
            }).catch(console.error);
        }
    }, [selectedClassIds]);

    const filteredClasses = classes.filter(c => 
        (c.class_name || '').toLowerCase().includes(searchClassQuery.toLowerCase())
    );

    const toggleClassSelection = (id: string) => {
        if (selectedClassIds.includes(id)) {
            setSelectedClassIds(selectedClassIds.filter(cid => cid !== id));
        } else {
            setSelectedClassIds([...selectedClassIds, id]);
        }
    };

    const toggleWorkingDay = (day: string) => {
        if (workingDays.includes(day)) {
            setWorkingDays(workingDays.filter(d => d !== day));
        } else {
            setWorkingDays([...workingDays, day]);
        }
    };

    const handleAddBreak = () => {
        const nextId = String(breaks.length + 1);
        setBreaks([...breaks, { id: nextId, break_name: 'Short Break', after_period: 2, duration_minutes: 15 }]);
    };

    const handleRemoveBreak = (id: string) => {
        setBreaks(breaks.filter(b => b.id !== id));
    };

    const handleUpdateBreak = (id: string, field: keyof BreakConfig, value: any) => {
        setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };



    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationConflicts([]);

        // Formulate generation config
        const payloadConfig = {
            institute_start: instituteStart,
            institute_end: instituteEnd,
            lecture_duration: activeDuration,
            working_days: workingDays,
            breaks: hasBreaks ? breaks.map(b => ({
                break_name: b.break_name,
                after_period: b.after_period,
                duration_minutes: b.duration_minutes
            })) : []
        };

        try {
            const res = await api.post('/timetable/generate', {
                class_ids: selectedClassIds,
                start_date: startDate,
                end_date: endDate,
                config: payloadConfig,
                override_conflicts: overrideConflicts
            });

            if (res.data.success) {
                onSuccess(res.data.message || 'Timetable generated successfully.');
                onClose();
            } else if (res.data.conflicts) {
                setGenerationConflicts(res.data.conflicts);
                customAlert('Timetable generation has scheduling conflicts. Please review and check "Override Conflicts" to ignore.', 'Conflict Warning');
            }
        } catch (error: any) {
            console.error(error);
            customAlert(error.response?.data?.message || 'Server error generating timetable', 'Error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                width: '100%', maxWidth: '900px',
                height: '90vh', maxHeight: '800px',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(to right, #FAF5FF, #ffffff)'
                }}>
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1E1B4B', margin: 0, letterSpacing: '-0.02em' }}>
                            Intelligent Timetable Wizard
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
                            Configure constraints and auto-generate weekly teaching slots.
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        padding: '8px', borderRadius: '12px', border: '1px solid #E2E8F0',
                        backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center'
                    }}>
                        <X size={18} color="#64748B" />
                    </button>
                </div>

                {/* Progress Tracker */}
                <div style={{ padding: '16px 32px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(s => {
                        const isActive = step === s;
                        const isCompleted = step > s;
                        return (
                            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{
                                    height: '6px', borderRadius: '3px',
                                    backgroundColor: isActive ? '#A855F7' : isCompleted ? '#22C55E' : '#E2E8F0',
                                    transition: 'all 0.3s ease'
                                }} />
                                <span style={{
                                    fontSize: '11px', fontWeight: isActive || isCompleted ? 700 : 500,
                                    color: isActive ? '#A855F7' : isCompleted ? '#22C55E' : '#94A3B8',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    Step {s}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* STEP 1: Select Classes */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Select target classes</h3>
                                <button 
                                    onClick={() => setSelectedClassIds(
                                        selectedClassIds.length === classes.length ? [] : classes.map(c => c.id)
                                    )}
                                    style={{
                                        fontSize: '13px', fontWeight: 700, color: '#A855F7', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: 0
                                    }}
                                >
                                    {selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All Classes'}
                                </button>
                            </div>
                            <input 
                                type="text"
                                placeholder="Search classes..."
                                value={searchClassQuery}
                                onChange={(e) => setSearchClassQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '14px',
                                    border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px'
                                }}
                            />
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '16px', overflowY: 'auto', maxHeight: '350px', padding: '2px'
                            }}>
                                {filteredClasses.map(c => {
                                    const isSelected = selectedClassIds.includes(c.id);
                                    return (
                                        <div 
                                            key={c.id}
                                            onClick={() => toggleClassSelection(c.id)}
                                            style={{
                                                padding: '16px 20px', borderRadius: '16px',
                                                border: isSelected ? '2px solid #A855F7' : '1.5px solid #E2E8F0',
                                                backgroundColor: isSelected ? '#FAF5FF' : '#ffffff',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                gap: '12px', transition: 'all 0.2s ease',
                                                boxShadow: isSelected ? '0 4px 12px rgba(168, 85, 247, 0.08)' : 'none'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '6px',
                                                border: '2px solid #CBD5E1', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: isSelected ? '#A855F7' : 'transparent',
                                                borderColor: isSelected ? '#A855F7' : '#CBD5E1'
                                            }}>
                                                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{c.class_name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Code: {c.class_code}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Academic Calendar (Working Days) */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Select Weekly Working Days</h3>
                            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                                Toggle the days on which classes should be auto-scheduled. Sunday is typically excluded.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {allDays.map(day => {
                                    const isActive = workingDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => toggleWorkingDay(day)}
                                            style={{
                                                padding: '14px 24px', borderRadius: '16px',
                                                border: isActive ? '2px solid #A855F7' : '1.5px solid #E2E8F0',
                                                backgroundColor: isActive ? '#FAF5FF' : '#ffffff',
                                                color: isActive ? '#A855F7' : '#475569',
                                                fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                                                transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px'
                                            }}
                                        >
                                            <Calendar size={18} />
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Daily Timing Configuration */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Daily Timing & Period Duration</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                        Institute Start Time
                                    </label>
                                    <input 
                                        type="time" 
                                        value={instituteStart}
                                        onChange={(e) => setInstituteStart(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '14px',
                                            border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                        Institute End Time
                                    </label>
                                    <input 
                                        type="time" 
                                        value={instituteEnd}
                                        onChange={(e) => setInstituteEnd(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '14px',
                                            border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                        Lecture Duration
                                    </label>
                                    <CustomSelect 
                                        value={String(lectureDuration)}
                                        onChange={(val) => setLectureDuration(Number(val))}
                                        options={[
                                            { value: '30', label: '30 Minutes' },
                                            { value: '35', label: '35 Minutes' },
                                            { value: '40', label: '40 Minutes' },
                                            { value: '45', label: '45 Minutes' },
                                            { value: '50', label: '50 Minutes' },
                                            { value: '60', label: '60 Minutes' },
                                            { value: '-1', label: 'Custom' }
                                        ]}
                                    />
                                </div>
                                {lectureDuration === -1 && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                            Custom Duration (Mins)
                                        </label>
                                        <input 
                                            type="number"
                                            value={customDuration}
                                            onChange={(e) => setCustomDuration(Number(e.target.value))}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '14px',
                                                border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '15px'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Auto calculate display */}
                            <div style={{
                                padding: '20px', borderRadius: '20px', backgroundColor: '#FAF5FF',
                                border: '1px solid #F3E8FF', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginTop: '10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Clock color="#A855F7" size={24} />
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B' }}>
                                            Total Teaching Hours: {Math.floor(totalTeachingMinutes / 60)} hrs {totalTeachingMinutes % 60} mins
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6B21A8', marginTop: '2px', fontWeight: 500 }}>
                                            Grid fits max periods calculated dynamically.
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Calculated Slots</span>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#A855F7', marginTop: '2px' }}>
                                        {dailyTimeline.totalPeriods} Periods
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Break Configuration */}
                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Configure Day Breaks</h3>
                                <button
                                    onClick={() => setHasBreaks(!hasBreaks)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '10px',
                                        border: '1px solid #E2E8F0', backgroundColor: hasBreaks ? '#FEF2F2' : '#F0FDF4',
                                        color: hasBreaks ? '#EF4444' : '#22C55E', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    {hasBreaks ? 'Disable Breaks' : 'Enable Breaks'}
                                </button>
                            </div>

                            {hasBreaks && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {breaks.map((b, idx) => (
                                        <div 
                                            key={b.id}
                                            style={{
                                                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px',
                                                gap: '16px', alignItems: 'center', padding: '16px',
                                                border: '1.5px solid #F1F5F9', borderRadius: '16px',
                                                backgroundColor: '#F8FAFC'
                                            }}
                                        >
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>Break Name</label>
                                                <input 
                                                    type="text"
                                                    value={b.break_name}
                                                    onChange={(e) => handleUpdateBreak(b.id, 'break_name', e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                                                        border: '1.5px solid #E2E8F0', backgroundColor: 'white'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>After Period</label>
                                                <CustomSelect 
                                                    value={String(b.after_period)}
                                                    onChange={(val) => handleUpdateBreak(b.id, 'after_period', Number(val))}
                                                    options={Array.from({ length: dailyTimeline.totalPeriods - 1 }).map((_, i) => ({
                                                        value: String(i + 1),
                                                        label: `Period ${i + 1}`
                                                    }))}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>Duration</label>
                                                <CustomSelect 
                                                    value={String(b.duration_minutes)}
                                                    onChange={(val) => handleUpdateBreak(b.id, 'duration_minutes', Number(val))}
                                                    options={[
                                                        { value: '15', label: '15 Mins' },
                                                        { value: '20', label: '20 Mins' },
                                                        { value: '30', label: '30 Mins' }
                                                    ]}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveBreak(b.id)}
                                                style={{
                                                    alignSelf: 'end', height: '40px', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    border: 'none', background: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={18} color="#EF4444" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddBreak}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: '1.5px dashed #CBD5E1',
                                            backgroundColor: '#ffffff', color: '#64748B', fontWeight: 700,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Plus size={16} /> Add Day Break
                                    </button>
                                </div>
                            )}

                            {/* Live timeline visual preview */}
                            <div style={{ marginTop: '10px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '10px' }}>
                                    Visual Daily Timeline Preview
                                </span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {dailyTimeline.timeline.map((item, index) => (
                                        <div 
                                            key={index}
                                            style={{
                                                padding: '10px 14px', borderRadius: '12px',
                                                backgroundColor: item.type === 'break' ? '#FEE2E2' : '#F3E8FF',
                                                border: item.type === 'break' ? '1px solid #FECDD3' : '1px solid #E9D5FF',
                                                minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '2px'
                                            }}
                                        >
                                            <span style={{ fontSize: '12px', fontWeight: 800, color: item.type === 'break' ? '#EF4444' : '#6B21A8' }}>
                                                {item.name}
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>
                                                {item.start} - {item.end}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Academic Range & Generate */}
                    {step === 5 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Target Date Range & Final Generation</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                        Start Date
                                    </label>
                                    <DatePicker
                                        selected={startDate ? new Date(startDate) : null}
                                        onChange={(d: Date | null) => setStartDate(d ? d.toISOString().split('T')[0] : '')}
                                        dateFormat="MMMM d, yyyy"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                                        End Date
                                    </label>
                                    <DatePicker
                                        selected={endDate ? new Date(endDate) : null}
                                        onChange={(d: Date | null) => setEndDate(d ? d.toISOString().split('T')[0] : '')}
                                        dateFormat="MMMM d, yyyy"
                                        customInput={<input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }} />}
                                    />
                                </div>
                            </div>

                            {/* Toggle conflicts override */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #F1F5F9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: overrideConflicts ? '#FFFBEB' : '#F8FAFC'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <AlertTriangle color={overrideConflicts ? '#D97706' : '#64748B'} size={22} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>Override scheduling conflicts</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                            If enabled, engine will bypass unplaced slot constraints and output recommendations.
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOverrideConflicts(!overrideConflicts)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '10px',
                                        backgroundColor: overrideConflicts ? '#D97706' : '#ffffff',
                                        color: overrideConflicts ? '#ffffff' : '#64748B',
                                        border: '1.5px solid #E2E8F0', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    {overrideConflicts ? 'Enabled' : 'Disabled'}
                                </button>
                            </div>

                            {/* Render conflicts if any occurred */}
                            {generationConflicts.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', display: 'block' }}>
                                        Generation Conflicts Found ({generationConflicts.length})
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                                        {generationConflicts.map((c, i) => (
                                            <div 
                                                key={i} 
                                                style={{ 
                                                    padding: '12px 16px', borderRadius: '12px', 
                                                    backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2',
                                                    fontSize: '12px', color: '#991B1B' 
                                                }}
                                            >
                                                <strong>{c.class_name}</strong>: {c.message}
                                                {c.suggestions && c.suggestions.length > 0 && (
                                                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#7F1D1D' }}>
                                                        Suggested alternatives: {c.suggestions.map((s: any) => `${s.day} Period ${s.period}`).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#FAF5FF'
                }}>
                    <button 
                        disabled={step === 1 || isGenerating}
                        onClick={() => setStep(step - 1)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '12px 20px', borderRadius: '14px', border: '1px solid #E2E8F0',
                            backgroundColor: '#ffffff', color: '#475569', fontWeight: 700,
                            cursor: 'pointer', opacity: step === 1 ? 0.5 : 1
                        }}
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    {step < 5 ? (
                        <button 
                            disabled={step === 1 && selectedClassIds.length === 0}
                            onClick={() => setStep(step + 1)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '12px 24px', borderRadius: '14px', border: 'none',
                                backgroundColor: '#A855F7', color: 'white', fontWeight: 700,
                                cursor: 'pointer', opacity: (step === 1 && selectedClassIds.length === 0) ? 0.5 : 1
                            }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            disabled={isGenerating}
                            onClick={handleGenerate}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 28px', borderRadius: '14px', border: 'none',
                                background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
                                color: 'white', fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)',
                                opacity: isGenerating ? 0.8 : 1
                            }}
                        >
                            {isGenerating ? 'Generating Schedule...' : 'Generate Timetable'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

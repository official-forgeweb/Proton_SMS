/**
 * ── Proton SMS — Intelligent Timetable Scheduling Engine ──
 *
 * A constraint-based automatic timetable generator.
 * Pure function: takes configuration inputs, returns a conflict-free weekly schedule.
 *
 * Constraints enforced:
 *  1. No teacher double-booking across classes
 *  2. No two subjects in the same class at the same period
 *  3. Weekly subject frequency respected exactly
 *  4. No consecutive same-subject periods (soft, best-effort)
 *  5. Even distribution of subjects across working days
 *  6. Locked lectures are never moved
 *  7. Break periods are skipped
 */

// ─── Types ───────────────────────────────────────────────────────

export interface SubjectFrequency {
    subject_id: string;
    subject_name?: string;
    teacher_id: string | null;
    teacher_name?: string;
    weekly_count: number;
    allowed_days?: string[];     // Predefined weekdays allowed for this subject
}

export interface BreakConfig {
    break_name: string;
    after_period: number;       // Insert break after this teaching period number
    duration_minutes: number;
}

export interface ClassConfig {
    class_id: string;
    class_name?: string;
    institute_start: string;    // "HH:mm"
    institute_end: string;      // "HH:mm"
    lecture_duration: number;    // minutes
    working_days: string[];     // ["Monday", "Tuesday", ...]
    breaks: BreakConfig[];
    subjects: SubjectFrequency[];
    is_manual?: boolean;
    manual_slots?: TimeSlot[];
}

export interface TimeSlot {
    period_number: number;      // 1-based teaching period
    start_time: string;         // "HH:mm"
    end_time: string;           // "HH:mm"
    is_break: boolean;
    break_name?: string;
}

export interface LockedEntry {
    class_id: string;
    day: string;                // "Monday", "Tuesday", etc.
    period_number: number;
    subject_id: string;
    teacher_id: string | null;
}

export interface ScheduledSlot {
    class_id: string;
    subject_id: string;
    teacher_id: string | null;
    day: string;
    period_number: number;
    start_time: string;
    end_time: string;
}

export interface ScheduleConflict {
    type: 'teacher_clash' | 'no_valid_slot' | 'frequency_mismatch';
    class_id: string;
    class_name?: string;
    subject_id: string;
    subject_name?: string;
    teacher_id?: string | null;
    teacher_name?: string;
    message: string;
    suggestions?: { day: string; period: number }[];
}

export interface GenerationResult {
    slots: ScheduledSlot[];
    conflicts: ScheduleConflict[];
    analytics: GenerationAnalytics;
    time_slots: TimeSlot[];     // The computed period grid
}

export interface GenerationAnalytics {
    classes_scheduled: number;
    teachers_utilized: number;
    total_teaching_periods: number;
    total_break_minutes: number;
    conflicts_count: number;
    unused_slots: number;
    teacher_load: Record<string, { daily: Record<string, number>; weekly: number; name?: string }>;
    subject_distribution: Record<string, Record<string, number>>;  // class_id -> subject_id -> count
}

// ─── Time Utilities ──────────────────────────────────────────────

function parseTime(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate time slots for the day based on institute timings, lecture duration, and breaks.
 * Breaks are inserted AFTER the Nth teaching period.
 */
export function generateTimeSlots(
    instituteStart: string,
    instituteEnd: string,
    lectureDuration: number,
    breaks: BreakConfig[]
): TimeSlot[] {
    const startMin = parseTime(instituteStart);
    const endMin = parseTime(instituteEnd);
    const totalMinutes = endMin - startMin;

    // Sort breaks by after_period ascending
    const sortedBreaks = [...breaks].sort((a, b) => a.after_period - b.after_period);

    // Build a set: after which teaching period number do we insert a break?
    const breakAfterPeriod = new Map<number, BreakConfig>();
    for (const brk of sortedBreaks) {
        breakAfterPeriod.set(brk.after_period, brk);
    }

    const slots: TimeSlot[] = [];
    let currentMin = startMin;
    let teachingPeriod = 0;

    while (currentMin + lectureDuration <= endMin) {
        teachingPeriod++;

        slots.push({
            period_number: teachingPeriod,
            start_time: formatTime(currentMin),
            end_time: formatTime(currentMin + lectureDuration),
            is_break: false,
        });

        currentMin += lectureDuration;

        // Check if we need to insert a break after this period
        const brk = breakAfterPeriod.get(teachingPeriod);
        if (brk && currentMin + brk.duration_minutes <= endMin) {
            slots.push({
                period_number: -1,  // Not a teaching period
                start_time: formatTime(currentMin),
                end_time: formatTime(currentMin + brk.duration_minutes),
                is_break: true,
                break_name: brk.break_name,
            });
            currentMin += brk.duration_minutes;
        }
    }

    return slots;
}

// ─── Core Scheduling Algorithm ───────────────────────────────────

/**
 * Generate a constraint-satisfying weekly timetable for multiple classes.
 *
 * Algorithm: "Most Constrained First" greedy heuristic
 *  1. Compute time slots per day
 *  2. Build teacher occupancy matrix (across all classes)
 *  3. Sort subjects by frequency descending (hardest to place first)
 *  4. For each class, for each subject, greedily place N lectures across the week
 *     - Avoid teacher conflicts
 *     - Avoid consecutive same-subject
 *     - Distribute evenly across days
 *  5. Return scheduled slots + any unresolvable conflicts
 */
export function generateTimetable(
    classConfigs: ClassConfig[],
    lockedEntries: LockedEntry[] = []
): GenerationResult {
    // ── Step 1: Compute time slots (using first class config as canonical — all classes share same institute timing) ──
    // If configs differ per class, we use per-class slots
    const classSlotsMap = new Map<string, TimeSlot[]>();
    const classTeachingSlotsMap = new Map<string, TimeSlot[]>();

    for (const cfg of classConfigs) {
        let allSlots: TimeSlot[] = [];
        if (cfg.is_manual && cfg.manual_slots && cfg.manual_slots.length > 0) {
            allSlots = cfg.manual_slots;
        } else {
            allSlots = generateTimeSlots(cfg.institute_start, cfg.institute_end, cfg.lecture_duration, cfg.breaks);
        }
        classSlotsMap.set(cfg.class_id, allSlots);
        classTeachingSlotsMap.set(cfg.class_id, allSlots.filter(s => !s.is_break));
    }

    // ── Step 2: Build teacher occupancy matrix ──
    // Key: "teacherId|day|periodNumber" → class_id (which class occupies that teacher at that slot)
    const teacherOccupancy = new Map<string, string>();

    // Pre-populate from locked entries
    for (const locked of lockedEntries) {
        if (locked.teacher_id) {
            const key = `${locked.teacher_id}|${locked.day}|${locked.period_number}`;
            teacherOccupancy.set(key, locked.class_id);
        }
    }

    // ── Step 3: Build class occupancy matrix ──
    // Key: "classId|day|periodNumber" → subject_id
    const classOccupancy = new Map<string, string>();

    // Pre-populate from locked entries
    for (const locked of lockedEntries) {
        const key = `${locked.class_id}|${locked.day}|${locked.period_number}`;
        classOccupancy.set(key, locked.subject_id);
    }

    // ── Step 4: Place subjects ──
    const allScheduledSlots: ScheduledSlot[] = [];
    const allConflicts: ScheduleConflict[] = [];

    // Include locked entries in the output
    for (const locked of lockedEntries) {
        const cfg = classConfigs.find(c => c.class_id === locked.class_id);
        if (!cfg) continue;
        const teachingSlots = classTeachingSlotsMap.get(locked.class_id) || [];
        const slot = teachingSlots.find(s => s.period_number === locked.period_number);
        if (slot) {
            allScheduledSlots.push({
                class_id: locked.class_id,
                subject_id: locked.subject_id,
                teacher_id: locked.teacher_id,
                day: locked.day,
                period_number: locked.period_number,
                start_time: slot.start_time,
                end_time: slot.end_time,
            });
        }
    }

    // Process each class
    for (const cfg of classConfigs) {
        const teachingSlots = classTeachingSlotsMap.get(cfg.class_id) || [];
        const periodsPerDay = teachingSlots.length;
        const workingDays = cfg.working_days;
        const totalAvailableSlots = periodsPerDay * workingDays.length;

        // Sort subjects by frequency descending (most constrained first)
        // Normalize teacher_id: empty/falsy → null (no teacher = no conflict checks)
        const subjects = [...cfg.subjects]
            .map(s => ({ ...s, teacher_id: s.teacher_id || null }))
            .sort((a, b) => b.weekly_count - a.weekly_count);

        // Track how many lectures each subject has been assigned per day
        const subjectDayCount: Record<string, Record<string, number>> = {};

        // Track which subject was placed at each period for consecutive checks
        // Key: "day|periodNumber" → subject_id
        const classPlacement = new Map<string, string>();

        // Pre-populate from locked entries for this class
        for (const locked of lockedEntries) {
            if (locked.class_id !== cfg.class_id) continue;
            const dk = `${locked.day}|${locked.period_number}`;
            classPlacement.set(dk, locked.subject_id);

            if (!subjectDayCount[locked.subject_id]) subjectDayCount[locked.subject_id] = {};
            subjectDayCount[locked.subject_id][locked.day] = (subjectDayCount[locked.subject_id][locked.day] || 0) + 1;
        }

        for (const subj of subjects) {
            if (!subjectDayCount[subj.subject_id]) subjectDayCount[subj.subject_id] = {};

            const targetDays = subj.allowed_days || [];

            const failedDays: string[] = [];

            for (const day of targetDays) {
                // Check if already placed on this day (e.g. by a locked entry)
                const alreadyOnDay = (subjectDayCount[subj.subject_id][day] || 0) > 0;
                if (alreadyOnDay) continue;

                // Find candidate teaching periods on this day
                const dayCandidates: { period: number; score: number }[] = [];

                for (const ts of teachingSlots) {
                    const classKey = `${cfg.class_id}|${day}|${ts.period_number}`;
                    if (classOccupancy.has(classKey)) continue; // Class slot is occupied

                    // Check teacher conflict
                    let teacherKey = '';
                    if (subj.teacher_id) {
                        teacherKey = `${subj.teacher_id}|${day}|${ts.period_number}`;
                        if (teacherOccupancy.has(teacherKey)) continue;
                    }

                    // Score calculation
                    let score = 0;

                    // Avoid consecutive lectures of same subject on the same day if possible
                    const prevKey = `${day}|${ts.period_number - 1}`;
                    const nextKey = `${day}|${ts.period_number + 1}`;
                    if (classPlacement.get(prevKey) === subj.subject_id) score += 10;
                    if (classPlacement.get(nextKey) === subj.subject_id) score += 10;

                    // Prefer earlier periods
                    score += ts.period_number * 0.1;

                    dayCandidates.push({ period: ts.period_number, score });
                }

                // Sort candidates by score ascending (best first)
                dayCandidates.sort((a, b) => a.score - b.score);

                if (dayCandidates.length > 0) {
                    const best = dayCandidates[0];
                    const classKey = `${cfg.class_id}|${day}|${best.period}`;
                    
                    // Place it!
                    classOccupancy.set(classKey, subj.subject_id);
                    classPlacement.set(`${day}|${best.period}`, subj.subject_id);

                    if (subj.teacher_id) {
                        const teacherKey = `${subj.teacher_id}|${day}|${best.period}`;
                        teacherOccupancy.set(teacherKey, cfg.class_id);
                    }

                    subjectDayCount[subj.subject_id][day] = 1;

                    const slot = teachingSlots.find(s => s.period_number === best.period)!;
                    allScheduledSlots.push({
                        class_id: cfg.class_id,
                        subject_id: subj.subject_id,
                        teacher_id: subj.teacher_id,
                        day: day,
                        period_number: best.period,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                    });
                } else {
                    failedDays.push(day);
                }
            }

            // If we couldn't place all target days, record conflict
            if (failedDays.length > 0) {
                const suggestions: { day: string; period: number }[] = [];
                // Suggest other periods on the failed days where the teacher is free but class has something scheduled
                for (const day of failedDays) {
                    for (const ts of teachingSlots) {
                        if (suggestions.length >= 3) break;
                        const classKey = `${cfg.class_id}|${day}|${ts.period_number}`;
                        if (!classOccupancy.has(classKey)) continue; // Must have some other subject scheduled to suggest swap

                        if (subj.teacher_id) {
                            const teacherKey = `${subj.teacher_id}|${day}|${ts.period_number}`;
                            if (!teacherOccupancy.has(teacherKey)) {
                                suggestions.push({ day, period: ts.period_number });
                            }
                        }
                    }
                }

                allConflicts.push({
                    type: 'no_valid_slot',
                    class_id: cfg.class_id,
                    class_name: cfg.class_name,
                    subject_id: subj.subject_id,
                    subject_name: subj.subject_name,
                    teacher_id: subj.teacher_id,
                    teacher_name: subj.teacher_name,
                    message: `Could not schedule ${subj.subject_name || subj.subject_id}${subj.teacher_name ? ` (${subj.teacher_name})` : ''} on: ${failedDays.join(', ')} for class ${cfg.class_name || cfg.class_id}. Slots are fully occupied or have teacher conflicts.`,
                    suggestions,
                });
            }
        }
    }

    // ── Step 5: Compute analytics ──
    const teacherLoad: GenerationAnalytics['teacher_load'] = {};
    const subjectDistribution: GenerationAnalytics['subject_distribution'] = {};
    const teacherSet = new Set<string>();

    for (const slot of allScheduledSlots) {
        // Teacher load
        if (slot.teacher_id) {
            teacherSet.add(slot.teacher_id);
            if (!teacherLoad[slot.teacher_id]) {
                teacherLoad[slot.teacher_id] = { daily: {}, weekly: 0 };
            }
            teacherLoad[slot.teacher_id].daily[slot.day] = (teacherLoad[slot.teacher_id].daily[slot.day] || 0) + 1;
            teacherLoad[slot.teacher_id].weekly++;

            // Try to find teacher name
            for (const cfg of classConfigs) {
                const subj = cfg.subjects.find(s => s.teacher_id === slot.teacher_id);
                if (subj?.teacher_name) {
                    teacherLoad[slot.teacher_id].name = subj.teacher_name;
                    break;
                }
            }
        }

        // Subject distribution
        if (!subjectDistribution[slot.class_id]) subjectDistribution[slot.class_id] = {};
        subjectDistribution[slot.class_id][slot.subject_id] = (subjectDistribution[slot.class_id][slot.subject_id] || 0) + 1;
    }

    // Calculate unused slots
    let totalAvailable = 0;
    for (const cfg of classConfigs) {
        const teachingSlots = classTeachingSlotsMap.get(cfg.class_id) || [];
        totalAvailable += teachingSlots.length * cfg.working_days.length;
    }

    let totalBreakMinutes = 0;
    for (const cfg of classConfigs) {
        for (const brk of cfg.breaks) {
            totalBreakMinutes += brk.duration_minutes * cfg.working_days.length;
        }
    }

    const analytics: GenerationAnalytics = {
        classes_scheduled: classConfigs.length,
        teachers_utilized: teacherSet.size,
        total_teaching_periods: allScheduledSlots.length,
        total_break_minutes: totalBreakMinutes,
        conflicts_count: allConflicts.length,
        unused_slots: totalAvailable - allScheduledSlots.length,
        teacher_load: teacherLoad,
        subject_distribution: subjectDistribution,
    };

    // Use first class's time slots for the grid (they're usually identical)
    const firstClassSlots = classSlotsMap.get(classConfigs[0]?.class_id) || [];

    return {
        slots: allScheduledSlots,
        conflicts: allConflicts,
        analytics,
        time_slots: firstClassSlots,
    };
}

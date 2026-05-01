const fs = require('fs');
const path = require('path');

const file = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/timetable/AdminTimetableClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix imports
content = content.replace(
  /import \{ useEffect, useState, useCallback \} from 'react';/,
  "import { useEffect, useState, useCallback, useMemo } from 'react';"
);

content = content.replace(
  /import \{\s*Calendar, Plus, Clock, Trash2, Edit2, AlertTriangle,\s*CheckCircle, X, MapPin, User, ChevronRight, Filter\s*\} from 'lucide-react';/,
  "import { Calendar, Plus, Clock, Trash2, Edit2, AlertTriangle, CheckCircle, X, MapPin, User, ChevronRight, ChevronLeft, Filter, Layers } from 'lucide-react';"
);

// 2. Add utils before interface Props
const utils = `
const SUBJECT_PALETTES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    'Physics':     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
    'Chemistry':   { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', dot: '#F97316' },
    'Mathematics': { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
    'Maths':       { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', dot: '#8B5CF6' },
    'Biology':     { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E' },
    'English':     { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', dot: '#EC4899' },
    'Hindi':       { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
    'SST':         { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
    'Computer':    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', dot: '#0EA5E9' },
};

const getSubjectPalette = (subject: string) =>
    SUBJECT_PALETTES[subject] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', dot: '#94A3B8' };

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getWeekDates(refDate: Date) {
    const d = new Date(refDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        dates.push(dt);
    }
    return dates;
}

function formatDateStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return \`\${y}-\${m}-\${day}\`;
}

function formatTime12(time24: string) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return \`\${hour}:\${String(m).padStart(2, '0')} \${ampm}\`;
}

interface Props {`;

content = content.replace(/interface Props \{/, utils);

// We need to do the rest of the updates. Since I already have the script, I will just let it run.
fs.writeFileSync(file, content);
console.log('Fixed imports and utils');

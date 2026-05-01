const fs = require('fs');

const adminPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/timetable/AdminTimetableClient.tsx';
const studentPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/student/timetable/page.tsx';

let adminCode = fs.readFileSync(adminPath, 'utf8');
const studentCode = fs.readFileSync(studentPath, 'utf8');

// Inject state variables
const stateVars = `
    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
    
    const todayRef = useMemo(() => new Date(), []);
    const weekDates = useMemo(() => {
        const ref = new Date(todayRef);
        ref.setDate(ref.getDate() + weekOffset * 7);
        return getWeekDates(ref);
    }, [todayRef, weekOffset]);

    const todayStr = formatDateStr(new Date());

    const entriesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        timetable
            .filter(entry => {
                if (localFilters.subject && entry.subject !== localFilters.subject) return false;
                if (localFilters.teacher_id && entry.teacher_id !== localFilters.teacher_id) return false;
                if (localFilters.room && entry.room && !entry.room.toLowerCase().includes(localFilters.room.toLowerCase())) return false;
                return true;
            })
            .forEach(entry => {
                if (!map[entry.date]) map[entry.date] = [];
                map[entry.date].push(entry);
            });
        Object.values(map).forEach(arr => arr.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
        return map;
    }, [timetable, localFilters]);
`;

adminCode = adminCode.replace(
  /const \[sortBy, setSortBy\] = useState\('date_asc'\);/,
  "const [sortBy, setSortBy] = useState('date_asc');\n" + stateVars
);

// Extract UI from student code
const uiMatch = studentCode.match(/\{\/\* ── Top Bar: View Toggle \+ Nav \+ Filter ── \*\/\}[\s\S]*?(?=\{\/\* ── Quick Stats ── \*\/})/);
const topBar = uiMatch ? uiMatch[0] : '';

// Fix Top Bar to not include student filters, just the Week Nav & View Toggle
const customTopBar = `
                {/* ── Top Bar: View Toggle + Nav ── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '24px',
                    padding: '14px 20px', background: 'white', borderRadius: '16px',
                    border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
                        <button onClick={() => setViewMode('week')} style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: viewMode === 'week' ? 'white' : 'transparent', color: viewMode === 'week' ? '#1A1D3B' : '#94A3B8', boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                            <Layers size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Week
                        </button>
                        <button onClick={() => setViewMode('day')} style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: viewMode === 'day' ? 'white' : 'transparent', color: viewMode === 'day' ? '#1A1D3B' : '#94A3B8', boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                            <Calendar size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} />Day
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={18} color="#64748B" />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1A1D3B', minWidth: '180px', textAlign: 'center' }}>
                            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={18} color="#64748B" />
                        </button>
                        {weekOffset !== 0 && (
                            <button onClick={() => setWeekOffset(0)} style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: '#4F46E5', fontWeight: 700, fontSize: '12px' }}>
                                Today
                            </button>
                        )}
                    </div>
                </div>
`;

// Extract Week Grid from student code
const gridMatch = studentCode.match(/\{\/\* ── WEEK GRID VIEW ── \*\/\}[\s\S]*?(?=\{\/\* ── DAY VIEW ── \*\/})/);
let weekGrid = gridMatch ? gridMatch[0] : '';

// Extract Day View from student code
const dayMatch = studentCode.match(/\{\/\* ── DAY VIEW ── \*\/\}[\s\S]*?(?=\) \:\()/);
let dayView = dayMatch ? dayMatch[0] : '';

// We need to inject admin edit/delete buttons into the cards in weekGrid and dayView.
const adminButtons = `
<div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '8px', right: '8px' }}>
    <button onClick={(e) => { e.stopPropagation(); openModal(entry); }} style={{ padding: '4px', borderRadius: '6px', background: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Edit2 size={12} color="#5E6278" /></button>
    <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} style={{ padding: '4px', borderRadius: '6px', background: '#FEF2F2', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}><Trash2 size={12} color="#DC2626" /></button>
</div>
`;

// Add position relative to cards
weekGrid = weekGrid.replace(/cursor: 'default',/g, "cursor: 'default', position: 'relative',");
weekGrid = weekGrid.replace(/(<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' \}\}>)/g, adminButtons + "$1");

dayView = dayView.replace(/position: 'relative', overflow: 'hidden'/g, "position: 'relative', overflow: 'hidden'");
dayView = dayView.replace(/(<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' \}\}>)/g, adminButtons + "$1");

// Replace the old list view in admin
const oldViewRegex = /<div style=\{\{ display: 'grid', gap: '16px' \}\}>\\s*\{\[\\.\\.\\.timetable\][\s\S]*?\}\)\\s*<\/div>/;
const newView = `
    {viewMode === 'week' ? (
        ` + weekGrid + `
    ) : (
        ` + dayView + `
    )}
`;

adminCode = adminCode.replace(oldViewRegex, newView);
adminCode = adminCode.replace(/<div className="page-body">/, '<div className="page-body">\n' + customTopBar);

fs.writeFileSync(adminPath, adminCode);
console.log('Successfully updated AdminTimetableClient.tsx UI');

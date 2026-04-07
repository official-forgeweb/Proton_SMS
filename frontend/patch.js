const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'students', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Download to lucide-react imports
content = content.replace(
    /Eye, TrendingUp\n} from 'lucide-react';/,
    "Eye, TrendingUp, Download\n} from 'lucide-react';"
);

// 2. Extract CSS
const styleMatch = content.match(/<style dangerouslySetInnerHTML=\{\{__html: `([\s\S]*?)`\}\} \/>/);
if (styleMatch) {
    // Remove it from inside DashboardLayout
    content = content.replace(styleMatch[0], '{INLINE_STYLES}');
    
    // Add INLINE_STYLES above the component
    const inlineStylesDef = `const INLINE_STYLES = (\n    <style dangerouslySetInnerHTML={{__html: \`${styleMatch[1]}\`}} />\n);\n\nexport default function StudentsPage() {`;
    content = content.replace('export default function StudentsPage() {', inlineStylesDef);
}

// 3. Add Export function and button
const exportFunc = `
    const exportToExcel = async () => {
        try {
            const params = { limit: 1000000 };
            if (search) params.search = search;
            if (selectedBatch) params.class_id = selectedBatch;
            if (selectedSubject) params.subject = selectedSubject;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedFeeStatus) params.fee_status = selectedFeeStatus;
            
            const res = await api.get('/students', { params });
            const allStudents = res.data.data || [];
            
            const headers = ['PRO_ID', 'First Name', 'Last Name', 'Class Name', 'Subjects', 'Phone', 'Email', 'Fee Status', 'Attendance %', 'Academic Status', 'Gender'];
            const csvRows = [headers.join(',')];
            
            allStudents.forEach(s => {
                const row = [
                    s.PRO_ID || '', s.first_name || '', s.last_name || '',
                    s.classes?.[0]?.name || 'None',
                    (s.subjects?.map(sub => sub.subject) || []).join('; '),
                    s.phone || '', s.email || '',
                    s.fee_status || 'pending', s.attendance_percentage || 0,
                    s.academic_status || 'active', s.gender || ''
                ];
                csvRows.push(row.map(v => \`"\\$\\{String(v).replace(/"/g, '""')\\}"\`).join(','));
            });
            
            const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = \`Students_Export_\\$\\{new Date().toISOString().split('T')[0]\\}.csv\`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Failed to export data');
        }
    };

    return (
`;

// Note: In the node.js file, \$\\{var\\} prints as \${var} in JS literal so string evaluation matches real template literal format in the output file!
content = content.replace(/\\$exportFuncCodePlaceHolder/, 'dummy');

// Actually let's use standard replacement just literally injecting right before 'return ('
content = content.replace('    return (\\n        <DashboardLayout', exportFunc.replace(/\\$exportFuncCodePlaceHolder/g, '') + '        <DashboardLayout');


const buttonCode = `
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={exportToExcel}
                            style={{
                                background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                                borderRadius: '14px', padding: '12px 20px', fontSize: '15px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget.style.transform = 'translateY(-2px)');
                                (e.currentTarget.style.borderColor = '#A1A5B7');
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget.style.transform = 'translateY(0)');
                                (e.currentTarget.style.borderColor = '#E2E8F0');
                            }}
                        >
                            <Download size={20} strokeWidth={2.5} color="#5E6278" /> Export
                        </button>
                        <button`;
content = content.replace('                    <button', buttonCode);
content = content.replace('                        <Plus size={20} strokeWidth={2.5} /> Add Student\\n                    </button>', '                        <Plus size={20} strokeWidth={2.5} /> Add Student\\n                        </button>\\n                    </div>');

fs.writeFileSync(filePath, content);
console.log("File patched successfully!");
